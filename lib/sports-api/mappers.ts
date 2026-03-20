/**
 * Маппинг данных из Sports API в MatchData.
 * Собирает ~10 параллельных запросов и формирует структурированный объект.
 */

import type { MatchData, TeamStats, Absence, H2HGame, FormResult, BookmakerOdds } from '@/lib/types/report'
import type { Sport, FoundFixture, ApiFixture, ApiGame, ApiInjury, ApiOdds, ApiStanding } from './client'
import {
  getLastFixtures, getH2HFootball, getInjuries, getOdds, getStandings, getTeamStatistics,
  getGamesHockey, getH2HHockey, getStandingsHockey,
  getGamesBasketball, getH2HBasketball, getStandingsBasketball,
} from './client'
import { calcMetrics } from '@/lib/calculations/metrics'

// ── Football mapper ──

function fixtureToFormResult(fixture: ApiFixture, teamId: number): FormResult {
  const isHome = fixture.teams.home.id === teamId
  const winner = isHome ? fixture.teams.home.winner : fixture.teams.away.winner
  if (winner === true) return 'W'
  if (winner === false) return 'L'
  return 'D'
}

function fixtureToH2H(fixture: ApiFixture): H2HGame {
  return {
    date: new Date(fixture.fixture.date).toLocaleDateString('ru-RU'),
    score: `${fixture.goals.home ?? 0}:${fixture.goals.away ?? 0}`,
    competition: fixture.league.name,
  }
}

function mapInjuries(injuries: ApiInjury[], teamId: number): Absence[] {
  return injuries
    .filter(i => i.team.id === teamId)
    .map(i => ({
      name: i.player.name,
      role: i.player.type || 'Игрок',
      reason: (i.player.reason?.toLowerCase().includes('suspen') ? 'suspension' : 'injury') as Absence['reason'],
      details: i.player.reason,
      impact: 'key' as const, // API не даёт impact, ставим key по умолчанию
    }))
}

function mapOdds(apiOdds: ApiOdds[]): BookmakerOdds[] {
  if (!apiOdds.length) return []

  const result: BookmakerOdds[] = []
  for (const oddsData of apiOdds) {
    for (const bk of oddsData.bookmakers ?? []) {
      const matchWinner = bk.bets.find(b =>
        b.name === 'Match Winner' || b.name === 'Home/Away' || b.name === '1X2'
      )
      if (!matchWinner) continue

      const values: Record<string, number> = {}
      for (const v of matchWinner.values) {
        const label = v.value === 'Home' ? 'П1' : v.value === 'Draw' ? 'X' : v.value === 'Away' ? 'П2' : v.value
        values[label] = parseFloat(v.odd)
      }

      if (Object.keys(values).length > 0) {
        result.push({ name: bk.name, values })
      }
    }
  }
  return result.slice(0, 5) // макс 5 букмекеров
}

function findTeamInStandings(standings: ApiStanding[][], teamId: number): ApiStanding | undefined {
  for (const group of standings) {
    const found = group.find(s => s.team.id === teamId)
    if (found) return found
  }
  return undefined
}

// ── Game (hockey/basketball) to FormResult ──

function gameToFormResult(game: ApiGame, teamId: number): FormResult {
  const isHome = game.teams.home.id === teamId
  const myScore = isHome ? game.scores.home.total : game.scores.away.total
  const oppScore = isHome ? game.scores.away.total : game.scores.home.total
  if (myScore == null || oppScore == null) return 'D'
  if (myScore > oppScore) return 'W'
  if (myScore < oppScore) return 'L'
  return 'D'
}

function gameToH2H(game: ApiGame): H2HGame {
  return {
    date: new Date(game.date).toLocaleDateString('ru-RU'),
    score: `${game.scores.home.total ?? 0}:${game.scores.away.total ?? 0}`,
    competition: game.league.name,
  }
}

// ── Main builder ──

export async function buildMatchDataFromAPI(
  sport: Sport,
  fixture: FoundFixture,
): Promise<Omit<MatchData, 'contextFactors'>> {
  const homeId = fixture.homeTeam.id
  const awayId = fixture.awayTeam.id
  const leagueId = fixture.league.id
  const season = typeof fixture.league.season === 'number'
    ? fixture.league.season
    : parseInt(fixture.league.season) || new Date().getFullYear()

  if (sport === 'football') {
    return buildFootballMatchData(fixture, homeId, awayId, leagueId, season)
  }

  // Hockey / Basketball
  return buildGameMatchData(sport, fixture, homeId, awayId, leagueId, season)
}

