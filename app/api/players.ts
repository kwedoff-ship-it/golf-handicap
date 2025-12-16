import { supabaseServer } from "@/lib/supabaseServer"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const { data, error } = await supabaseServer.from("players").select("*")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, favorite_course } = body
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const { data, error } = await supabaseServer
    .from("players")
    .insert([{ name, favorite_course }])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}
