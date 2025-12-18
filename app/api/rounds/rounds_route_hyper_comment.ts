/**
 * =============================================================================
 * ROUNDS API ROUTE
 * =============================================================================
 * 
 * This API route handles all golf round-related operations for the Golf
 * Handicap Tracker application. Each round represents a single 18-hole
 * (or 9-hole) game played by a player at a specific course.
 * 
 * FILE LOCATION:
 * app/api/rounds/route.ts
 * 
 * ENDPOINTS:
 * - GET  /api/rounds?player_id=xxx - Fetch all rounds for a player
 * - POST /api/rounds - Create a new round
 * 
 * DATABASE TABLE: rounds
 * Columns:
 * - id (uuid, primary key) - Auto-generated unique identifier
 * - player_id (uuid, foreign key) - Links to players table
 * - date (date) - Date the round was played
 * - course (text) - Name of the golf course
 * - tee (text) - Tee box played from (e.g., "Blue", "White", "Black")
 * - rating (decimal) - Course rating (difficulty for scratch golfer, e.g., 72.5)
 * - slope (integer) - Slope rating (difficulty for bogey golfer, 55-155)
 * - score (integer) - Total strokes for the round
 * - created_at (timestamp) - Auto-generated creation timestamp
 * 
 * RELATIONSHIPS:
 * - rounds.player_id → players.id (foreign key)
 * - When a player is deleted, what happens to rounds? (Configure in Supabase)
 * 
 * GOLF TERMINOLOGY EXPLAINED:
 * - Course Rating: Difficulty for a scratch golfer (handicap 0)
 * - Slope Rating: Relative difficulty for higher handicap players
 * - Differential: (Score - Rating) × 113 / Slope
 *   - Used to calculate handicap
 *   - 113 is the standard slope value
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { supabaseServer } from "@/lib/supabaseServer" // Supabase client for server-side operations
import { type NextRequest, NextResponse } from "next/server" // Next.js types and utilities

// =============================================================================
// GET ENDPOINT - FETCH ROUNDS FOR A PLAYER
// =============================================================================

/**
 * GET /api/rounds?player_id={uuid}
 * 
 * PURPOSE:
 * Fetches all rounds for a specific player, sorted by date (newest first).
 * Called whenever:
 * - User selects a different player from dropdown
 * - App loads and auto-selects first player
 * - New round is added (to refresh the list)
 * 
 * REQUEST:
 * - Method: GET
 * - Query Parameter: player_id (uuid string)
 *   - Example: /api/rounds?player_id=abc123-def456-...
 * 
 * RESPONSE:
 * Success with player_id (200):
 * [
 *   {
 *     id: "uuid",
 *     player_id: "uuid",
 *     date: "2025-01-15",
 *     course: "Pebble Beach",
 *     tee: "Blue",
 *     rating: 72.1,
 *     slope: 145,
 *     score: 88
 *   },
 *   // ... more rounds
 * ]
 * 
 * Success without player_id (200):
 * []  // Empty array
 * 
 * Database Error (500):
 * { error: "Error message from Supabase" }
 * 
 * FLOW:
 * 1. Extract player_id from query parameters
 * 2. Return empty array if no player_id provided
 * 3. Query database for rounds matching player_id
 * 4. Sort by date (newest first)
 * 5. Return array of rounds
 * 
 * @param req - Next.js request object containing query parameters
 */
export async function GET(req: NextRequest) {
  /**
   * Extract Query Parameters
   * 
   * new URL(req.url) parses the full request URL
   * .searchParams gives access to query string parameters
   * .get("player_id") extracts the player_id value
   * 
   * Example URL breakdown:
   * http://localhost:3000/api/rounds?player_id=abc123
   *                                   ^^^^^^^^^^^^^^^^
   *                                   searchParams
   */
  const { searchParams } = new URL(req.url)
  const player_id = searchParams.get("player_id")

  /**
   * Handle Missing Player ID
   * 
   * If no player_id provided, return empty array
   * This is NOT an error - it's a valid state
   * 
   * Why return [] instead of error?
   * - Frontend expects an array of rounds
   * - Empty array = no rounds (simpler to handle)
   * - Avoids error handling in frontend
   */
  if (!player_id) {
    return NextResponse.json([], { status: 200 })
  }

  /**
   * Query Rounds from Database
   * 
   * .from("rounds")
   * - Specifies the rounds table
   * 
   * .select("*")
   * - Selects all columns
   * - Could be specific: .select("id, date, course, tee, rating, slope, score")
   * 
   * .eq("player_id", player_id)
   * - Filter: WHERE player_id = player_id
   * - eq = "equals"
   * - Only returns rounds for this specific player
   * 
   * .order("date", { ascending: false })
   * - Sort by date, newest first
   * - ascending: false = descending order (2025 → 2024 → 2023)
   * - This shows most recent rounds at the top of the table
   */
  const { data, error } = await supabaseServer
    .from("rounds")
    .select("*")
    .eq("player_id", player_id)
    .order("date", { ascending: false })

  /**
   * Error Handling
   * 
   * Possible errors:
   * - Invalid player_id format (not a valid UUID)
   * - Database connection issues
   * - Permission problems (if RLS enabled)
   */
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  /**
   * Return Rounds Array
   * 
   * data will be:
   * - An array of round objects (could be empty [])
   * - Never null (Supabase returns [] if no matches)
   */
  return NextResponse.json(data)
}

