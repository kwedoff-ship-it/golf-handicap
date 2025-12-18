/**
 * =============================================================================
 * TYPE DEFINITIONS
 * =============================================================================
 * 
 * Centralized TypeScript type definitions for the Golf Handicap Tracker.
 * 
 * PURPOSE:
 * - Ensures type safety across the entire application
 * - Provides single source of truth for data structures
 * - Makes refactoring easier (change once, updates everywhere)
 * - Improves IDE autocomplete and error detection
 * 
 * USAGE:
 * Import types in any file:
 * import type { Player, Round } from "@/lib/types"
 * 
 * TYPE EXPORTS:
 * - Player: Represents a golfer in the system
 * - Round: Represents a single round of golf
 * - HandicapHistory: Represents a point in handicap progression over time
 */

/**
 * Player Type
 * Represents a golfer in the system
 * 
 * @property id - Unique identifier (UUID from Supabase database)
 * @property name - Player's full name (required)
 * @property favorite_course - Optional field for player's home/favorite course
 *                            The ? makes this field optional
 */
export type Player = {
  id: string
  name: string
  favorite_course?: string // Optional field (indicated by ?)
}

/**
 * Round Type
 * Represents a single round of golf played by a player
 * 
 * @property id - Unique identifier (UUID from Supabase database)
 * @property player_id - Foreign key linking to the player who played this round
 * @property date - Date the round was played (YYYY-MM-DD format string)
 * @property course - Name of the golf course
 * @property tee - Tee box played from (e.g., "Blue", "White", "Black", "Red")
 * @property rating - Course rating (difficulty for a scratch golfer)
 *                    Float number (e.g., 72.5)
 * @property slope - Slope rating (difficulty for a bogey golfer)
 *                   Integer between 55-155
 * @property score - Total strokes for the round (integer)
 */
export type Round = {
  id: string
  player_id: string
  date: string // ISO date string (YYYY-MM-DD)
  course: string
  tee: string
  rating: number // Float (e.g., 72.5)
  slope: number // Integer (55-155)
  score: number // Integer (total strokes)
}

/**
 * HandicapHistory Type
 * Represents a point in time showing handicap progression
 * Used for the handicap trend chart visualization
 * 
 * @property date - Date of the round (YYYY-MM-DD format string)
 * @property handicap - Calculated handicap index at that point in time
 *                      Float with 1 decimal place (e.g., 12.5)
 * @property rounds - Total number of rounds used in the handicap calculation
 *                    Integer (minimum 3 for valid handicap)
 */
export type HandicapHistory = {
  date: string
  handicap: number
  rounds: number
}