async function buildFootballMatchData(
  fixture: FoundFixture,
  homeId: number,
  awayId: number,
  leagueId: number,
  season: number,
): Promise<Omit<MatchData, 'contextFactors'>> {
  // ~10 параллельных запросов
  const [
    homeLast, awayLast, h2h, injuries, odds, standingsRes, homeStats, awayStats,
  ] = await Promise.all([
    getLastFixtures(homeId, 10),
    getLastFixtures(awayId, 10),
    getH2HFootball(homeId, awayId, 5),
    getInjuries(fixture.id).catch(() => [] as ApiInjury[]),
    getOdds(fixture.id).catch(() => [] as ApiOdds[]),
    getStandings(leagueId, season).catch(() => []),
    getTeamStatistics(homeId, leagueId, season).catch(() => []),
    getTeamStatistics(awayId, leagueId, season).catch(() => []),
  ])

  // Form
  const homeForm = homeLast.slice(0, 5).map(f => fixtureToFormResult(f, homeId))
  const awayForm = awayLast.slice(0, 5).map(f => fixtureToFormResult(f, awayId))
  const homeRecord = homeLast.filter(f => f.teams.home.id === homeId).slice(0, 5).map(f => fixtureToFormResult(f, homeId))
  const awayRecord = awayLast.filter(f => f.teams.away.id === awayId).slice(0, 5).map(f => fixtureToFormResult(f, awayId))

  // H2H
  const h2hHomeWins = h2h.filter(f => f.teams.home.winner === true && f.teams.home.id === homeId || f.teams.away.winner === true && f.teams.away.id === homeId).length
  const h2hAwayWins = h2h.filter(f => f.teams.home.winner === true && f.teams.home.id === awayId || f.teams.away.winner === true && f.teams.away.id === awayId).length
  const h2hDraws = h2h.filter(f => f.teams.home.winner === null).length

  // Metrics
  const homeMetrics = calcMetrics(homeLast.map(f => ({
    goalsFor: f.teams.home.id === homeId ? (f.goals.home ?? 0) : (f.goals.away ?? 0),
    goalsAgainst: f.teams.home.id === homeId ? (f.goals.away ?? 0) : (f.goals.home ?? 0),
  })))
  const awayMetrics = calcMetrics(awayLast.map(f => ({
    goalsFor: f.teams.away.id === awayId ? (f.goals.away ?? 0) : (f.goals.home ?? 0),
    goalsAgainst: f.teams.away.id === awayId ? (f.goals.home ?? 0) : (f.goals.away ?? 0),
  })))

  // Standings for standings context
  const allStandings = standingsRes[0]?.league?.standings ?? []
  const homeStanding = findTeamInStandings(allStandings, homeId)
  const awayStanding = findTeamInStandings(allStandings, awayId)

  // Team stats from API
  const homeAPIStats = homeStats[0]
  const awayAPIStats = awayStats[0]

  const homeTeamStats: TeamStats = {
    goalsScored: homeMetrics.avgGoalsScored,
    goalsConceded: homeMetrics.avgGoalsConceded,
    shotsOnTarget: 0, // API-Football team stats don't give per-game shots easily
    possession: 0,
    corners: 0,
    yellowCards: 0,
    cleanSheets: homeAPIStats?.clean_sheet?.total ?? homeMetrics.cleanSheets,
    bttsPct: homeMetrics.bttsPct,
    over25Pct: homeMetrics.over25Pct,
  }

  const awayTeamStats: TeamStats = {
    goalsScored: awayMetrics.avgGoalsScored,
    goalsConceded: awayMetrics.avgGoalsConceded,
    shotsOnTarget: 0,
    possession: 0,
    corners: 0,
    yellowCards: 0,
    cleanSheets: awayAPIStats?.clean_sheet?.total ?? awayMetrics.cleanSheets,
    bttsPct: awayMetrics.bttsPct,
    over25Pct: awayMetrics.over25Pct,
  }

  const fixtureDate = new Date(fixture.date)

  return {
    context: {
      sport: 'football',
      homeTeam: fixture.homeTeam.name,
      awayTeam: fixture.awayTeam.name,
      competition: fixture.league.name,
      round: fixture.round,
      date: fixtureDate.toLocaleDateString('ru-RU'),
      time: fixtureDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      venue: fixture.venue,
      motivation: {
        home: guessMotivation(homeStanding),
        away: guessMotivation(awayStanding),
      },
    },
    form: {
      home: { last5: homeForm, streak: calcStreak(homeForm), homeRecord },
      away: { last5: awayForm, streak: calcStreak(awayForm), awayRecord },
    },
    h2h: {
      homeWins: h2hHomeWins,
      awayWins: h2hAwayWins,
      draws: h2hDraws,
      recentGames: h2h.map(fixtureToH2H),
    },
    stats: { home: homeTeamStats, away: awayTeamStats },
    injuries: {
      home: mapInjuries(injuries, homeId),
      away: mapInjuries(injuries, awayId),
    },
    odds: { bookmakers: mapOdds(odds) },
  }
}

