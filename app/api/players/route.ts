import { supabaseServer } from "@/lib/supabaseServer"
import { type NextRequest, NextResponse } from "next/server"

/* ---------------- GET: fetch all players ---------------- */
export async function GET() {
  try {
    console.log("[v0] Fetching players from Supabase...")
    const { data, error } = await supabaseServer.from("players").select("*").order("name", { ascending: true })

    if (error) {
      console.error("[v0] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully fetched", data?.length || 0, "players")
    return NextResponse.json(data)
  } catch (err) {
    console.error("[v0] Unexpected error in GET /api/players:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/* ---------------- POST: add a player ---------------- */
export async function POST(req: NextRequest) {
  try {
    const { name, favorite_course } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    console.log("[v0] Adding player:", name)
    const { data, error } = await supabaseServer.from("players").insert([{ name, favorite_course }]).select()

    if (error) {
      console.error("[v0] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully added player")
    return NextResponse.json(data[0])
  } catch (err) {
    console.error("[v0] Unexpected error in POST /api/players:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
