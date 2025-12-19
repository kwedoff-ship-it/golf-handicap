/**
 * =============================================================================
 * SERVER ACTIONS - PLAYERS
 * =============================================================================
 * 
 * 
 * SERVER ACTIONS vs API ROUTES:
 * 
 * SERVER ACTIONS:
 * - Simpler: Just export async function
 * - Type-safe: Full TypeScript inference
 * - Automatic revalidation: Can trigger cache updates
 * - Progressive enhancement: Works without JavaScript
 * - No fetch() needed: Call directly from components
 * - Better error handling: Throws errors naturally
 * 
 * API ROUTES (app/api/players/route.ts):
 * - RESTful: Standard HTTP endpoints
 * - External access: Can be called from anywhere
 * - Webhooks: Can receive external webhooks
 * - More boilerplate: Request/Response handling
 * - Manual error handling: Need to check res.ok
 * 
 */

"use server" // Next.js directive: This file contains Server Actions

import { supabaseServer } from "@/lib/supabaseServer"
import { revalidatePath } from "next/cache" // Next.js function to refresh cached data
import type { Player } from "@/lib/types"

/**
 * Add Player Server Action
 * @param formData - Form data from form submission
 * @returns Created player object or error
 */
export async function addPlayer(formData: FormData) {
  try {
    // Extract form data
    const name = formData.get("name") as string
    const favorite_course = formData.get("favorite_course") as string | null

    // Validation
    if (!name || name.trim() === "") {
      return { success: false, error: "Name is required" }
    }

    // Insert into database (server-side)
    const { data, error } = await supabaseServer
      .from("players")
      .insert([{ name: name.trim(), favorite_course: favorite_course?.trim() || null }])
      .select()
      .single()

    if (error) {
      console.error("Error adding player:", error)
      return { success: false, error: error.message }
    }

    // Revalidate the page cache so fresh data is shown
    revalidatePath("/")
    
    return { success: true, data: data as Player }
  } catch (err) {
    console.error("Unexpected error adding player:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add player",
    }
  }
}

/**
 * Get All Players Server Function
 * @returns Array of all players
 */
export async function getPlayers(): Promise<Player[]> {
  try {
    const { data, error } = await supabaseServer
      .from("players")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching players:", error)
      return []
    }

    return (data as Player[]) || []
  } catch (err) {
    console.error("Unexpected error fetching players:", err)
    return []
  }
}