async function buildGameMatchData(
  sport: Sport,
  fixture: FoundFixture,
  homeId: number,
  awayId: number,
  leagueId: number,
  season: number,
): Promise<Omit<MatchData, 'contextFactors'>> {
  const isHockey = sport === 'hockey'
  const getGames = isHockey ? getGamesHockey : getGamesBasketball
  const getH2H = isHockey ? getH2HHockey : getH2HBasketball

  const [homeLast, awayLast, h2h] = await Promise.all([
    isHockey
      ? getGamesHockey(homeId, undefined, 10, season)
      : getGamesBasketball(homeId, undefined, 10, String(season)),
    isHockey
      ? getGamesHockey(awayId, undefined, 10, season)
      : getGamesBasketball(awayId, undefined, 10, String(season)),
    getH2H(homeId, awayId, 5),
  ])

  const homeForm = homeLast.slice(0, 5).map(g => gameToFormResult(g, homeId))
  const awayForm = awayLast.slice(0, 5).map(g => gameToFormResult(g, awayId))
  const homeRecord = homeLast.filter(g => g.teams.home.id === homeId).slice(0, 5).map(g => gameToFormResult(g, homeId))
  const awayRecord = awayLast.filter(g => g.teams.away.id === awayId).slice(0, 5).map(g => gameToFormResult(g, awayId))

  const h2hHomeWins = h2h.filter(g => {
    const isHome = g.teams.home.id === homeId
    const myScore = isHome ? g.scores.home.total : g.scores.away.total
    const oppScore = isHome ? g.scores.away.total : g.scores.home.total
    return myScore != null && oppScore != null && myScore > oppScore
  }).length
  const h2hAwayWins = h2h.filter(g => {
    const isHome = g.teams.home.id === awayId
    const myScore = isHome ? g.scores.home.total : g.scores.away.total
    const oppScore = isHome ? g.scores.away.total : g.scores.home.total
    return myScore != null && oppScore != null && myScore > oppScore
  }).length
  const h2hDraws = h2h.length - h2hHomeWins - h2hAwayWins

  const homeMetrics = calcMetrics(homeLast.map(g => ({
    goalsFor: g.teams.home.id === homeId ? (g.scores.home.total ?? 0) : (g.scores.away.total ?? 0),
    goalsAgainst: g.teams.home.id === homeId ? (g.scores.away.total ?? 0) : (g.scores.home.total ?? 0),
  })))
  const awayMetrics = calcMetrics(awayLast.map(g => ({
    goalsFor: g.teams.away.id === awayId ? (g.scores.away.total ?? 0) : (g.scores.home.total ?? 0),
    goalsAgainst: g.teams.away.id === awayId ? (g.scores.home.total ?? 0) : (g.scores.away.total ?? 0),
  })))

  const fixtureDate = new Date(fixture.date)

  return {
    context: {
      sport,
      homeTeam: fixture.homeTeam.name,
      awayTeam: fixture.awayTeam.name,
      competition: fixture.league.name,
      date: fixtureDate.toLocaleDateString('ru-RU'),
      time: fixtureDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      venue: fixture.venue,
      motivation: {
        home: { level: 'medium', reason: 'Нет данных о мотивации' },
        away: { level: 'medium', reason: 'Нет данных о мотивации' },
      },
    },
    form: {
      home: { last5: homeForm, streak: calcStreak(homeForm), homeRecord },
      away: { last5: awayForm, streak: calcStreak(awayForm), awayRecord },
    },
    h2h: {
      homeWins: h2hHomeWins,
      awayWins: h2hAwayWins,
      draws: h2hDraws,
      recentGames: h2h.map(gameToH2H),
    },
    stats: {
      home: {
        goalsScored: homeMetrics.avgGoalsScored,
        goalsConceded: homeMetrics.avgGoalsConceded,
        shotsOnTarget: 0,
        possession: 0,
        corners: 0,
        yellowCards: 0,
        cleanSheets: homeMetrics.cleanSheets,
        bttsPct: homeMetrics.bttsPct,
        over25Pct: homeMetrics.over25Pct,
      },
      away: {
        goalsScored: awayMetrics.avgGoalsScored,
        goalsConceded: awayMetrics.avgGoalsConceded,
        shotsOnTarget: 0,
        possession: 0,
        corners: 0,
        yellowCards: 0,
        cleanSheets: awayMetrics.cleanSheets,
        bttsPct: awayMetrics.bttsPct,
        over25Pct: awayMetrics.over25Pct,
      },
    },
    injuries: { home: [], away: [] }, // Hockey/Basketball API не дают травмы
    odds: { bookmakers: [] }, // Odds тоже ограничены
  }
}

// ── Helpers ──

function calcStreak(form: FormResult[]): string {
  if (!form.length) return '0'
  const first = form[0]
  let count = 0
  for (const r of form) {
    if (r === first) count++
    else break
  }
  return `${count}${first}`
}

function guessMotivation(standing?: ApiStanding): { level: 'high' | 'medium' | 'low'; reason: string } {
  if (!standing) return { level: 'medium', reason: 'Нет данных о турнирном положении' }

  if (standing.rank <= 3) return { level: 'high', reason: `${standing.rank}-е место, борьба за чемпионство` }
  if (standing.rank <= 6) return { level: 'medium', reason: `${standing.rank}-е место, еврокубки/плей-офф` }
  // Check relegation zone (usually bottom 3 in most leagues)
  return { level: 'low', reason: `${standing.rank}-е место` }
}
