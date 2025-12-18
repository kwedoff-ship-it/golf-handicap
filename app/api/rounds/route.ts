/**
 * =============================================================================
 * ROUNDS API ROUTE
 * =============================================================================
 * 
 * Next.js API Route Handler for round-related operations.
 * 
 * FILE LOCATION: app/api/rounds/route.ts
 * ENDPOINT: /api/rounds
 * 
 * NEXT.JS CONVENTIONS:
 * - File-based routing: route.ts in api/rounds/ = /api/rounds endpoint
 * - Named exports: GET, POST functions = HTTP methods
 * - Server-side only: Runs on server, not in browser
 * - Query parameters: GET requests can include ?player_id=123
 * 
 * FEATURES:
 * - GET: Fetch rounds for a specific player (via query parameter)
 * - POST: Create a new round in database
 * - Input validation and type conversion
 * - Error handling with appropriate HTTP status codes
 * - Database operations via Supabase
 * 
 * DATABASE:
 * - Uses Supabase for data storage
 * - Table: "rounds"
 * - Fields: id (UUID), player_id (UUID), date (date), course (text),
 *           tee (text), rating (float), slope (int), score (int)
 */

import { supabaseServer } from "@/lib/supabaseServer" // Supabase client for server-side operations
import { type NextRequest, NextResponse } from "next/server" // Next.js API route types

// =============================================================================
// GET: FETCH ROUNDS FOR A PLAYER
// =============================================================================

/**
 * GET Handler
 * Fetches all rounds for a specific player
 * 
 * HTTP METHOD: GET
 * ENDPOINT: /api/rounds?player_id=123
 * 
 * QUERY PARAMETERS:
 * - player_id (required): UUID of the player to fetch rounds for
 * 
 * RESPONSE:
 * - Success (200): JSON array of round objects (empty array if no rounds)
 * - Error (500): JSON object with error message
 * 
 * FLOW:
 * 1. Extract player_id from query parameters
 * 2. If no player_id, return empty array
 * 3. Query Supabase for rounds matching player_id
 * 4. Order by date (newest first)
 * 5. Return JSON response
 * 6. Handle errors gracefully
 */
export async function GET(req: NextRequest) {
  /**
   * Extract Query Parameters
   * req.url contains the full URL including query string
   * new URL(req.url) parses it
   * searchParams.get() extracts specific parameter
   */
  const { searchParams } = new URL(req.url)
  const player_id = searchParams.get("player_id")
  // Example: /api/rounds?player_id=abc123 → player_id = "abc123"

  /**
   * Guard Clause: No Player ID
   * If no player_id provided, return empty array
   * This prevents errors and allows graceful handling
   */
  if (!player_id) {
    return NextResponse.json([], { status: 200 })
    // Return empty array with 200 (OK) status
  }

  /**
   * Supabase Query
   * - from("rounds"): Select from rounds table
   * - select("*"): Get all columns
   * - eq("player_id", player_id): Filter where player_id matches
   * - order("date", { ascending: false }): Sort by date, newest first
   */
  const { data, error } = await supabaseServer
    .from("rounds")
    .select("*")
    .eq("player_id", player_id) // Filter: where player_id = player_id
    .order("date", { ascending: false }) // Newest rounds first

  // Check for database errors
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return 200 (OK) with rounds data array
  return NextResponse.json(data)
}

// =============================================================================
// POST: CREATE NEW ROUND
// =============================================================================

/**
 * POST Handler
 * Creates a new round in the database
 * 
 * HTTP METHOD: POST
 * ENDPOINT: /api/rounds
 * 
 * REQUEST BODY:
 * {
 *   "player_id": "uuid-here",
 *   "date": "2024-01-15",
 *   "course": "Pebble Beach",
 *   "tee": "Blue",
 *   "rating": 72.5,
 *   "slope": 130,
 *   "score": 85
 * }
 * 
 * RESPONSE:
 * - Success (200): JSON object of created round (includes generated id)
 * - Error (400): JSON object with error message (validation error)
 * - Error (500): JSON object with error message (database error)
 * 
 * FLOW:
 * 1. Parse request body (JSON)
 * 2. Validate required fields
 * 3. Convert string inputs to numbers (rating, slope, score)
 * 4. Validate numeric values
 * 5. Insert into Supabase
 * 6. Return created round with generated ID
 * 7. Handle errors gracefully
 */
export async function POST(req: NextRequest) {
  /**
   * Parse Request Body
   * Extract all fields from JSON request body
   * Note: rating, slope, score come as strings from form, need conversion
   */
  const { player_id, date, course, tee, rating, slope, score } = await req.json()

  // =========================================================================
  // VALIDATION
  // =========================================================================
  
  /**
   * Validate Required Fields
   * Check that player_id is provided
   * Return 400 (Bad Request) if missing
   */
  if (!player_id) {
    return NextResponse.json({ error: "Player ID required" }, { status: 400 })
  }

  /**
   * Validate All Round Fields
   * Check that all required fields are provided
   * Return 400 if any are missing
   */
  if (!date || !course || !tee || !rating || !slope || !score) {
    return NextResponse.json(
      { error: "All round fields are required" },
      { status: 400 }
    )
  }

  // =========================================================================
  // TYPE CONVERSION
  // =========================================================================
  
  /**
   * Convert Strings to Numbers
   * Form inputs return strings, but database expects numbers
   * - rating: Float (allows decimals like 72.5)
   * - slope: Integer (whole numbers only, 55-155)
   * - score: Integer (whole numbers only)
   */
  const ratingNum = Number.parseFloat(rating) // Convert to float
  const slopeNum = Number.parseInt(slope) // Convert to integer
  const scoreNum = Number.parseInt(score) // Convert to integer

  /**
   * Validate Numeric Values
   * Check that conversions were successful (not NaN)
   * Return 400 if any conversion failed
   */
  if (isNaN(ratingNum) || isNaN(slopeNum) || isNaN(scoreNum)) {
    return NextResponse.json(
      { error: "Invalid numeric values" },
      { status: 400 }
    )
  }

  // =========================================================================
  // DATABASE INSERT
  // =========================================================================
  
  /**
   * Supabase Insert
   * - from("rounds"): Insert into rounds table
   * - insert([{ ... }]): Insert single object (array with one item)
   * - select(): Return the inserted row (includes generated id)
   */
  const { data, error } = await supabaseServer
    .from("rounds")
    .insert([
      {
        player_id,
        date,
        course,
        tee,
        rating: ratingNum, // Use converted number
        slope: slopeNum, // Use converted number
        score: scoreNum, // Use converted number
      },
    ])
    .select() // Return the inserted row

  // Check for database errors
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return 200 (OK) with created round data
  // data[0] because insert returns an array, we want the first (and only) item
  return NextResponse.json(data[0])
}
