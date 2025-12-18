"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { ChevronDown, ChevronUp, ArrowLeft, ChevronRight } from "lucide-react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

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

type HandicapHistory = {
  date: string
  handicap: number
  rounds: number
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
  const [isAddPlayerExpanded, setIsAddPlayerExpanded] = useState(false)
  const [isAddRoundExpanded, setIsAddRoundExpanded] = useState(false)
  const [viewingProfile, setViewingProfile] = useState(false)

  // Fetch players on mount
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("/api/players")

        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("[v0] API returned non-JSON response:", await res.text())
          setPlayers([])
          return
        }

        const data = await res.json()
        console.log("[v0] Players fetched:", data)

        // Check if we got an error response
        if (data.error) {
          console.error("[v0] API error:", data.error)
          setPlayers([])
          return
        }

        if (Array.isArray(data)) {
          setPlayers(data)
          if (data.length > 0) setSelectedPlayer(data[0].id)
        } else {
          console.error("[v0] Players data is not an array:", data)
          setPlayers([])
        }
      } catch (err) {
        console.error("[v0] Error fetching players:", err)
        setPlayers([])
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

        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("[v0] Rounds API returned non-JSON response")
          setRounds([])
          return
        }

        const data = await res.json()

        if (data.error) {
          console.error("[v0] API error fetching rounds:", data.error)
          setRounds([])
          return
        }

        setRounds(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("[v0] Error fetching rounds:", err)
        setRounds([])
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
        setIsAddPlayerExpanded(false)
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
        setIsAddRoundExpanded(false)
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

  // Calculate handicap using USGA World Handicap System
  const calculateHandicap = (rounds: Round[]) => {
    if (!rounds.length) return 0

    // Calculate differentials for each round
    const diffs = rounds.map((r) => ((r.score - r.rating) * 113) / r.slope)

    // Determine how many differentials to use based on total rounds
    let numToUse: number
    const totalRounds = diffs.length

    if (totalRounds >= 20) {
      numToUse = 8 // Best 8 of last 20
    } else if (totalRounds === 19) {
      numToUse = 7
    } else if (totalRounds === 18) {
      numToUse = 6
    } else if (totalRounds >= 15) {
      numToUse = 5
    } else if (totalRounds >= 12) {
      numToUse = 4
    } else if (totalRounds >= 9) {
      numToUse = 3
    } else if (totalRounds >= 6) {
      numToUse = 2
    } else if (totalRounds >= 3) {
      numToUse = 1
    } else {
      // Less than 3 rounds - cannot calculate official handicap
      return 0
    }

    // Sort differentials (lowest to highest) and take the best N
    const sortedDiffs = [...diffs].sort((a, b) => a - b)
    const bestDiffs = sortedDiffs.slice(0, numToUse)

    // Calculate average of best differentials
    const avgDiff = bestDiffs.reduce((a, b) => a + b, 0) / bestDiffs.length

    // Handicap Index is average multiplied by 0.96 (96% multiplier)
    const handicapIndex = avgDiff * 0.96

    return Number.parseFloat(handicapIndex.toFixed(1))
  }

  const calculateHandicapHistory = (rounds: Round[]): HandicapHistory[] => {
    if (rounds.length < 3) return []

    // Sort rounds by date
    const sortedRounds = [...rounds].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const history: HandicapHistory[] = []
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Calculate handicap after each round (only if >= 3 rounds)
    sortedRounds.forEach((round, index) => {
      const roundsUpToThis = sortedRounds.slice(0, index + 1)
      const roundDate = new Date(round.date)

      // Only include rounds from the last 6 months
      if (roundDate >= sixMonthsAgo && roundsUpToThis.length >= 3) {
        const handicap = calculateHandicap(roundsUpToThis)
        history.push({
          date: round.date,
          handicap,
          rounds: roundsUpToThis.length,
        })
      }
    })

    return history
  }

  const handicap = useMemo(() => calculateHandicap(rounds), [rounds])

  const roundsThisYear = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return rounds.filter((round) => {
      const roundYear = new Date(round.date).getFullYear()
      return roundYear === currentYear
    }).length
  }, [rounds])

  const totalRounds = rounds.length

  const selectedPlayerData = Array.isArray(players) ? players.find((p) => p.id === selectedPlayer) : undefined
  const recentRounds = [...rounds].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  const handicapHistory = calculateHandicapHistory(rounds)

  if (viewingProfile && selectedPlayerData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => setViewingProfile(false)}
            className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          {/* Profile Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">{selectedPlayerData.name}</h1>
            <p className="text-slate-400">Home Course: {selectedPlayerData.favorite_course || "Not set"}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Current Stats */}
            <div className="space-y-6">
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

              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Rounds</span>
                    <span className="text-white font-semibold">{rounds.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Score</span>
                    <span className="text-white font-semibold">
                      {rounds.length > 0
                        ? (rounds.reduce((sum, r) => sum + r.score, 0) / rounds.length).toFixed(1)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Best Score</span>
                    <span className="text-emerald-400 font-semibold">
                      {rounds.length > 0 ? Math.min(...rounds.map((r) => r.score)) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts & History */}
            <div className="lg:col-span-2 space-y-6">
              {/* Handicap Trend Chart */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-white mb-6">Handicap Trend (6 Months)</h2>
                {handicapHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={handicapHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        tick={{ fill: "#94a3b8" }}
                        tickFormatter={(date) =>
                          new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        }
                      />
                      <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} domain={["dataMin - 2", "dataMax + 2"]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                        labelFormatter={(date) =>
                          new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="handicap"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: "#10b981", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-500">
                    Need at least 3 rounds to display handicap trend
                  </div>
                )}
              </div>

              {/* All Rounds Table */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800">
                  <h2 className="text-xl font-semibold text-white">All Rounds</h2>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-sm">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Date</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Course</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Tee</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Rating</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Slope</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Score</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Diff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {rounds.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                            No rounds recorded yet
                          </td>
                        </tr>
                      ) : (
                        [...rounds]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((r) => {
                            const diff = ((r.score - r.rating) * 113) / r.slope
                            return (
                              <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 text-slate-200 font-medium">
                                  {new Date(r.date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="px-6 py-4 text-slate-200">{r.course}</td>
                                <td className="px-6 py-4 text-slate-300">{r.tee}</td>
                                <td className="px-6 py-4 text-slate-300">{r.rating}</td>
                                <td className="px-6 py-4 text-slate-300">{r.slope}</td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {r.score}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-slate-300">{diff.toFixed(1)}</td>
                              </tr>
                            )
                          })
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">Golf Handicap Tracker</h1>
          <p className="text-slate-400 text-lg">Track your rounds and monitor your progress</p>
        </div>

        {/* Top Section: Player Selector + KPI Tiles */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Player Selector */}
          <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Select Player</h2>
            <select
              value={selectedPlayer || ""}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-lg"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-800">
                  {p.name}
                </option>
              ))}
            </select>
            {selectedPlayerData && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  <span className="font-medium">Home Course:</span> {selectedPlayerData.favorite_course || "Not set"}
                </div>
                <button
                  onClick={() => setViewingProfile(true)}
                  className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
                >
                  View Full Profile
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* KPI Section - now 3 tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Handicap KPI */}
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

            <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-8 shadow-xl border border-amber-500/20">
              <div className="text-center">
                <p className="text-amber-100 text-sm font-medium uppercase tracking-wide mb-2">Rounds This Year</p>
                <p className="text-6xl font-bold text-white mb-1">{roundsThisYear}</p>
                <p className="text-amber-100 text-sm">{new Date().getFullYear()}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-xl p-8 shadow-xl border border-sky-500/20">
              <div className="text-center">
                <p className="text-sky-100 text-sm font-medium uppercase tracking-wide mb-2">Total Rounds</p>
                <p className="text-6xl font-bold text-white mb-1">{totalRounds}</p>
                <p className="text-sky-100 text-sm">All Time</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Recent Rounds (Last 10)</h2>
                {rounds.length > 10 && (
                  <button
                    onClick={() => setViewingProfile(true)}
                    className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
                  >
                    View All
                  </button>
                )}
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
                    {recentRounds.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                          No rounds recorded yet. Add your first round below.
                        </td>
                      </tr>
                    ) : (
                      recentRounds.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-slate-200 font-medium">
                            {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </td>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Player - Expandable */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl shadow-xl overflow-hidden">
              <button
                onClick={() => setIsAddPlayerExpanded(!isAddPlayerExpanded)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
              >
                <h2 className="text-xl font-semibold text-white">Add New Player</h2>
                {isAddPlayerExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {isAddPlayerExpanded && (
                <div className="px-6 pb-6 border-t border-slate-800 pt-6">
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
              )}
            </div>

            {/* Record Round - Expandable */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl shadow-xl overflow-hidden">
              <button
                onClick={() => setIsAddRoundExpanded(!isAddRoundExpanded)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
              >
                <h2 className="text-xl font-semibold text-white">Record New Round</h2>
                {isAddRoundExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {isAddRoundExpanded && (
                <div className="px-6 pb-6 border-t border-slate-800 pt-6">
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
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
