import { supabaseServer } from "@/lib/supabaseServer"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const player_id = req.nextUrl.searchParams.get("player_id")
  let query = supabaseServer.from("rounds").select("*")

  if (player_id) {
    query = query.eq("player_id", player_id)
  }

  const { data, error } = await query.order("date", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { player_id, date, course, tee, rating, slope, score } = await req.json()

  if (!player_id) return NextResponse.json({ error: "Player is required" }, { status: 400 })

  const { data, error } = await supabaseServer
    .from("rounds")
    .insert([{ player_id, date, course, tee, rating, slope, score }])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}
