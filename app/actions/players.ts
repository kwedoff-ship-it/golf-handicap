// Server actions for player data
// These run on the server and can be called directly from components
"use server"

import { supabaseServer } from "@/lib/supabaseServer"
import { revalidatePath } from "next/cache"
import type { Player } from "@/lib/types"

// Add a new player to the database
export async function addPlayer(formData: FormData) {
  try {
    // Extract form fields
    const name = formData.get("name") as string
    const favorite_course = formData.get("favorite_course") as string | null

    // Validate name is provided
    if (!name || name.trim() === "") {
      return { success: false, error: "Name is required" }
    }

    // Insert into database
    const { data, error } = await supabaseServer
      .from("players")
      .insert([{ name: name.trim(), favorite_course: favorite_course?.trim() || null }])
      .select()
      .single()

    if (error) {
      console.error("Error adding player:", error)
      return { success: false, error: error.message }
    }

    // Refresh the page cache to show new data
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

// Fetch all players from the database
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