// =============================================================================
// POST ENDPOINT - CREATE NEW ROUND
// =============================================================================

/**
 * POST /api/rounds
 * 
 * PURPOSE:
 * Creates a new round record in the database.
 * Called when user submits the "Record New Round" form.
 * 
 * REQUEST:
 * - Method: POST
 * - Content-Type: application/json
 * - Body:
 *   {
 *     "player_id": "uuid" (required),
 *     "date": "2025-01-15" (required, YYYY-MM-DD format),
 *     "course": "Pebble Beach" (required),
 *     "tee": "Blue" (required),
 *     "rating": 72.5 (required, can be string or number),
 *     "slope": 145 (required, can be string or number),
 *     "score": 88 (required, can be string or number)
 *   }
 * 
 * RESPONSE:
 * Success (200):
 * {
 *   "id": "generated-uuid",
 *   "player_id": "uuid",
 *   "date": "2025-01-15",
 *   "course": "Pebble Beach",
 *   "tee": "Blue",
 *   "rating": 72.5,
 *   "slope": 145,
 *   "score": 88,
 *   "created_at": "timestamp"
 * }
 * 
 * Validation Errors (400):
 * { error: "Player ID required" }
 * { error: "All round fields are required" }
 * { error: "Invalid numeric values" }
 * 
 * Database Error (500):
 * { error: "Error message from Supabase" }
 * 
 * FLOW:
 * 1. Parse JSON body
 * 2. Validate all required fields exist
 * 3. Convert string numbers to actual numbers
 * 4. Validate numeric conversions succeeded
 * 5. Insert into database
 * 6. Return created round
 * 
 * @param req - Next.js request object containing POST body
 */
export async function POST(req: NextRequest) {
  /**
   * Parse Request Body
   * 
   * Extract all fields from JSON body
   * Note: HTML inputs send numbers as strings
   * We'll need to convert rating, slope, and score to numbers
   */
  const { player_id, date, course, tee, rating, slope, score } = await req.json()

  /**
   * Validation Step 1: Player ID Required
   * 
   * Every round must be associated with a player
   * This is a foreign key relationship in the database
   */
  if (!player_id) 
    return NextResponse.json({ error: "Player ID required" }, { status: 400 })

  /**
   * Validation Step 2: All Round Fields Required
   * 
   * Business rule: A complete round needs all this information
   * - date: When was it played?
   * - course: Where was it played?
   * - tee: Which tees? (affects rating/slope)
   * - rating: Course difficulty rating
   * - slope: Slope difficulty rating
   * - score: Total strokes
   * 
   * Why check all at once?
   * - Simpler validation logic
   * - User sees all missing fields, not one at a time
   * 
   * Note: This doesn't check if they're valid values, just not empty
   */
  if (!date || !course || !tee || !rating || !slope || !score)
    return NextResponse.json({ error: "All round fields are required" }, { status: 400 })

  /**
   * Type Conversion - String to Number
   * 
   * HTML number inputs send values as strings: "72.5", "145", "88"
   * Database expects numbers: 72.5, 145, 88
   * 
   * parseFloat vs parseInt:
   * - parseFloat: Allows decimals (72.5) - used for rating
   * - parseInt: Whole numbers only (145, 88) - used for slope and score
   * 
   * Why Number.parseFloat instead of parseFloat?
   * - More explicit
   * - Avoids global namespace pollution
   * - Better for TypeScript
   */
  const ratingNum = Number.parseFloat(rating)
  const slopeNum = Number.parseInt(slope)
  const scoreNum = Number.parseInt(score)

  /**
   * Validation Step 3: Verify Numeric Conversions
   * 
   * isNaN = "is Not a Number"
   * Returns true if conversion failed
   * 
   * Examples that would fail:
   * - rating: "abc" → parseFloat("abc") → NaN
   * - slope: "" → parseInt("") → NaN
   * - score: "12.5.6" → parseInt("12.5.6") → NaN
   * 
   * This catches:
   * - Empty strings that passed the previous check
   * - Malformed numbers
   * - Non-numeric input
   */
  if (isNaN(ratingNum) || isNaN(slopeNum) || isNaN(scoreNum))
    return NextResponse.json({ error: "Invalid numeric values" }, { status: 400 })

  /**
   * Database Insert Operation
   * 
   * .from("rounds")
   * - Target table
   * 
   * .insert([{ ... }])
   * - Insert one round
   * - Array notation supports batch inserts
   * - Supabase auto-generates id and created_at
   * 
   * Field Mapping:
   * - player_id: String (UUID) - links to players table
   * - date: String (YYYY-MM-DD) - Supabase converts to date type
   * - course: String - freeform text
   * - tee: String - freeform text (could be enum in future)
   * - rating: Number (decimal) - typically 65-80 range
   * - slope: Number (integer) - 55-155 range (113 is standard)
   * - score: Number (integer) - typically 70-120 range
   * 
   * .select()
   * - Return the inserted row
   * - Needed to get the auto-generated ID
   * - Frontend adds this to local state
   */
  const { data, error } = await supabaseServer
    .from("rounds")
    .insert([
      {
        player_id,
        date,
        course,
        tee,
        rating: ratingNum,  // Now a number, not a string
        slope: slopeNum,    // Now a number, not a string
        score: scoreNum,    // Now a number, not a string
      },
    ])
    .select()

  /**
   * Error Handling
   * 
   * Possible errors:
   * - Foreign key violation (invalid player_id)
   * - Invalid date format
   * - Database constraints (e.g., slope must be 55-155)
   * - Permission denied
   */
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  /**
   * Return Created Round
   * 
   * data is an array with one element (the inserted round)
   * Return data[0] to give frontend the round object
   * 
   * Frontend uses this to:
   * 1. Add to local rounds array (optimistic update)
   * 2. Show success message
   * 3. Update handicap calculation
   * 4. Reset form fields
   */
  return NextResponse.json(data[0])
}

