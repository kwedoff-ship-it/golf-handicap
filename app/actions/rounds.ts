// Server actions for round data
"use server"

import { supabaseServer } from "@/lib/supabaseServer"
import { revalidatePath } from "next/cache"
import type { Round } from "@/lib/types"

// Add a new round to the database
export async function addRound(formData: FormData) {
  try {
    // Extract all form fields
    const player_id = formData.get("player_id") as string
    const date = formData.get("date") as string
    const course = formData.get("course") as string
    const tee = formData.get("tee") as string
    const rating = formData.get("rating") as string
    const slope = formData.get("slope") as string
    const score = formData.get("score") as string

    // Validate required fields
    if (!player_id) {
      return { success: false, error: "Player ID is required" }
    }

    if (!date || !course || !tee || !rating || !slope || !score) {
      return { success: false, error: "All fields are required" }
    }

    // Convert strings to numbers
    const ratingNum = Number.parseFloat(rating)
    const slopeNum = Number.parseInt(slope)
    const scoreNum = Number.parseInt(score)

    if (isNaN(ratingNum) || isNaN(slopeNum) || isNaN(scoreNum)) {
      return { success: false, error: "Invalid numeric values" }
    }

    // Insert into database
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

    // Refresh the page cache
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

// Fetch all rounds for a specific player
export async function getRounds(playerId: string): Promise<Round[]> {
  try {
    if (!playerId) return []

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
