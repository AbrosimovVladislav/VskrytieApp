/**
 * Sports API client — обёртка для API-Football, API-Hockey, API-Basketball.
 * Все три используют один API-ключ (api-sports.io).
 */

export type Sport = 'football' | 'hockey' | 'basketball'

const API_KEY = process.env.SPORTS_API_KEY ?? ''

const BASE_URLS: Record<Sport, string> = {
  football: 'https://v3.football.api-sports.io',
  hockey: 'https://v1.hockey.api-sports.io',
  basketball: 'https://v1.basketball.api-sports.io',
}

// ── Raw API response types ──

export interface ApiTeam {
  id: number
  name: string
  logo: string
}

export interface ApiFixture {
  fixture: {
    id: number
    date: string
    venue?: { name: string; city: string }
    status: { short: string }
  }
  league: {
    id: number
    name: string
    season: number
    round?: string
  }
  teams: {
    home: { id: number; name: string; winner: boolean | null }
    away: { id: number; name: string; winner: boolean | null }
  }
  goals: { home: number | null; away: number | null }
  score?: {
    fulltime?: { home: number | null; away: number | null }
  }
}

// Hockey/Basketball use "games" with slightly different shape
export interface ApiGame {
  id: number
  date: string
  status: { short: string }
  league: {
    id: number
    name: string
    season: number | string
  }
  teams: {
    home: { id: number; name: string }
    away: { id: number; name: string }
  }
  scores: {
    home: { total: number | null }
    away: { total: number | null }
  }
}

export interface ApiInjury {
  player: { id: number; name: string; type: string; reason: string }
  team: { id: number; name: string }
}

export interface ApiOdds {
  bookmakers: {
    name: string
    bets: {
      name: string
      values: { value: string; odd: string }[]
    }[]
  }[]
}

export interface ApiStanding {
  team: { id: number; name: string }
  rank: number
  points: number
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }
  form?: string
}

export interface ApiTeamStats {
  goals: {
    for: { total: { total: number }; average: { total: string } }
    against: { total: { total: number }; average: { total: string } }
  }
  clean_sheet: { total: number }
  penalty?: { total: number; scored: { total: number } }
}

// ── Generic fetch ──

async function apiFetch<T>(sport: Sport, endpoint: string, params: Record<string, string | number>): Promise<T[]> {
  const url = new URL(endpoint, BASE_URLS[sport])
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }

  console.log(`[sports-api] ${sport} ${endpoint}`, params)

  const res = await fetch(url.toString(), {
    headers: {
      'x-apisports-key': API_KEY,
    },
  })

  if (!res.ok) {
    throw new Error(`Sports API ${res.status}: ${await res.text()}`)
  }

  const json = await res.json() as { response: T[]; errors?: Record<string, string> }

  if (json.errors && Object.keys(json.errors).length > 0) {
    console.warn('[sports-api] errors:', json.errors)
  }

  return json.response
}

// ── Football endpoints ──

export async function searchTeamsFootball(name: string) {
  return apiFetch<{ team: ApiTeam }>(
    'football', '/teams', { search: name }
  )
}

export async function getFixturesByTeam(teamId: number, next: number) {
  return apiFetch<ApiFixture>(
    'football', '/fixtures', { team: teamId, next }
  )
}

export async function getLastFixtures(teamId: number, last: number) {
  return apiFetch<ApiFixture>(
    'football', '/fixtures', { team: teamId, last }
  )
}

export async function getH2HFootball(team1Id: number, team2Id: number, last: number) {
  return apiFetch<ApiFixture>(
    'football', '/fixtures/headtohead', { h2h: `${team1Id}-${team2Id}`, last }
  )
}

export async function getInjuries(fixtureId: number) {
  return apiFetch<ApiInjury>(
    'football', '/injuries', { fixture: fixtureId }
  )
}

export async function getOdds(fixtureId: number) {
  return apiFetch<ApiOdds>(
    'football', '/odds', { fixture: fixtureId }
  )
}

export async function getStandings(leagueId: number, season: number) {
  return apiFetch<{ league: { standings: ApiStanding[][] } }>(
    'football', '/standings', { league: leagueId, season }
  )
}

