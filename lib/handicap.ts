/**
 * =============================================================================
 * HANDICAP CALCULATION UTILITIES
 * =============================================================================
 * 
 * Pure functions for calculating golf handicaps using the official
 * USGA World Handicap System.
 * 
 * FEATURES:
 * - calculateHandicap: Main handicap calculation function
 * - calculateHandicapHistory: Creates array of handicap values over time
 * - calculateDifferential: Calculates differential for a single round
 * 
 * USGA WORLD HANDICAP SYSTEM:
 * - Official golf handicap calculation system
 * - Used worldwide for competitive golf
 * - Ensures fair play across different courses and skill levels
 * 
 * KEY CONCEPTS:
 * - Differential: Normalized score adjusted for course difficulty
 * - Course Rating: Expected score for a scratch golfer
 * - Slope Rating: Difficulty for a bogey golfer (55-155 scale)
 * - Handicap Index: Average of best differentials × 96%
 * 
 * PURE FUNCTIONS:
 * - No side effects (don't modify inputs)
 * - Same input always produces same output
 * - Easy to test and reason about
 */

import type { Round, HandicapHistory } from "./types"

/**
 * Calculate Handicap using USGA World Handicap System
 * 
 * PURPOSE:
 * - Calculate accurate handicap index based on USGA rules
 * - Use different number of rounds based on total rounds played
 * - Apply 96% multiplier for final handicap
 * 
 * USGA RULES:
 * - Requires minimum 3 rounds
 * - Uses best N rounds where N depends on total rounds:
 *   * 3-5 rounds: Use best 1
 *   * 6-8 rounds: Use best 2
 *   * 9-11 rounds: Use best 3
 *   * 12-14 rounds: Use best 4
 *   * 15-17 rounds: Use best 5
 *   * 18 rounds: Use best 6
 *   * 19 rounds: Use best 7
 *   * 20+ rounds: Use best 8 of last 20
 * - Applies 96% multiplier to average of best differentials
 * 
 * DIFFERENTIAL FORMULA:
 * (Score - Course Rating) × 113 / Slope Rating
 * 
 * WHY 113?
 * - 113 is the standard slope rating
 * - This normalizes difficulty across all courses
 * - Allows fair comparison between different courses
 * 
 * WHY 96%?
 * - Encourages players to play their best
 * - Prevents sandbagging (intentionally playing poorly)
 * - Makes handicaps slightly more competitive
 * 
 * @param rounds - Array of rounds to calculate from
 * @returns Handicap index (number with 1 decimal place, or 0 if insufficient rounds)
 * 
 * EXAMPLE:
 * calculateHandicap([
 *   { score: 85, rating: 72.5, slope: 130, ... },
 *   { score: 90, rating: 72.5, slope: 130, ... },
 *   ...
 * ])
 * Returns: 12.5
 */
