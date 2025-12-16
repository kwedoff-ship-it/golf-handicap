import { supabaseServer } from "@/lib/supabaseServer"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player_id = searchParams.get("player_id")

  if (!player_id) {
    return NextResponse.json({ error: "player_id is required" }, { status: 400 })
  }

  const { data, error } = await supabaseServer
    .from("rounds")
    .select("*")
    .eq("player_id", player_id)
    .order("date", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { player_id, date, course, tee, rating, slope, score } = body

  if (!player_id) return NextResponse.json({ error: "player_id is required" }, { status: 400 })
  if (!date || !course || !tee || rating == null || slope == null || score == null) {
    return NextResponse.json({ error: "All round fields are required" }, { status: 400 })
  }

  const { data, error } = await supabaseServer
    .from("rounds")
    .insert([{ player_id, date, course, tee, rating, slope, score }])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}