/**
 * =============================================================================
 * POTENTIAL IMPROVEMENTS
 * =============================================================================
 * 
 * 1. ADDITIONAL VALIDATION
 *    - Validate date is not in the future
 *    - Check slope is between 55-155 (USGA rules)
 *    - Check rating is reasonable (typically 65-80)
 *    - Check score is reasonable (40-200 range)
 *    - Validate date format (YYYY-MM-DD)
 * 
 * 2. COURSE DATABASE
 *    - Create separate courses table
 *    - Store rating/slope per tee
 *    - Prevent typos ("Peble Beach" vs "Pebble Beach")
 *    - Auto-fill rating/slope when course selected
 * 
 * 3. UPDATE ENDPOINT
 *    - Add PUT /api/rounds/[id] to edit rounds
 *    - Allow fixing mistakes (wrong score, wrong date)
 * 
 * 4. DELETE ENDPOINT
 *    - Add DELETE /api/rounds/[id] to remove rounds
 *    - Important for fixing entry errors
 * 
 * 5. BULK OPERATIONS
 *    - Add endpoint to import multiple rounds
 *    - Parse CSV file with round data
 *    - Useful for migrating from other systems
 * 
 * 6. STATISTICS ENDPOINTS
 *    - Add GET /api/rounds/stats?player_id=xxx
 *    - Pre-calculate averages, best scores, etc.
 *    - Offload computation from frontend
 * 
 * 7. FILTERING
 *    - Add query params: ?course=Pebble&year=2025
 *    - Filter rounds by course, date range, tee
 *    - Support advanced search
 * 
 * 8. PAGINATION
 *    - Add ?limit=20&offset=40
 *    - Important if players have 100+ rounds
 *    - Improves performance
 * 
 * 9. AUTHENTICATION
 *    - Verify player_id belongs to authenticated user
 *    - Prevent users from adding rounds to other players
 *    - Add middleware for auth checks
 * 
 * 10. DIFFERENTIAL CALCULATION
 *     - Calculate and store differential in database
 *     - differential = (score - rating) * 113 / slope
 *     - Faster queries, less frontend computation
 *     - Add as computed column or trigger
 * 
 * 11. DUPLICATE DETECTION
 *     - Check if round already exists (same player, date, course)
 *     - Warn user about potential duplicate
 *     - Allow override if intentional (played twice same day)
 * 
 * 12. AUDIT TRAIL
 *     - Track who created/modified each round
 *     - Store edit history (updated_at, updated_by)
 *     - Important for multi-user systems
 */