export function calculateHandicap(rounds: Round[]): number {
  // Return 0 if no rounds exist
  if (!rounds.length) return 0

  // ===========================================================================
  // STEP 1: Calculate differential for each round
  // ===========================================================================
  
  /**
   * Differential Calculation
   * Differential = how many strokes over/under par adjusted for course difficulty
   * 
   * Formula: (Score - Course Rating) × 113 / Slope Rating
   * 
   * Example:
   * Score: 85, Rating: 72.5, Slope: 130
   * Differential = (85 - 72.5) × 113 / 130 = 10.8
   */
  const diffs = rounds.map((r) => ((r.score - r.rating) * 113) / r.slope)

  // ===========================================================================
  // STEP 2: Determine how many differentials to use
  // ===========================================================================
  
  /**
   * USGA Rules for Number of Differentials
   * Based on total number of rounds played
   */
  let numToUse: number
  const totalRounds = diffs.length

  if (totalRounds >= 20) {
    numToUse = 8 // Best 8 of last 20 (standard rule)
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

  // ===========================================================================
  // STEP 3: Sort differentials and take the best N
  // ===========================================================================
  
  /**
   * Sort differentials lowest to highest
   * We want the BEST (lowest) differentials
   * Lower differential = better performance
   */
  const sortedDiffs = [...diffs].sort((a, b) => a - b)
  // [...diffs] creates a copy (don't mutate original array)
  // sort((a, b) => a - b) sorts ascending (lowest first)
  
  /**
   * Take only the best N differentials
   * slice(0, numToUse) gets first N elements
   */
  const bestDiffs = sortedDiffs.slice(0, numToUse)

  // ===========================================================================
  // STEP 4: Calculate average of best differentials
  // ===========================================================================
  
  /**
   * Average Calculation
   * Sum all best differentials, divide by count
   */
  const avgDiff = bestDiffs.reduce((a, b) => a + b, 0) / bestDiffs.length
  // reduce((a, b) => a + b, 0) sums all values
  // Divide by length to get average

  // ===========================================================================
  // STEP 5: Apply 96% multiplier (USGA rule)
  // ===========================================================================
  
  /**
   * Handicap Index Calculation
   * Multiply average by 0.96 (96% multiplier)
   */
  const handicapIndex = avgDiff * 0.96

  // ===========================================================================
  // STEP 6: Round to 1 decimal place
  // ===========================================================================
  
  /**
   * Format Result
   * Round to 1 decimal place and convert back to number
   */
  return Number.parseFloat(handicapIndex.toFixed(1))
  // toFixed(1) returns string with 1 decimal: "12.5"
  // parseFloat converts back to number: 12.5
}

/**
 * Calculate Handicap History
 * Creates array of handicap values over time for charting
 * 
 * PURPOSE:
 * - Show how handicap has changed over the last 6 months
 * - Calculate handicap after each round (progressive calculation)
 * - Filter to recent data for relevant trends
 * 
 * ALGORITHM:
 * 1. Sort rounds chronologically (oldest first)
 * 2. For each round, calculate handicap using all rounds up to that point
 * 3. Only include rounds from last 6 months
 * 4. Only include if player had enough rounds (3+) for valid handicap
 * 
 * @param rounds - All rounds for the player
 * @returns Array of handicap history points for charting
 * 
 * EXAMPLE OUTPUT:
 * [
 *   { date: "2024-01-15", handicap: 15.2, rounds: 3 },
 *   { date: "2024-01-22", handicap: 14.8, rounds: 4 },
 *   ...
 * ]
 */
export function calculateHandicapHistory(rounds: Round[]): HandicapHistory[] {
  // Need at least 3 rounds for valid handicap
  if (rounds.length < 3) return []

  // ===========================================================================
  // STEP 1: Sort rounds by date (oldest first)
  // ===========================================================================
  
  /**
   * Chronological Sort
   * Sort by date ascending (oldest rounds first)
   * This allows us to calculate handicap progressively
   */
  const sortedRounds = [...rounds].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    // getTime() converts date to number (milliseconds since epoch)
    // Subtracting gives us sort order
  )

  // ===========================================================================
  // STEP 2: Calculate 6 months ago cutoff date
  // ===========================================================================
  
  const history: HandicapHistory[] = []
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  // Subtract 6 months from today's date

  // ===========================================================================
  // STEP 3: Calculate handicap after each round
  // ===========================================================================
  
  /**
   * Progressive Handicap Calculation
   * For each round, calculate handicap using all rounds up to that point
   */
  sortedRounds.forEach((round, index) => {
    // Get all rounds up to and including this one
    const roundsUpToThis = sortedRounds.slice(0, index + 1)
    // slice(0, index + 1) gets rounds from start to current index
    
    const roundDate = new Date(round.date)

    // Only include if:
    // 1. Round is within last 6 months
    // 2. Player had at least 3 rounds at that point
    if (roundDate >= sixMonthsAgo && roundsUpToThis.length >= 3) {
      // Calculate handicap using rounds up to this point
      const handicap = calculateHandicap(roundsUpToThis)
      
      // Add to history array
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
 * Calculate Differential for a Single Round
 * 
 * PURPOSE:
 * - Calculate the differential (normalized score) for one round
 * - Used in the rounds table to show individual round performance
 * 
 * FORMULA:
 * (Score - Course Rating) × 113 / Slope Rating
 * 
 * @param round - Single round object
 * @returns Differential value (float)
 * 
 * EXAMPLE:
 * calculateDifferential({
 *   score: 85,
 *   rating: 72.5,
 *   slope: 130
 * })
 * Returns: 10.8
 */
export function calculateDifferential(round: Round): number {
  return ((round.score - round.rating) * 113) / round.slope
  // Standard USGA differential formula
}
