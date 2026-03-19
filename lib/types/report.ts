// Form result for each recent match
type FormResult = 'W' | 'D' | 'L'

interface MatchHeader {
  league: string          // e.g. "РПЛ"
  date: string            // e.g. "23 марта 2026"
  homeTeam: string        // e.g. "ЦСКА"
  awayTeam: string        // e.g. "Спартак"
  stadium?: string        // e.g. "ВЭБ Арена"
  time?: string           // e.g. "19:00"
}

interface FormData {
  home: FormResult[]           // last 5 results for home team
  away: FormResult[]           // last 5 results for away team
  homeAtHome?: FormResult[]    // home team's last 5 results at home
  awayAway?: FormResult[]      // away team's last 5 results away
}

interface StatItem {
  label: string       // e.g. "Голов забито (5 матчей)"
  homeValue: number   // home team value
  awayValue: number   // away team value
  unit?: string       // optional unit, e.g. "xG"
}

interface PlayerAbsence {
  name: string        // e.g. "Промес"
  position: string    // e.g. "Нападающий"
  reason: 'травма' | 'дисквалификация' | 'сомнение'
  duration?: string   // e.g. "сезон" or "1 матч"
}

interface InjuriesData {
  homeOk: boolean              // true if no significant absences
  awayOk: boolean
  home: PlayerAbsence[]
  away: PlayerAbsence[]
}

interface H2HMatch {
  date: string        // e.g. "15 окт 25"
  homeTeam: string
  score: string       // e.g. "2:1"
  awayTeam: string
}

interface H2HData {
  homeWins: number
  awayWins: number
  draws: number
  matches: H2HMatch[]         // last 5 meetings
  homeGroundRecord?: string   // e.g. "4П 0Н 1П"
}

interface BookmakerOdds {
  name: string    // e.g. "Фонбет"
  home: number    // П1
  draw: number    // Х
  away: number    // П2
}

interface OddsData {
  bookmakers: BookmakerOdds[]
}

// The full structured report (all sections except recommendation)
export interface MatchReport {
  header: MatchHeader
  form: FormData
  stats: StatItem[]
  injuries: InjuriesData
  h2h: H2HData
  odds: OddsData
}
