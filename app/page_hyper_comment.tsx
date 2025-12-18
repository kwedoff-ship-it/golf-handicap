/**
 * =============================================================================
 * GOLF HANDICAP TRACKER - MAIN PAGE COMPONENT
 * =============================================================================
 * 
 * This is the main page component for the Golf Handicap Tracker application.
 * It provides a full-featured interface for tracking golf rounds and calculating
 * handicaps using the official USGA World Handicap System.
 * 
 * KEY FEATURES:
 * - Player management (add, select, view profiles)
 * - Round tracking with full course details
 * - USGA-compliant handicap calculation
 * - Historical handicap trend visualization
 * - KPI dashboard with key statistics
 * 
 * ARCHITECTURE:
 * - Uses React hooks for state management
 * - Fetches data from Supabase via Next.js API routes
 * - Implements client-side calculations for handicap
 * - Two-view system: Dashboard and Profile pages
 */

"use client" // This directive tells Next.js this is a Client Component (can use hooks, state, etc.)

// =============================================================================
// IMPORTS
// =============================================================================

import type React from "react" // Type-only import for React types
import { useState, useEffect, useMemo } from "react" // React hooks for state and lifecycle management
import { ChevronDown, ChevronUp, ArrowLeft, ChevronRight } from "lucide-react" // Icon components
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts" // Chart library components

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Player Type
 * Represents a golfer in the system
 * 
 * @property id - Unique identifier (UUID from Supabase)
 * @property name - Player's full name
 * @property favorite_course - Optional field for player's home course
 */
type Player = {
  id: string
  name: string
  favorite_course?: string
}

/**
 * Round Type
 * Represents a single round of golf played by a player
 * 
 * @property id - Unique identifier (UUID from Supabase)
 * @property player_id - Foreign key linking to the player
 * @property date - Date the round was played (YYYY-MM-DD format)
 * @property course - Name of the golf course
 * @property tee - Tee box played from (e.g., "Blue", "White", "Black")
 * @property rating - Course rating (difficulty for a scratch golfer)
 * @property slope - Slope rating (difficulty for a bogey golfer, 55-155 scale)
 * @property score - Total strokes for the round
 */
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

/**
 * HandicapHistory Type
 * Represents a point in time showing handicap progression
 * Used for the trend chart visualization
 * 
 * @property date - Date of the round
 * @property handicap - Calculated handicap at that point in time
 * @property rounds - Total number of rounds used in calculation
 */
