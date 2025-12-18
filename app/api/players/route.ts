/**
 * =============================================================================
 * PLAYERS API ROUTE
 * =============================================================================
 * 
 * Next.js API Route Handler for player-related operations.
 * 
 * FILE LOCATION: app/api/players/route.ts
 * ENDPOINT: /api/players
 * 
 * NEXT.JS CONVENTIONS:
 * - File-based routing: route.ts in api/players/ = /api/players endpoint
 * - Named exports: GET, POST functions = HTTP methods
 * - Server-side only: Runs on server, not in browser
 * - Type-safe: Uses NextRequest and NextResponse types
 * 
 * FEATURES:
 * - GET: Fetch all players from database
 * - POST: Create a new player in database
 * - Error handling with appropriate HTTP status codes
 * - Database operations via Supabase
 * 
 * DATABASE:
 * - Uses Supabase for data storage
 * - Table: "players"
 * - Fields: id (UUID), name (text), favorite_course (text, optional)
 * 
 * =============================================================================
 * NEXT.JS RENDERING STRATEGY - API ROUTES
 * =============================================================================
 * 
 * CURRENT: API Route (Server-Side)
 * - Runs exclusively on the server
 * - Not included in client JavaScript bundle
 * - Handles HTTP requests (GET, POST)
 * - Direct database access via Supabase
 * 
 * WHY API ROUTE:
 * - ✅ Server-side only (secure, no client exposure)
 * - ✅ Direct database access
 * - ✅ Standard REST API pattern
 * - ✅ Can be called from any client (web, mobile, etc.)
 * 
 * PERFORMANCE:
 * - ✅ Runs on server (fast, no client overhead)
 * - ✅ Can be cached at edge/CDN level
 * - ✅ No JavaScript bundle impact
 * 
 * =============================================================================
 * POTENTIAL IMPROVEMENTS (Future Refactoring)
 * =============================================================================
 * 
 * OPTION 1: Server Actions (Recommended for Next.js 13+)
 * - Replace API routes with Server Actions
 * - Server Actions are simpler: export async function addPlayer()
 * - Can be called directly from Client Components
 * - Better type safety (TypeScript inference)
 * - Automatic revalidation
 * - No need for fetch() calls
 * 
 * Benefits:
 * - ✅ Simpler code (no request/response handling)
 * - ✅ Better type safety
 * - ✅ Automatic form handling
 * - ✅ Progressive enhancement
 * 
 * Migration:
 * - Create app/actions/players.ts
 * - export async function addPlayer(formData: FormData)
 * - Call from Client Component: await addPlayer(formData)
 * - Remove this API route
 * 
 * OPTION 2: Keep API Routes (If needed)
 * - Keep if you need REST API for external clients
 * - Keep if you need webhooks or third-party integrations
 * - Keep if you prefer explicit HTTP endpoints
 * 
 * WHEN TO USE API ROUTES:
 * - Building public REST API
 * - Third-party integrations
 * - Webhooks
 * - When Server Actions aren't sufficient
 * 
 * WHEN TO USE SERVER ACTIONS:
 * - Internal app operations (recommended)
 * - Form submissions
 * - Mutations from Client Components
 * - Better Next.js integration
 */

import { supabaseServer } from "@/lib/supabaseServer" // Supabase client for server-side operations
import { type NextRequest, NextResponse } from "next/server" // Next.js API route types

// =============================================================================
// GET: FETCH ALL PLAYERS
// =============================================================================

/**
 * GET Handler
 * Fetches all players from the database
 * 
 * HTTP METHOD: GET
 * ENDPOINT: /api/players
 * 
 * RESPONSE:
 * - Success (200): JSON array of player objects
 * - Error (500): JSON object with error message
 * 
 * FLOW:
 * 1. Query Supabase for all players
 * 2. Order by name (ascending)
 * 3. Return JSON response
 * 4. Handle errors gracefully
 */
export async function GET() {
  try {
    console.log("[v0] Fetching players from Supabase...")
    
    /**
     * Supabase Query
     * - from("players"): Select from players table
     * - select("*"): Get all columns
     * - order("name", { ascending: true }): Sort alphabetically by name
     */
    const { data, error } = await supabaseServer
      .from("players")
      .select("*")
      .order("name", { ascending: true })

    // Check for database errors
    if (error) {
      console.error("[v0] Supabase error:", error)
      // Return 500 (Internal Server Error) with error message
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully fetched", data?.length || 0, "players")
    
    // Return 200 (OK) with player data array
    return NextResponse.json(data)
    // NextResponse.json() automatically sets Content-Type header to application/json
  } catch (err) {
    // Catch any unexpected errors (network issues, etc.)
    console.error("[v0] Unexpected error in GET /api/players:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// =============================================================================
// POST: CREATE NEW PLAYER
// =============================================================================

/**
 * POST Handler
 * Creates a new player in the database
 * 
 * HTTP METHOD: POST
 * ENDPOINT: /api/players
 * 
 * REQUEST BODY:
 * {
 *   "name": "John Doe",
 *   "favorite_course": "Pebble Beach" (optional)
 * }
 * 
 * RESPONSE:
 * - Success (200): JSON object of created player (includes generated id)
 * - Error (400): JSON object with error message (validation error)
 * - Error (500): JSON object with error message (database error)
 * 
 * FLOW:
 * 1. Parse request body (JSON)
 * 2. Validate required fields (name)
 * 3. Insert into Supabase
 * 4. Return created player with generated ID
 * 5. Handle errors gracefully
 */
export async function POST(req: NextRequest) {
  try {
    /**
     * Parse Request Body
     * req.json() reads the request body and parses it as JSON
     * Returns a Promise, so we await it
     */
    const { name, favorite_course } = await req.json()

    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    /**
     * Validate Required Fields
     * Check that name is provided (required field)
     * Return 400 (Bad Request) if validation fails
     */
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
      // 400 = Bad Request (client error, not server error)
    }

    console.log("[v0] Adding player:", name)
    
    /**
     * Supabase Insert
     * - from("players"): Insert into players table
     * - insert([{ ... }]): Insert single object (array with one item)
     * - select(): Return the inserted row (includes generated id)
     */
    const { data, error } = await supabaseServer
      .from("players")
      .insert([{ name, favorite_course }]) // Insert name and optional favorite_course
      .select() // Return the inserted row

    // Check for database errors
    if (error) {
      console.error("[v0] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully added player")
    
    // Return 200 (OK) with created player data
    // data[0] because insert returns an array, we want the first (and only) item
    return NextResponse.json(data[0])
  } catch (err) {
    // Catch any unexpected errors (JSON parse errors, etc.)
    console.error("[v0] Unexpected error in POST /api/players:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
