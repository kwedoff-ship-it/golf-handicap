import { createClient } from "@/lib/supabaseServer"
import { type NextRequest, NextResponse } from "next/server"

/* ---------------- GET: fetch all players ---------------- */
export async function GET() {
  try {
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
    const { data, error } = await supabase.from("players").select("*").order("name", { ascending: true })

    if (error) {
      console.error("[v0] Supabase error fetching players:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully fetched players:", data?.length || 0, "players")
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

    const supabase = await createClient()
    const { data, error } = await supabase.from("players").insert([{ name, favorite_course }]).select()

    if (error) {
      console.error("[v0] Supabase error creating player:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully created player:", data[0])
    return NextResponse.json(data[0])
  } catch (err) {
    console.error("[v0] Unexpected error in POST /api/players:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
