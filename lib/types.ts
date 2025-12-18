export type Player = {
  id: string
  name: string
  favorite_course?: string
}

export type Round = {
  id: string
  player_id: string
  date: string
  course: string
  tee: string
  rating: number
  slope: number
  score: number
}

export type HandicapHistory = {
  date: string
  handicap: number
  rounds: number
}

