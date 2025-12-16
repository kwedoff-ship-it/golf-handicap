"use client"
import { useState, useEffect } from "react"

type Player = { id: string; name: string; favorite_course?: string }
type Round = { id: string; player_id: string; date: string; course: string; tee: string; rating: number; slope: number; score: number }

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [rounds, setRounds] = useState<Round[]>([])
  const [newPlayer, setNewPlayer] = useState({ name: "", favorite_course: "" })
  const [form, setForm] = useState({ date: "", course: "", tee: "", rating: "", slope: "", score: "" })
  const [loading, setLoading] = useState(false)

  const inputClass = "border rounded px-3 py-2 w-full text-black placeholder-black"

  // Fetch all players
  useEffect(() => {
    const fetchPlayers = async () => {
      const res = await fetch("/api/players")
      const data = await res.json()
      setPlayers(data)
      if (data.length > 0) setSelectedPlayer(data[0].id)
    }
    fetchPlayers()
  }, [])

  // Fetch rounds for selected player
  useEffect(() => {
    if (!selectedPlayer) return
    const fetchRounds = async () => {
      const res = await fetch(`/api/rounds?player_id=${selectedPlayer}`)
      const data = await res.json()
      setRounds(data)
    }
    fetchRounds()
  }, [selectedPlayer])

  // Submit new player
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayer.name) return alert("Name is required")
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPlayer),
    })
    const data = await res.json()
    if (res.ok) {
      setPlayers([...players, data])
      setSelectedPlayer(data.id)
      setNewPlayer({ name: "", favorite_course: "" })
    } else {
      alert(data.error)
    }
  }

  // Submit new round
  const handleSubmitRound = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlayer) return alert("Select a player first")
    setLoading(true)
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
      setRounds(await roundsRes.json())
    } else {
      alert(data.error)
    }
    setLoading(false)
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">⛳ Golf Handicap Tracker</h1>

      {/* Add Player Form */}
      <form onSubmit={handleAddPlayer} className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Player Name"
          value={newPlayer.name}
          onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
          className={inputClass}
          required
        />
        <input
          type="text"
          placeholder="Favorite Course"
          value={newPlayer.favorite_course}
          onChange={(e) => setNewPlayer({ ...newPlayer, favorite_course: e.target.value })}
          className={inputClass}
        />
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
          Add Player
        </button>
      </form>

      {/* Player Selector */}
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Select Player:</label>
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

      {/* Round Form */}
      <form onSubmit={handleSubmitRound} className="bg-white p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <input type="date" name="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} required />
        <input type="text" name="course" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} className={inputClass} required />
        <input type="text" name="tee" value={form.tee} onChange={(e) => setForm({ ...form, tee: e.target.value })} className={inputClass} required />
        <input type="number" step="0.1" name="rating" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className={inputClass} required />
        <input type="number" name="slope" value={form.slope} onChange={(e) => setForm({ ...form, slope: e.target.value })} className={inputClass} required />
        <input type="number" name="score" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} className={inputClass} required />
        <button type="submit" disabled={loading} className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 col-span-1 sm:col-span-4">
          {loading ? "Saving..." : "Add Round"}
        </button>
      </form>

      {/* Rounds Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-200">
            {["Date", "Course", "Tee", "Rating", "Slope", "Score"].map((h) => (
              <th key={h} className="border px-4 py-2 text-black">{h}</th>
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
