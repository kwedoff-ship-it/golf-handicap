import { supabaseServer } from "@/lib/supabaseServer"
import { type NextRequest, NextResponse } from "next/server"

/* ---------------- GET: fetch rounds for a player ---------------- */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player_id = searchParams.get("player_id")

  if (!player_id) {
    return NextResponse.json([], { status: 200 })
  }

  const { data, error } = await supabaseServer
    .from("rounds")
    .select("*")
    .eq("player_id", player_id)
    .order("date", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/* ---------------- POST: add a round ---------------- */
export async function POST(req: NextRequest) {
  const { player_id, date, course, tee, rating, slope, score } = await req.json()

  if (!player_id) return NextResponse.json({ error: "Player ID required" }, { status: 400 })

  if (!date || !course || !tee || !rating || !slope || !score)
    return NextResponse.json({ error: "All round fields are required" }, { status: 400 })

  const ratingNum = Number.parseFloat(rating)
  const slopeNum = Number.parseInt(slope)
  const scoreNum = Number.parseInt(score)

  if (isNaN(ratingNum) || isNaN(slopeNum) || isNaN(scoreNum))
    return NextResponse.json({ error: "Invalid numeric values" }, { status: 400 })

  const { data, error } = await supabaseServer
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])
}
