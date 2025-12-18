import { createClient } from "@/lib/supabaseServer"
import { type NextRequest, NextResponse } from "next/server"

/* ---------------- GET: fetch rounds for a player ---------------- */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const player_id = searchParams.get("player_id")

    if (!player_id) {
      return NextResponse.json([], { status: 200 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("[v0] Missing Supabase environment variables")
      return NextResponse.json(
        {
          error:
            "Supabase configuration missing. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 500 },
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("rounds")
      .select("*")
      .eq("player_id", player_id)
      .order("date", { ascending: false })

    if (error) {
      console.error("[v0] Supabase error fetching rounds:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully fetched rounds for player:", player_id, "- Count:", data?.length || 0)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[v0] Unexpected error in GET /api/rounds:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/* ---------------- POST: add a round ---------------- */
export async function POST(req: NextRequest) {
  try {
    const { player_id, date, course, tee, rating, slope, score } = await req.json()

    if (!player_id) return NextResponse.json({ error: "Player ID required" }, { status: 400 })

    if (!date || !course || !tee || !rating || !slope || !score)
      return NextResponse.json({ error: "All round fields are required" }, { status: 400 })

    const ratingNum = Number.parseFloat(rating)
    const slopeNum = Number.parseInt(slope)
    const scoreNum = Number.parseInt(score)

    if (isNaN(ratingNum) || isNaN(slopeNum) || isNaN(scoreNum))
      return NextResponse.json({ error: "Invalid numeric values" }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("rounds")
      .insert([
        {
          player_id,
          date,
          course,
          tee,
          rating: ratingNum,
          slope: slopeNum,
          score: scoreNum,
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Supabase error creating round:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully created round:", data[0])
    return NextResponse.json(data[0])
  } catch (err) {
    console.error("[v0] Unexpected error in POST /api/rounds:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
