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
  const [roundForm, setRoundForm] = useState({
    date: "",
    course: "",
    tee: "",
    rating: "",
    slope: "",
    score: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputClass =
    "border rounded px-3 py-2 w-full text-white placeholder-white bg-gray-700"

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

  // Add new player
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
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
        setError(data.error)
      }
    } catch (err) {
      console.error(err)
      setError("Failed to add player")
    }
  }

  // Add new round
  const handleAddRound = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlayer) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: selectedPlayer,
          ...roundForm,
          rating: parseFloat(roundForm.rating),
          slope: parseInt(roundForm.slope),
          score: parseInt(roundForm.score),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setRoundForm({
          date: "",
          course: "",
          tee: "",
          rating: "",
          slope: "",
          score: "",
        })
        // Refresh rounds
        const roundsRes = await fetch(`/api/rounds?player_id=${selectedPlayer}`)
        const roundsData = await roundsRes.json()
        setRounds(roundsData)
      } else {
        setError(data.error)
        console.error(data.error)
      }
    } catch (err) {
      console.error(err)
      setError("Failed to add round")
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
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">⛳ Golf Handicap Tracker</h1>

      {/* Error */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* New Player Form */}
      <form
        onSubmit={handleAddPlayer}
        className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <input
          type="text"
          placeholder="Player Name"
          value={newPlayer.name}
          onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
          required
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Favorite Course"
          value={newPlayer.favorite_course}
          onChange={(e) =>
            setNewPlayer({ ...newPlayer, favorite_course: e.target.value })
          }
          required
          className={inputClass}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 col-span-1 sm:col-span-2"
        >
          Add Player
        </button>
      </form>

      {/* Player Selector */}
      <div className="mb-4">
        <label className="block mb-2 font-semibold text-white">Select Player:</label>
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

      <div className="mb-4 text-white">
        <span className="font-semibold">Current Handicap:</span> {handicap}
      </div>

      {/* Round Form */}
      <form
        onSubmit={handleAddRound}
        className="bg-gray-800 p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4"
      >
        <input
          type="date"
          name="date"
          placeholder="Date"
          value={roundForm.date}
          onChange={(e) => setRoundForm({ ...roundForm, date: e.target.value })}
          required
          className={inputClass}
        />
        <input
          type="text"
          name="course"
          placeholder="Course"
          value={roundForm.course}
          onChange={(e) => setRoundForm({ ...roundForm, course: e.target.value })}
          required
          className={inputClass}
        />
        <input
          type="text"
          name="tee"
          placeholder="Tee"
          value={roundForm.tee}
          onChange={(e) => setRoundForm({ ...roundForm, tee: e.target.value })}
          required
          className={inputClass}
        />
        <input
          type="number"
          step="0.1"
          name="rating"
          placeholder="Course Rating"
          value={roundForm.rating}
          onChange={(e) => setRoundForm({ ...roundForm, rating: e.target.value })}
          required
          className={inputClass}
        />
        <input
          type="number"
          name="slope"
          placeholder="Slope"
          value={roundForm.slope}
          onChange={(e) => setRoundForm({ ...roundForm, slope: e.target.value })}
          required
          className={inputClass}
        />
        <input
          type="number"
          name="score"
          placeholder="Score"
          value={roundForm.score}
          onChange={(e) => setRoundForm({ ...roundForm, score: e.target.value })}
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
      <table className="w-full text-left border-collapse text-white">
        <thead>
          <tr className="bg-gray-700">
            {["Date", "Course", "Tee", "Rating", "Slope", "Score"].map((h) => (
              <th key={h} className="border px-4 py-2 text-white">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rounds.map((r) => (
            <tr key={r.id} className="hover:bg-gray-600">
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