export async function getTeamStatistics(teamId: number, leagueId: number, season: number) {
  return apiFetch<ApiTeamStats>(
    'football', '/teams/statistics', { team: teamId, league: leagueId, season }
  )
}

// ── Hockey endpoints ──

export async function searchTeamsHockey(name: string) {
  return apiFetch<{ id: number; name: string; logo: string }>(
    'hockey', '/teams', { search: name }
  )
}

export async function getGamesHockey(teamId: number, next?: number, last?: number) {
  const params: Record<string, string | number> = { team: teamId }
  if (next) params.next = next
  if (last) params.last = last
  return apiFetch<ApiGame>('hockey', '/games', params)
}

export async function getH2HHockey(team1Id: number, team2Id: number, last: number) {
  return apiFetch<ApiGame>(
    'hockey', '/games/h2h', { h2h: `${team1Id}-${team2Id}`, last }
  )
}

export async function getStandingsHockey(leagueId: number, season: number) {
  return apiFetch<ApiStanding[]>(
    'hockey', '/standings', { league: leagueId, season }
  )
}

// ── Basketball endpoints ──

export async function searchTeamsBasketball(name: string) {
  return apiFetch<{ id: number; name: string; logo: string }>(
    'basketball', '/teams', { search: name }
  )
}

export async function getGamesBasketball(teamId: number, next?: number, last?: number) {
  const params: Record<string, string | number> = { team: teamId }
  if (next) params.next = next
  if (last) params.last = last
  return apiFetch<ApiGame>('basketball', '/games', params)
}

export async function getH2HBasketball(team1Id: number, team2Id: number, last: number) {
  return apiFetch<ApiGame>(
    'basketball', '/games/h2h', { h2h: `${team1Id}-${team2Id}`, last }
  )
}

export async function getStandingsBasketball(leagueId: number, season: string) {
  return apiFetch<ApiStanding[]>(
    'basketball', '/standings', { league: leagueId, season }
  )
}

// ── Unified search ──

export interface FoundTeam {
  id: number
  name: string
  logo: string
}

export async function searchTeams(sport: Sport, name: string): Promise<FoundTeam[]> {
  switch (sport) {
    case 'football': {
      const res = await searchTeamsFootball(name)
      return res.map(r => ({ id: r.team.id, name: r.team.name, logo: r.team.logo }))
    }
    case 'hockey': {
      const res = await searchTeamsHockey(name)
      return res.map(r => ({ id: r.id, name: r.name, logo: r.logo }))
    }
    case 'basketball': {
      const res = await searchTeamsBasketball(name)
      return res.map(r => ({ id: r.id, name: r.name, logo: r.logo }))
    }
  }
}

// ── Unified: find next fixture/game ──

export interface FoundFixture {
  id: number
  date: string
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  league: { id: number; name: string; season: number | string }
  venue?: string
  round?: string
}

export async function findNextFixture(sport: Sport, teamId: number): Promise<FoundFixture | null> {
  if (sport === 'football') {
    const fixtures = await getFixturesByTeam(teamId, 1)
    const f = fixtures[0]
    if (!f) return null
    return {
      id: f.fixture.id,
      date: f.fixture.date,
      homeTeam: { id: f.teams.home.id, name: f.teams.home.name },
      awayTeam: { id: f.teams.away.id, name: f.teams.away.name },
      league: { id: f.league.id, name: f.league.name, season: f.league.season },
      venue: f.fixture.venue?.name,
      round: f.league.round,
    }
  }

  // Hockey & Basketball use /games
  const fetcher = sport === 'hockey' ? getGamesHockey : getGamesBasketball
  const games = await fetcher(teamId, 1)
  const g = games[0]
  if (!g) return null
  return {
    id: g.id,
    date: g.date,
    homeTeam: { id: g.teams.home.id, name: g.teams.home.name },
    awayTeam: { id: g.teams.away.id, name: g.teams.away.name },
    league: { id: g.league.id, name: g.league.name, season: g.league.season },
  }
}
