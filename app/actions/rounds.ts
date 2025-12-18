/**
 * =============================================================================
 * SERVER ACTIONS - ROUNDS
 * =============================================================================
 * 
 * Server Actions for round-related operations.
 * 
 * SERVER-SIDE RENDERING BENEFITS:
 * - ✅ Secure: Database operations on server
 * - ✅ Fast: No network round-trip from client
 * - ✅ Type-safe: Full TypeScript support
 * - ✅ Automatic revalidation: Cache updates automatically
 * 
 * CLIENT-SIDE vs SERVER-SIDE:
 * 
 * CLIENT-SIDE (Old approach):
 * - ❌ fetch() call from browser
 * - ❌ Network latency
 * - ❌ Manual cache management
 * - ❌ More JavaScript bundle size
 * 
 * SERVER-SIDE (This approach):
 * - ✅ Direct database access
 * - ✅ No network latency for server
 * - ✅ Automatic cache revalidation
 * - ✅ Smaller client bundle
 */

"use server" // Next.js directive: Server Actions

import { supabaseServer } from "@/lib/supabaseServer"
import { revalidatePath } from "next/cache"
import type { Round } from "@/lib/types"

/**
 * Add Round Server Action
 * 
 * SERVER-SIDE PROCESSING:
 * - Type conversion happens on server
 * - Validation on server (secure)
 * - Database insert on server
 * - Cache revalidation automatic
 * 
 * @param formData - Form data from form submission
 * @returns Created round object or error
 */
export async function addRound(formData: FormData) {
  try {
    // Extract and validate form data
    const player_id = formData.get("player_id") as string
    const date = formData.get("date") as string
    const course = formData.get("course") as string
    const tee = formData.get("tee") as string
    const rating = formData.get("rating") as string
    const slope = formData.get("slope") as string
    const score = formData.get("score") as string

    // Validation
    if (!player_id) {
      return { success: false, error: "Player ID is required" }
    }

    if (!date || !course || !tee || !rating || !slope || !score) {
      return { success: false, error: "All fields are required" }
    }

    // Type conversion (server-side)
    const ratingNum = Number.parseFloat(rating)
    const slopeNum = Number.parseInt(slope)
    const scoreNum = Number.parseInt(score)

    if (isNaN(ratingNum) || isNaN(slopeNum) || isNaN(scoreNum)) {
      return { success: false, error: "Invalid numeric values" }
    }

    // Insert into database (server-side)
    const { data, error } = await supabaseServer
      .from("rounds")
      .insert([
        {
          player_id,
          date,
          course: course.trim(),
          tee: tee.trim(),
          rating: ratingNum,
          slope: slopeNum,
          score: scoreNum,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error adding round:", error)
      return { success: false, error: error.message }
    }

    // Revalidate cache so fresh data is shown
    revalidatePath("/")
    
    return { success: true, data: data as Round }
  } catch (err) {
    console.error("Unexpected error adding round:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add round",
    }
  }
}

/**
 * Get Rounds for Player Server Function
 * 
 * SERVER-SIDE DATA FETCHING:
 * - ✅ Fetched on server (faster)
 * - ✅ Available in initial HTML
 * - ✅ Can be cached
 * - ✅ No client JavaScript needed
 * 
 * @param playerId - ID of player to fetch rounds for
 * @returns Array of rounds for the player
 */
export async function getRounds(playerId: string): Promise<Round[]> {
  try {
    if (!playerId) {
      return []
    }

    const { data, error } = await supabaseServer
      .from("rounds")
      .select("*")
      .eq("player_id", playerId)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching rounds:", error)
      return []
    }

    return (data as Round[]) || []
  } catch (err) {
    console.error("Unexpected error fetching rounds:", err)
    return []
  }
}

