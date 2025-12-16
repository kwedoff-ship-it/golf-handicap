"use client"

import { useState, useEffect } from "react"
import { supabaseServer } from "@/lib/supabaseServer"

type Player = {
  id: string
  name: string
}

type Round = {
  id: string
  player_id: string
  date: string
  course: string
  tee: string
  rating: number
  slope: number
  score: number
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [rounds, setRounds] = useState<Round[]>([])
  const [form, setForm] = useState({
    date: "",
    course: "",
    tee: "",
    rating: "",
    slope: "",
    score: "",
  })
  const [loading, setLoading] = useState(false)

  const inputClass = "border rounded px-3 py-2 w-full text-black placeholder-black"

  // Fetch players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("/api/players")
        const data = await res.json()
        setPlayers(data)
        if (data.length > 0) setSelectedPlayer(data[0].id)
      } catch (err) {
        console.error(err)
      }
    }
    fetchPlayers()
  }, [])

  // Fetch rounds for selected player
  useEffect(() => {
    if (!selectedPlayer) return

    const fetchRounds = async () => {
      try {
        const res = await fetch(`/api/rounds?player_id=${selectedPlayer}`)
        const data = await res.json()
        setRounds(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchRounds()
  }, [selectedPlayer])

  // Update form player_name on selection
  useEffect(() => {
    if (!selectedPlayer) return
    const player = players.find((p) => p.id === selectedPlayer)
    if (player) {
      setForm((prev) => ({ ...prev, player_name: player.name }))
    }
  }, [selectedPlayer, players])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlayer) return
    setLoading(true)
    try {
      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: selectedPlayer,
          ...form,
          rating: parseFloat(form.rating),
          slope: parseInt(form.slope),
          score: parseInt(form.score),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setForm({ date: "", course: "", tee: "", rating: "", slope: "", score: "" })
        const roundsRes = await fetch(`/api/rounds?player_id=${selectedPlayer}`)
        const roundsData = await roundsRes.json()
        setRounds(roundsData)
      } else {
        console.error(data.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const calculateHandicap = (rounds: Round[]) => {
    if (!rounds.length) return 0
    const differentials = rounds.map(
      (r) => ((r.score - r.rating) * 113) / r.slope
    )
    const avgDiff = differentials.reduce((a, b) => a + b, 0) / differentials.length
    return parseFloat(avgDiff.toFixed(1))
  }

  const handicap = calculateHandicap(rounds)

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">⛳ Golf Handicap Tracker</h1>

      {/* Player Selector */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Select Player:</label>
        <select
          value={selectedPlayer || ""}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          className={inputClass}
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <span className="font-semibold">Current Handicap:</span> {handicap}
      </div>

      {/* Round Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4"
      >
        <input
          type="date"
          name="date"
          placeholder="Date"
          value={form.date}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          type="text"
          name="course"
          placeholder="Course"
          value={form.course}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          type="text"
          name="tee"
          placeholder="Tee"
          value={form.tee}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          type="number"
          step="0.1"
          name="rating"
          placeholder="Rating"
          value={form.rating}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          type="number"
          name="slope"
          placeholder="Slope"
          value={form.slope}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          type="number"
          name="score"
          placeholder="Score"
          value={form.score}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 col-span-1 sm:col-span-4"
        >
          {loading ? "Saving..." : "Add Round"}
        </button>
      </form>

      {/* Rounds Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-200">
            {["Date", "Course", "Tee", "Rating", "Slope", "Score"].map((h) => (
              <th key={h} className="border px-4 py-2 text-black">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rounds.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{r.date}</td>
              <td className="border px-4 py-2">{r.course}</td>
              <td className="border px-4 py-2">{r.tee}</td>
              <td className="border px-4 py-2">{r.rating}</td>
              <td className="border px-4 py-2">{r.slope}</td>
              <td className="border px-4 py-2">{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
