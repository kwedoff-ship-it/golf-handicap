"use client"

import type React from "react"

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
  const handleAddRound = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlayer) return
    setLoading(true)
    try {
      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: selectedPlayer,
          date: roundForm.date,
          course: roundForm.course,
          tee: roundForm.tee,
          rating: Number.parseFloat(roundForm.rating),
          slope: Number.parseInt(roundForm.slope),
          score: Number.parseInt(roundForm.score),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setRoundForm({ date: "", course: "", tee: "", rating: "", slope: "", score: "" })
        // refresh rounds
        const roundsRes = await fetch(`/api/rounds?player_id=${selectedPlayer}`)
        const roundsData = await roundsRes.json()
        setRounds(roundsData)
      } else console.error(data.error)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate handicap
  const calculateHandicap = (rounds: Round[]) => {
    if (!rounds.length) return 0
    const diffs = rounds.map((r) => ((r.score - r.rating) * 113) / r.slope)
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length
    return Number.parseFloat(avgDiff.toFixed(1))
  }

  const handicap = calculateHandicap(rounds)
  const selectedPlayerData = players.find((p) => p.id === selectedPlayer)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">Golf Handicap Tracker</h1>
          <p className="text-slate-400 text-lg">Track your rounds and monitor your progress</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Player Management & Handicap */}
          <div className="space-y-6">
            {/* Add New Player Card */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-4">Add Player</h2>
              <form onSubmit={handleAddPlayer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Player Name</label>
                  <input
                    type="text"
                    placeholder="Enter name"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Favorite Course</label>
                  <input
                    type="text"
                    placeholder="Enter course"
                    value={newPlayer.favorite_course}
                    onChange={(e) => setNewPlayer({ ...newPlayer, favorite_course: e.target.value })}
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50"
                >
                  Add Player
                </button>
              </form>
            </div>

            {/* Player Selector */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-4">Select Player</h2>
              <select
                value={selectedPlayer || ""}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-800">
                    {p.name}
                  </option>
                ))}
              </select>
              {selectedPlayerData && (
                <div className="mt-3 text-sm text-slate-400">
                  <span className="font-medium">Home Course:</span> {selectedPlayerData.favorite_course || "Not set"}
                </div>
              )}
            </div>

            {/* Handicap Display */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-8 shadow-xl border border-emerald-500/20">
              <div className="text-center">
                <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide mb-2">
                  Current Handicap Index
                </p>
                <p className="text-6xl font-bold text-white mb-1">{handicap}</p>
                <p className="text-emerald-100 text-sm">
                  Based on {rounds.length} round{rounds.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Rounds */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Round Form */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-6">Record New Round</h2>
              <form onSubmit={handleAddRound} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                    <input
                      type="date"
                      value={roundForm.date}
                      onChange={(e) => setRoundForm({ ...roundForm, date: e.target.value })}
                      required
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Course Name</label>
                    <input
                      type="text"
                      placeholder="Course name"
                      value={roundForm.course}
                      onChange={(e) => setRoundForm({ ...roundForm, course: e.target.value })}
                      required
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tee</label>
                    <input
                      type="text"
                      placeholder="Blue"
                      value={roundForm.tee}
                      onChange={(e) => setRoundForm({ ...roundForm, tee: e.target.value })}
                      required
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="72.5"
                      value={roundForm.rating}
                      onChange={(e) => setRoundForm({ ...roundForm, rating: e.target.value })}
                      required
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Slope</label>
                    <input
                      type="number"
                      placeholder="130"
                      value={roundForm.slope}
                      onChange={(e) => setRoundForm({ ...roundForm, slope: e.target.value })}
                      required
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Score</label>
                    <input
                      type="number"
                      placeholder="85"
                      value={roundForm.score}
                      onChange={(e) => setRoundForm({ ...roundForm, score: e.target.value })}
                      required
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium px-4 py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50"
                >
                  {loading ? "Saving Round..." : "Save Round"}
                </button>
              </form>
            </div>

            {/* Rounds Table */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-semibold text-white">Round History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800/50">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Date</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Course</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Tee</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Rating</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Slope</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {rounds.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                          No rounds recorded yet. Add your first round above.
                        </td>
                      </tr>
                    ) : (
                      rounds.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-slate-200 font-medium">{r.date}</td>
                          <td className="px-6 py-4 text-slate-200">{r.course}</td>
                          <td className="px-6 py-4 text-slate-300">{r.tee}</td>
                          <td className="px-6 py-4 text-slate-300">{r.rating}</td>
                          <td className="px-6 py-4 text-slate-300">{r.slope}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {r.score}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
