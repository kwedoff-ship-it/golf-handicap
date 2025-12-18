/**
 * =============================================================================
 * PLAYERS API ROUTE
 * =============================================================================
 * 
 * This API route handles all player-related operations for the Golf Handicap
 * Tracker application. It serves as the backend interface between the frontend
 * React components and the Supabase database.
 * 
 * FILE LOCATION:
 * app/api/players/route.ts
 * 
 * ENDPOINTS:
 * - GET  /api/players - Fetch all players
 * - POST /api/players - Create a new player
 * 
 * DATABASE TABLE: players
 * Columns:
 * - id (uuid, primary key) - Auto-generated unique identifier
 * - name (text) - Player's full name
 * - favorite_course (text, nullable) - Player's home/favorite course
 * - created_at (timestamp) - Auto-generated creation timestamp
 * 
 * AUTHENTICATION:
 * Currently no authentication - would need to add middleware for production
 * 
 * ERROR HANDLING:
 * - Returns appropriate HTTP status codes (200, 400, 500)
 * - Logs errors to console with [v0] prefix for easy filtering
 * - Always returns JSON responses
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { supabaseServer } from "@/lib/supabaseServer" // Supabase client configured for server-side use
import { type NextRequest, NextResponse } from "next/server" // Next.js types and response utilities

// =============================================================================
// GET ENDPOINT - FETCH ALL PLAYERS
// =============================================================================

/**
 * GET /api/players
 * 
 * PURPOSE:
 * Fetches all players from the database, sorted alphabetically by name.
 * Called when the app loads to populate the player selector dropdown.
 * 
 * REQUEST:
 * - Method: GET
 * - No parameters required
 * - No authentication required (would add in production)
 * 
 * RESPONSE:
 * Success (200):
 * [
 *   { id: "uuid", name: "John Doe", favorite_course: "Pebble Beach" },
 *   { id: "uuid", name: "Jane Smith", favorite_course: "Augusta" }
 * ]
 * 
 * Error (500):
 * { error: "Error message from Supabase or unexpected error" }
 * 
 * FLOW:
 * 1. Log fetch attempt to console
 * 2. Query Supabase players table
 * 3. Order results by name (alphabetically)
 * 4. Check for errors
 * 5. Return JSON array of players
 */
