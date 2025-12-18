import type { Round, HandicapHistory } from "./types"

/**
 * Calculate Handicap using USGA World Handicap System
 * 
 * USGA RULES:
 * - Requires minimum 3 rounds
 * - Uses best N rounds where N depends on total rounds
 * - Applies 96% multiplier to average of best differentials
 * 
 * DIFFERENTIAL FORMULA:
 * (Score - Course Rating) × 113 / Slope Rating
 */
export function calculateHandicap(rounds: Round[]): number {
  if (!rounds.length) return 0

  // Calculate differential for each round
  const diffs = rounds.map((r) => ((r.score - r.rating) * 113) / r.slope)

  // Determine how many differentials to use based on total rounds
  let numToUse: number
  const totalRounds = diffs.length

  if (totalRounds >= 20) {
    numToUse = 8 // Best 8 of last 20
  } else if (totalRounds === 19) {
    numToUse = 7
  } else if (totalRounds === 18) {
    numToUse = 6
  } else if (totalRounds >= 15) {
    numToUse = 5
  } else if (totalRounds >= 12) {
    numToUse = 4
  } else if (totalRounds >= 9) {
    numToUse = 3
  } else if (totalRounds >= 6) {
    numToUse = 2
  } else if (totalRounds >= 3) {
    numToUse = 1
  } else {
    // Less than 3 rounds - cannot calculate official handicap
    return 0
  }

  // Sort differentials (lowest to highest) and take the best N
  const sortedDiffs = [...diffs].sort((a, b) => a - b)
  const bestDiffs = sortedDiffs.slice(0, numToUse)

  // Calculate average of best differentials
  const avgDiff = bestDiffs.reduce((a, b) => a + b, 0) / bestDiffs.length

  // Apply 96% multiplier (USGA rule)
  const handicapIndex = avgDiff * 0.96

  // Round to 1 decimal place
  return Number.parseFloat(handicapIndex.toFixed(1))
}

/**
 * Calculate Handicap History
 * Creates array of handicap values over time for charting
 * 
 * Shows how handicap has changed over the last 6 months
 * Calculates handicap after each round (progressive calculation)
 */
export function calculateHandicapHistory(rounds: Round[]): HandicapHistory[] {
  if (rounds.length < 3) return []

  // Sort rounds by date (oldest first)
  const sortedRounds = [...rounds].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const history: HandicapHistory[] = []
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  // Calculate handicap after each round
  sortedRounds.forEach((round, index) => {
    const roundsUpToThis = sortedRounds.slice(0, index + 1)
    const roundDate = new Date(round.date)

    // Only include if:
    // 1. Round is within last 6 months
    // 2. Player had at least 3 rounds at that point
    if (roundDate >= sixMonthsAgo && roundsUpToThis.length >= 3) {
      const handicap = calculateHandicap(roundsUpToThis)
      history.push({
        date: round.date,
        handicap,
        rounds: roundsUpToThis.length,
      })
    }
  })

  return history
}

/**
 * Calculate differential for a single round
 */
export function calculateDifferential(round: Round): number {
  return ((round.score - round.rating) * 113) / round.slope
}

