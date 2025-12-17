"use client"

import { useState, useEffect } from "react"

type Player = {
  id: string
  name: string
  favorite_course?: string
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
  const [newPlayer, setNewPlayer] = useState({ name: "", favorite_course: "" })
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

  const inputClass =
    "border rounded px-3 py-2 w-full text-white placeholder-white bg-gray-800"

  // Fetch players
  const fetchPlayers = async () => {
    try {
      const res = await fetch("/api/players")
      const data = await res.json()
      setPlayers(data)
      if (data.length > 0 && !selectedPlayer) setSelectedPlayer(data[0].id)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  // Fetch rounds for selected player
  const fetchRounds = async (playerId: string) => {
    try {
      const res = await fetch(`/api/rounds?player_id=${playerId}`)
      const data = await res.json()
      setRounds(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (selectedPlayer) fetchRounds(selectedPlayer)
  }, [selectedPlayer])

  // Add new player
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayer.name) return
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlayer),
      })
      const data = await res.json()
      if (res.ok) {
        setPlayers((prev) => [...prev, data])
        setSelectedPlayer(data.id)
        setNewPlayer({ name: "", favorite_course: "" })
      } else {
        console.error(data.error)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Add new round
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
        fetchRounds(selectedPlayer)
      } else console.error(data.error)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const calculateHandicap = (rounds: Round[]) => {
    if (!rounds.length) return 0
    const differentials = rounds.map((r) => ((r.score - r.rating) * 113) / r.slope)
    const avgDiff = differentials.reduce((a, b) => a + b, 0) / differentials.length
    return parseFloat(avgDiff.toFixed(1))
  }

  const handicap = calculateHandicap(rounds)

  return (
    <main className="p-8 max-w-4xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-6">⛳ Golf Handicap Tracker</h1>

      {/* Add Player Form */}
      <form onSubmit={handleAddPlayer} className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">Player Name</label>
          <input
            type="text"
            value={newPlayer.name}
            onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
            placeholder="Enter player name"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block mb-1">Favorite Course</label>
          <input
            type="text"
            value={newPlayer.favorite_course}
            onChange={(e) => setNewPlayer({ ...newPlayer, favorite_course: e.target.value })}
            placeholder="Favorite course"
            className={inputClass}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded col-span-1 sm:col-span-2"
        >
          Add Player
        </button>
      </form>

      {/* Player Selector */}
      <div className="mb-4">
        <label className="block mb-1">Select Player</label>
        <select
          value={selectedPlayer || ""}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          className={inputClass}
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.favorite_course || "No Favorite Course"})
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <span className="font-semibold">Current Handicap: </span>
        {handicap}
      </div>

      {/* Add Round Form */}
      <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block mb-1">Date</label>
          <input type="date" name="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} required/>
        </div>
        <div>
          <label className="block mb-1">Course</label>
          <input type="text" name="course" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Course name" className={inputClass} required/>
        </div>
        <div>
          <label className="block mb-1">Tee</label>
          <input type="text" name="tee" value={form.tee} onChange={(e) => setForm({ ...form, tee: e.target.value })} placeholder="Tee" className={inputClass} required/>
        </div>
        <div>
          <label className="block mb-1">Rating</label>
          <input type="number" step="0.1" name="rating" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} placeholder="Rating" className={inputClass} required/>
        </div>
        <div>
          <label className="block mb-1">Slope</label>
          <input type="number" name="slope" value={form.slope} onChange={(e) => setForm({ ...form, slope: e.target.value })} placeholder="Slope" className={inputClass} required/>
        </div>
        <div>
          <label className="block mb-1">Score</label>
          <input type="number" name="score" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} placeholder="Score" className={inputClass} required/>
        </div>
        <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 col-span-1 sm:col-span-4">
          {loading ? "Saving..." : "Add Round"}
        </button>
      </form>

      {/* Rounds Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-700">
            {["Date", "Course", "Tee", "Rating", "Slope", "Score"].map((h) => (
              <th key={h} className="border px-4 py-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rounds.map((r) => (
            <tr key={r.id} className="hover:bg-gray-800">
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