export async function GET() {
  try {
    // Log the fetch attempt for debugging
    // The [v0] prefix helps filter logs in production
    console.log("[v0] Fetching players from Supabase...")
    
    /**
     * Supabase Query Breakdown:
     * 
     * .from("players")
     * - Specifies which database table to query
     * 
     * .select("*")
     * - Selects all columns from the table
     * - Could be more specific: .select("id, name, favorite_course")
     * 
     * .order("name", { ascending: true })
     * - Sorts results alphabetically by name
     * - Makes the dropdown look professional and easy to navigate
     * - ascending: true = A to Z
     */
    const { data, error } = await supabaseServer
      .from("players")
      .select("*")
      .order("name", { ascending: true })

    /**
     * Error Handling
     * 
     * Supabase returns { data, error } - only one will have a value
     * If error exists, the query failed (network issue, permission denied, etc.)
     */
    if (error) {
      console.error("[v0] Supabase error:", error)
      
      // Return 500 Internal Server Error with error details
      // Frontend can use this to show user-friendly error messages
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log success with count of players fetched
    console.log("[v0] Successfully fetched", data?.length || 0, "players")
    
    /**
     * Return Success Response
     * 
     * NextResponse.json() automatically:
     * - Sets Content-Type: application/json header
     * - Stringifies the data
     * - Sets status 200 OK (default)
     */
    return NextResponse.json(data)
    
  } catch (err) {
    /**
     * Catch Block - Unexpected Errors
     * 
     * This catches errors that aren't from Supabase:
     * - Network timeouts
     * - JSON parsing errors
     * - Unexpected runtime errors
     */
    console.error("[v0] Unexpected error in GET /api/players:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// =============================================================================
// POST ENDPOINT - CREATE NEW PLAYER
// =============================================================================

/**
 * POST /api/players
 * 
 * PURPOSE:
 * Creates a new player in the database.
 * Called when user submits the "Add Player" form.
 * 
 * REQUEST:
 * - Method: POST
 * - Content-Type: application/json
 * - Body:
 *   {
 *     "name": "Player Name" (required),
 *     "favorite_course": "Course Name" (optional)
 *   }
 * 
 * RESPONSE:
 * Success (200):
 * {
 *   "id": "generated-uuid",
 *   "name": "Player Name",
 *   "favorite_course": "Course Name",
 *   "created_at": "2025-01-15T12:00:00Z"
 * }
 * 
 * Validation Error (400):
 * { error: "Name is required" }
 * 
 * Database Error (500):
 * { error: "Error message from Supabase" }
 * 
 * FLOW:
 * 1. Parse JSON body from request
 * 2. Validate required fields
 * 3. Insert into database
 * 4. Return created player with generated ID
 * 
 * @param req - Next.js request object containing the POST body
 */
export async function POST(req: NextRequest) {
  try {
    /**
     * Parse Request Body
     * 
     * req.json() is async and parses the request body as JSON
     * Destructure to extract name and favorite_course
     */
    const { name, favorite_course } = await req.json()

    /**
     * Validation - Name Required
     * 
     * Business rule: Every player must have a name
     * favorite_course is optional
     * 
     * Return 400 Bad Request if validation fails
     * This prevents invalid data from reaching the database
     */
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Log the operation for debugging
    console.log("[v0] Adding player:", name)
    
    /**
     * Supabase Insert Operation
     * 
     * .from("players")
     * - Target table
     * 
     * .insert([{ name, favorite_course }])
     * - Insert one or more records (we're inserting 1)
     * - Takes an array of objects
     * - Each object represents one row to insert
     * - Supabase auto-generates id and created_at
     * 
     * .select()
     * - Return the inserted row(s)
     * - Without this, Supabase just returns success/error
     * - We need the generated ID to add to frontend state
     * 
     * Why array notation?
     * - Supabase insert() expects an array to support batch inserts
     * - Even for single record, wrap in array: [{ }]
     */
    const { data, error } = await supabaseServer
      .from("players")
      .insert([{ name, favorite_course }])
      .select()

    /**
     * Error Handling
     * 
     * Possible errors:
     * - Duplicate name (if we had a unique constraint)
     * - Permission denied
     * - Network issues
     */
    if (error) {
      console.error("[v0] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully added player")
    
    /**
     * Return Created Player
     * 
     * data is an array (from .insert([...])) 
     * We want just the first (and only) element: data[0]
     * 
     * This returns:
     * {
     *   id: "uuid-generated-by-supabase",
     *   name: "user-provided-name",
     *   favorite_course: "user-provided-course",
     *   created_at: "timestamp-generated-by-supabase"
     * }
     * 
     * Frontend uses this response to:
     * 1. Add player to local state
     * 2. Auto-select the new player
     * 3. Show success message
     */
    return NextResponse.json(data[0])
    
  } catch (err) {
    /**
     * Catch Block - Unexpected Errors
     * 
     * Catches:
     * - JSON parsing errors (malformed request body)
     * - Network errors
     * - Unexpected runtime errors
     */
    console.error("[v0] Unexpected error in POST /api/players:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * =============================================================================
 * POTENTIAL IMPROVEMENTS
 * =============================================================================
 * 
 * 1. AUTHENTICATION
 *    - Add middleware to verify user is logged in
 *    - Associate players with user accounts
 *    - Prevent unauthorized access
 * 
 * 2. VALIDATION
 *    - Add length limits (e.g., name < 100 chars)
 *    - Validate favorite_course format
 *    - Sanitize inputs to prevent SQL injection (Supabase handles this)
 * 
 * 3. DUPLICATE PREVENTION
 *    - Check if player name already exists
 *    - Add unique constraint in database
 *    - Return better error message for duplicates
 * 
 * 4. UPDATE ENDPOINT
 *    - Add PUT /api/players/[id] to update player info
 *    - Allow editing name and favorite_course
 * 
 * 5. DELETE ENDPOINT
 *    - Add DELETE /api/players/[id] to remove players
 *    - Decide whether to cascade delete rounds or prevent deletion
 * 
 * 6. PAGINATION
 *    - If app grows to hundreds of players
 *    - Add ?limit= and ?offset= query parameters
 *    - Return total count with results
 * 
 * 7. SEARCH/FILTER
 *    - Add ?search= query parameter
 *    - Filter players by name
 *    - Use Supabase .ilike() for case-insensitive search
 */