type HandicapHistory = {
  date: string
  handicap: number
  rounds: number
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Home() {
  
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  
  /**
   * Players State
   * Stores array of all players in the system
   * Populated on initial component mount via API call
   */
  const [players, setPlayers] = useState<Player[]>([])
  
  /**
   * Selected Player State
   * Tracks which player is currently being viewed
   * Null when no player is selected (shouldn't happen in practice)
   * Changes trigger re-fetch of rounds data
   */
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  
  /**
   * New Player Form State
   * Temporary state for the "Add Player" form
   * Reset to empty strings after successful submission
   */
  const [newPlayer, setNewPlayer] = useState({ name: "", favorite_course: "" })
  
  /**
   * Rounds State
   * Stores all rounds for the currently selected player
   * Updated whenever selectedPlayer changes or a new round is added
   */
  const [rounds, setRounds] = useState<Round[]>([])
  
  /**
   * Round Form State
   * Temporary state for the "Add Round" form
   * All fields stored as strings initially, converted to numbers on submit
   */
  const [roundForm, setRoundForm] = useState({
    date: "",      // Date input value
    course: "",    // Course name input
    tee: "",       // Tee box input
    rating: "",    // Course rating (will be parsed to float)
    slope: "",     // Slope rating (will be parsed to int)
    score: "",     // Total score (will be parsed to int)
  })
  
  /**
   * Loading State
   * Shows loading indicator while a round is being saved
   * Prevents duplicate submissions during save operation
   */
  const [loading, setLoading] = useState(false)
  
  /**
   * UI Expansion States
   * Control whether collapsible forms are expanded or collapsed
   * Improves UX by hiding forms when not in use
   */
  const [isAddPlayerExpanded, setIsAddPlayerExpanded] = useState(false)
  const [isAddRoundExpanded, setIsAddRoundExpanded] = useState(false)
  
  /**
   * View State
   * Toggles between Dashboard view and Profile view
   * Profile view shows detailed history and charts for selected player
   */
  const [viewingProfile, setViewingProfile] = useState(false)

  // ===========================================================================
  // DATA FETCHING - PLAYERS
  // ===========================================================================
  
  /**
   * Fetch Players Effect
   * Runs once on component mount (empty dependency array [])
   * 
   * PURPOSE:
   * - Load all players from the database
   * - Automatically select the first player
   * - Handle errors gracefully
   * 
   * FLOW:
   * 1. Make GET request to /api/players
   * 2. Validate response is JSON
   * 3. Check for API errors
   * 4. Update players state
   * 5. Auto-select first player if any exist
   */
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        // Make GET request to players API endpoint
        const res = await fetch("/api/players")

        // Validate response type before parsing
        // This prevents errors when API returns HTML error pages
        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("[v0] API returned non-JSON response:", await res.text())
          setPlayers([]) // Set to empty array to prevent crashes
          return
        }

        // Parse JSON response
        const data = await res.json()
        console.log("[v0] Players fetched:", data)

        // Check if API returned an error object
        if (data.error) {
          console.error("[v0] API error:", data.error)
          setPlayers([])
          return
        }

        // Ensure data is an array before using it
        if (Array.isArray(data)) {
          setPlayers(data)
          // Auto-select first player for better UX
          if (data.length > 0) setSelectedPlayer(data[0].id)
        } else {
          console.error("[v0] Players data is not an array:", data)
          setPlayers([])
        }
      } catch (err) {
        // Catch network errors, JSON parse errors, etc.
        console.error("[v0] Error fetching players:", err)
        setPlayers([])
      }
    }
    fetchPlayers()
  }, []) // Empty dependency array = run once on mount

  // ===========================================================================
  // DATA FETCHING - ROUNDS
  // ===========================================================================
  
  /**
   * Fetch Rounds Effect
   * Runs whenever selectedPlayer changes
   * 
   * PURPOSE:
   * - Load all rounds for the currently selected player
   * - Update rounds whenever player selection changes
   * - Handle cases where no player is selected
   * 
   * FLOW:
   * 1. Check if player is selected (early return if not)
   * 2. Make GET request with player_id query parameter
   * 3. Validate and parse response
   * 4. Update rounds state
   */
  useEffect(() => {
    // Guard clause: don't fetch if no player selected
    if (!selectedPlayer) return
    
    const fetchRounds = async () => {
      try {
        // Make GET request with player_id as query parameter
        const res = await fetch(`/api/rounds?player_id=${selectedPlayer}`)

        // Validate response type
        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("[v0] Rounds API returned non-JSON response")
          setRounds([])
          return
        }

        // Parse response
        const data = await res.json()

        // Check for API errors
        if (data.error) {
          console.error("[v0] API error fetching rounds:", data.error)
          setRounds([])
          return
        }

        // Ensure we have an array (API returns [] if no rounds exist)
        setRounds(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("[v0] Error fetching rounds:", err)
        setRounds([])
      }
    }
    fetchRounds()
  }, [selectedPlayer]) // Re-run when selectedPlayer changes

  // ===========================================================================
  // EVENT HANDLERS - PLAYER MANAGEMENT
  // ===========================================================================
  
  /**
   * Handle Add Player
   * Submits new player form to API
   * 
   * PURPOSE:
   * - Create a new player in the database
   * - Add player to local state
   * - Auto-select newly created player
   * - Clear and collapse form on success
   * 
   * @param e - Form submit event
   */
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent page reload on form submit
    
    try {
      // Make POST request with player data
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlayer), // Send form data as JSON
      })
      
      const data = await res.json()
      
      // Check if request was successful (status 200-299)
      if (res.ok) {
        // Add new player to existing players array
        setPlayers((prev) => [...prev, data])
        
        // Auto-select the newly created player
        setSelectedPlayer(data.id)
        
        // Reset form to initial state
        setNewPlayer({ name: "", favorite_course: "" })
        
        // Collapse form for cleaner UI
        setIsAddPlayerExpanded(false)
      } else {
        // Log error if request failed
        console.error(data.error)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // ===========================================================================
  // EVENT HANDLERS - ROUND MANAGEMENT
  // ===========================================================================
  
  /**
   * Handle Add Round
   * Submits new round form to API
   * 
   * PURPOSE:
   * - Create a new round in the database
   * - Convert string inputs to appropriate number types
   * - Refresh rounds list after successful save
   * - Show loading state during save
   * 
   * @param e - Form submit event
   */
  const handleAddRound = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent page reload
    
    // Guard clause: require player selection
    if (!selectedPlayer) return
    
    setLoading(true) // Show loading indicator
    
    try {
      // Make POST request with round data
      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: selectedPlayer,
          date: roundForm.date,
          course: roundForm.course,
          tee: roundForm.tee,
          // Convert string inputs to numbers
          rating: Number.parseFloat(roundForm.rating),  // Allow decimals (e.g., 72.5)
          slope: Number.parseInt(roundForm.slope),      // Integer only
          score: Number.parseInt(roundForm.score),      // Integer only
        }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        // Reset form on success
        setRoundForm({ date: "", course: "", tee: "", rating: "", slope: "", score: "" })
        
        // Collapse form
        setIsAddRoundExpanded(false)
        
        // Refresh rounds list to show new round
        // We fetch again rather than adding locally to ensure data consistency
        const roundsRes = await fetch(`/api/rounds?player_id=${selectedPlayer}`)
        const roundsData = await roundsRes.json()
        setRounds(roundsData)
      } else {
        console.error(data.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      // Always clear loading state, even if error occurred
      setLoading(false)
    }
  }

  // ===========================================================================
  // HANDICAP CALCULATION - USGA WORLD HANDICAP SYSTEM
  // ===========================================================================
  
  /**
   * Calculate Handicap
   * Implements official USGA World Handicap System calculation
   * 
   * PURPOSE:
   * - Calculate accurate handicap index based on USGA rules
   * - Use different number of rounds based on total rounds played
   * - Apply 96% multiplier for final handicap
   * 
   * USGA RULES:
   * - Requires minimum 3 rounds
   * - Uses best N rounds where N depends on total rounds
   * - Applies 96% multiplier to average of best differentials
   * 
   * DIFFERENTIAL FORMULA:
   * (Score - Course Rating) × 113 / Slope Rating
   * 
   * WHY 113?
   * - 113 is the standard slope rating
   * - This normalizes difficulty across all courses
   * 
   * WHY 96%?
   * - Encourages players to play their best
   * - Prevents sandbagging
   * - Makes handicaps slightly more competitive
   * 
   * @param rounds - Array of rounds to calculate from
   * @returns Handicap index (number with 1 decimal place)
   */
  const calculateHandicap = (rounds: Round[]) => {
    // Return 0 if no rounds exist
    if (!rounds.length) return 0

    // Step 1: Calculate differential for each round
    // Differential = how many strokes over/under par adjusted for course difficulty
    const diffs = rounds.map((r) => ((r.score - r.rating) * 113) / r.slope)

    // Step 2: Determine how many differentials to use
    // This follows USGA rules exactly
    let numToUse: number
    const totalRounds = diffs.length

    if (totalRounds >= 20) {
      numToUse = 8 // Best 8 of last 20 (standard rule)
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

    // Step 3: Sort differentials lowest to highest
    // We want the BEST (lowest) differentials
    const sortedDiffs = [...diffs].sort((a, b) => a - b)
    
    // Step 4: Take only the best N differentials
    const bestDiffs = sortedDiffs.slice(0, numToUse)

    // Step 5: Calculate average of best differentials
    const avgDiff = bestDiffs.reduce((a, b) => a + b, 0) / bestDiffs.length

    // Step 6: Apply 96% multiplier (USGA rule)
    const handicapIndex = avgDiff * 0.96

    // Step 7: Round to 1 decimal place
    return Number.parseFloat(handicapIndex.toFixed(1))
  }

  // ===========================================================================
  // HANDICAP HISTORY CALCULATION
  // ===========================================================================
  
  /**
   * Calculate Handicap History
   * Creates array of handicap values over time for charting
   * 
   * PURPOSE:
   * - Show how handicap has changed over the last 6 months
   * - Calculate handicap after each round (progressive calculation)
   * - Filter to recent data for relevant trends
   * 
   * ALGORITHM:
   * 1. Sort rounds chronologically
   * 2. For each round, calculate handicap using all rounds up to that point
   * 3. Only include rounds from last 6 months
   * 4. Only include if player had enough rounds (3+) for valid handicap
   * 
   * @param rounds - All rounds for the player
   * @returns Array of handicap history points for charting
   */
  const calculateHandicapHistory = (rounds: Round[]): HandicapHistory[] => {
    // Need at least 3 rounds for valid handicap
    if (rounds.length < 3) return []

    // Sort rounds by date (oldest first)
    const sortedRounds = [...rounds].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const history: HandicapHistory[] = []
    
    // Calculate 6 months ago from today
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Calculate handicap after each round
    sortedRounds.forEach((round, index) => {
      // Get all rounds up to and including this one
      const roundsUpToThis = sortedRounds.slice(0, index + 1)
      const roundDate = new Date(round.date)

      // Only include if:
      // 1. Round is within last 6 months
      // 2. Player had at least 3 rounds at that point
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

  // ===========================================================================
  // COMPUTED VALUES (useMemo for performance optimization)
  // ===========================================================================
  
  /**
   * Current Handicap (Memoized)
   * Recalculates only when rounds array changes
   * 
   * useMemo prevents unnecessary recalculations on every render
   * Only recalculates when rounds dependency changes
   */
  const handicap = useMemo(() => calculateHandicap(rounds), [rounds])

  /**
   * Rounds This Year (Memoized)
   * Counts rounds played in current calendar year
   * 
   * Filters rounds array to only include current year
   * Useful for tracking annual golf activity
   */
  const roundsThisYear = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return rounds.filter((round) => {
      const roundYear = new Date(round.date).getFullYear()
      return roundYear === currentYear
    }).length
  }, [rounds])

  /**
   * Total Rounds
   * Simple count of all rounds
   * Not memoized as it's just array.length (cheap operation)
   */
  const totalRounds = rounds.length

  /**
   * Selected Player Data
   * Finds the full player object for currently selected player
   * Handles case where players might not be an array
   */
  const selectedPlayerData = Array.isArray(players) ? players.find((p) => p.id === selectedPlayer) : undefined
  
  /**
   * Recent Rounds (Last 10)
   * Sorts rounds by date (newest first) and takes first 10
   * Used for the "Recent Rounds" table on dashboard
   */
  const recentRounds = [...rounds].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  
  /**
   * Handicap History Data
   * Computed array for the handicap trend chart
   */
  const handicapHistory = calculateHandicapHistory(rounds)

  // ===========================================================================
  // PROFILE VIEW RENDER
  // ===========================================================================
  
  /**
   * Profile View
   * Shows detailed player statistics, charts, and full round history
   * 
   * Conditionally rendered when viewingProfile is true
   * Provides "Back to Dashboard" button to return
   */
  if (viewingProfile && selectedPlayerData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button - Returns to dashboard view */}
          <button
            onClick={() => setViewingProfile(false)}
            className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          {/* Profile Header - Player name and home course */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">{selectedPlayerData.name}</h1>
            <p className="text-slate-400">Home Course: {selectedPlayerData.favorite_course || "Not set"}</p>
          </div>

          {/* Two-column layout: Stats sidebar + Charts/History main area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Current Stats */}
            <div className="space-y-6">
              {/* Current Handicap Card */}
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

              {/* Statistics Card - Shows key metrics */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                <div className="space-y-3">
                  {/* Total Rounds */}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Rounds</span>
                    <span className="text-white font-semibold">{rounds.length}</span>
                  </div>
                  {/* Average Score */}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Score</span>
                    <span className="text-white font-semibold">
                      {rounds.length > 0
                        ? (rounds.reduce((sum, r) => sum + r.score, 0) / rounds.length).toFixed(1)
                        : "N/A"}
                    </span>
                  </div>
                  {/* Best Score */}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Best Score</span>
                    <span className="text-emerald-400 font-semibold">
                      {rounds.length > 0 ? Math.min(...rounds.map((r) => r.score)) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Charts & Full History */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Handicap Trend Chart - Last 6 months */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-white mb-6">Handicap Trend (6 Months)</h2>
                {handicapHistory.length > 0 ? (
                  // Recharts responsive container - automatically sizes to parent
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={handicapHistory}>
                      {/* Grid lines for easier reading */}
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      
                      {/* X-axis: Dates */}
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        tick={{ fill: "#94a3b8" }}
                        tickFormatter={(date) =>
                          new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        }
                      />
                      
                      {/* Y-axis: Handicap values */}
                      <YAxis 
                        stroke="#94a3b8" 
                        tick={{ fill: "#94a3b8" }} 
                        domain={["dataMin - 2", "dataMax + 2"]} // Add padding above/below
                      />
                      
                      {/* Hover tooltip */}
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
                      
                      {/* The actual line showing handicap progression */}
                      <Line
                        type="monotone"
                        dataKey="handicap"
                        stroke="#10b981" // Emerald green
                        strokeWidth={3}
                        dot={{ fill: "#10b981", r: 4 }}
                        activeDot={{ r: 6 }} // Larger dot on hover
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  // Empty state when not enough data
                  <div className="h-[300px] flex items-center justify-center text-slate-500">
                    Need at least 3 rounds to display handicap trend
                  </div>
                )}
              </div>

              {/* All Rounds Table - Complete history with differentials */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800">
                  <h2 className="text-xl font-semibold text-white">All Rounds</h2>
                </div>
                
                {/* Scrollable table container */}
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    {/* Sticky header stays visible while scrolling */}
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
                        // Empty state
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                            No rounds recorded yet
                          </td>
                        </tr>
                      ) : (
                        // Map through rounds (sorted newest first)
                        [...rounds]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((r) => {
                            // Calculate differential for this round
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

  // ===========================================================================
  // DASHBOARD VIEW RENDER
  // ===========================================================================
  
  /**
   * Main Dashboard View
   * Default view showing:
   * - Player selector + KPI tiles
   * - Recent rounds table
   * - Collapsible forms for adding players and rounds
   */
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">Golf Handicap Tracker</h1>
          <p className="text-slate-400 text-lg">Track your rounds and monitor your progress</p>
        </div>

        {/* Player Selector + KPI Tiles Row */}
        {/* All 4 items on one row with equal heights */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Player Selector Card */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col">
            <h2 className="text-xl font-semibold text-white mb-4">Select Player</h2>
            
            {/* Player dropdown */}
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
            
            {/* Player info and profile link */}
            {selectedPlayerData && (
              <div className="mt-4 flex-1 flex flex-col justify-between">
                <div className="text-sm text-slate-400">
                  <span className="font-medium">Home Course:</span> {selectedPlayerData.favorite_course || "Not set"}
                </div>
                <button
                  onClick={() => setViewingProfile(true)}
                  className="mt-3 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
                >
                  View Full Profile
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Handicap KPI Tile */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 shadow-xl border border-emerald-500/20 flex flex-col justify-center">
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

          {/* Rounds This Year KPI Tile */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 shadow-xl border border-emerald-500/20 flex flex-col justify-center">
            <div className="text-center">
              <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide mb-2">Rounds This Year</p>
              <p className="text-6xl font-bold text-white mb-1">{roundsThisYear}</p>
              <p className="text-emerald-100 text-sm">{new Date().getFullYear()}</p>
            </div>
          </div>

          {/* Total Rounds KPI Tile */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 shadow-xl border border-emerald-500/20 flex flex-col justify-center">
            <div className="text-center">
              <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide mb-2">Total Rounds</p>
              <p className="text-6xl font-bold text-white mb-1">{totalRounds}</p>
              <p className="text-emerald-100 text-sm">All Time</p>
            </div>
          </div>
        </div>

        {/* Recent Rounds Table */}
        {/* Shows last 10 rounds with link to view all */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Recent Rounds (Last 10)</h2>
            {/* Show "View All" button if more than 10 rounds */}
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
                  // Empty state
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No rounds recorded yet. Add your first round below.
                    </td>
                  </tr>
                ) : (
                  // Map through recent rounds
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

        {/* Add Player and Round Forms */}
        {/* Two collapsible forms side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Add Player Form - Collapsible */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl shadow-xl overflow-hidden">
            
            {/* Clickable header to expand/collapse */}
            <button
              onClick={() => setIsAddPlayerExpanded(!isAddPlayerExpanded)}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
            >
              <h2 className="text-xl font-semibold text-white">Add New Player</h2>
              {/* Show up/down chevron based on expanded state */}
              {isAddPlayerExpanded ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {/* Form content - only shown when expanded */}
            {isAddPlayerExpanded && (
              <div className="px-6 pb-6 border-t border-slate-800 pt-6">
                <form onSubmit={handleAddPlayer} className="space-y-4">
                  
                  {/* Player Name Input */}
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
                  
                  {/* Favorite Course Input */}
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
                  
                  {/* Submit Button */}
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

          {/* Record Round Form - Collapsible */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl shadow-xl overflow-hidden">
            
            {/* Clickable header */}
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

            {/* Form content */}
            {isAddRoundExpanded && (
              <div className="px-6 pb-6 border-t border-slate-800 pt-6">
                <form onSubmit={handleAddRound} className="space-y-6">
                  
                  {/* Date and Course Name Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Date Input */}
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
                    
                    {/* Course Name Input (spans 2 columns) */}
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

                  {/* Tee, Rating, Slope, Score Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    
                    {/* Tee Box Input */}
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
                    
                    {/* Course Rating Input */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
                      <input
                        type="number"
                        step="0.1" // Allow decimal values
                        placeholder="72.5"
                        value={roundForm.rating}
                        onChange={(e) => setRoundForm({ ...roundForm, rating: e.target.value })}
                        required
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    {/* Slope Rating Input */}
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
                    
                    {/* Score Input */}
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading} // Disable while saving
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium px-4 py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50"
                  >
                    {/* Show different text when loading */}
                    {loading ? "Saving Round..." : "Save Round"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
