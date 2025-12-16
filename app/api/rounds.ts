import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("player_id");

  let query = supabaseServer.from("rounds").select("*");
  if (playerId) query = query.eq("player_id", playerId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { player_id, date, course, tee, rating, slope, score } = body;

    const { data, error } = await supabaseServer
      .from("rounds")
      .insert([{ player_id, date, course, tee, rating, slope, score }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
