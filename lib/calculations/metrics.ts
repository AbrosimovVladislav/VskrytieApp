/**
 * Расчёт производных метрик из сырых результатов матчей.
 * Используется после получения данных из Sports API.
 */

export interface GameResult {
  goalsFor: number
  goalsAgainst: number
}

export interface CalculatedMetrics {
  avgGoalsScored: number
  avgGoalsConceded: number
  bttsPct: number       // % матчей где обе забили
  over25Pct: number     // % матчей с 3+ голов
  cleanSheets: number   // кол-во матчей с 0 пропущенных
}

export function calcMetrics(games: GameResult[]): CalculatedMetrics {
  if (games.length === 0) {
    return { avgGoalsScored: 0, avgGoalsConceded: 0, bttsPct: 0, over25Pct: 0, cleanSheets: 0 }
  }

  const n = games.length
  const totalFor = games.reduce((s, g) => s + g.goalsFor, 0)
  const totalAgainst = games.reduce((s, g) => s + g.goalsAgainst, 0)
  const btts = games.filter(g => g.goalsFor > 0 && g.goalsAgainst > 0).length
  const over25 = games.filter(g => g.goalsFor + g.goalsAgainst > 2).length
  const clean = games.filter(g => g.goalsAgainst === 0).length

  return {
    avgGoalsScored: Math.round((totalFor / n) * 100) / 100,
    avgGoalsConceded: Math.round((totalAgainst / n) * 100) / 100,
    bttsPct: Math.round((btts / n) * 100),
    over25Pct: Math.round((over25 / n) * 100),
    cleanSheets: clean,
  }
}
