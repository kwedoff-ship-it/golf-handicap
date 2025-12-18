/**
 * =============================================================================
 * PROFILE VIEW COMPONENT
 * =============================================================================
 * 
 * The detailed profile view for a selected player.
 * Shows comprehensive statistics, handicap trend chart, and full round history.
 * 
 * FEATURES:
 * - Player header with name and home course
 * - Current handicap display
 * - Statistics card (Total Rounds, Avg Score, Best Score)
 * - Handicap trend chart (6 months)
 * - Complete rounds table with differentials
 * - Back button to return to dashboard
 * 
 * REACT PATTERNS:
 * - Presentational component (receives data via props)
 * - useMemo for expensive calculations
 * - Component composition
 * - Conditional rendering
 * 
 * DATA FLOW:
 * - Receives player and rounds from parent
 * - Calculates derived data (handicap, history, stats)
 * - Calls parent callback to navigate back
 * 
 * TAILWIND STYLING:
 * - Dark gradient background
 * - Two-column layout (stats sidebar + main content)
 * - Responsive design
 */

"use client" // Next.js directive: Client Component

import { useMemo } from "react" // React hook for memoized calculations
import { ArrowLeft } from "lucide-react" // Back arrow icon
import type { Player, Round } from "@/lib/types"
import { calculateHandicap, calculateHandicapHistory } from "@/lib/handicap"
import { KPICard } from "./KPICard"
import { HandicapChart } from "./HandicapChart"
import { RoundTable } from "./RoundTable"

/**
 * Props Interface
 * 
 * @property player - The player object to display
 * @property rounds - All rounds for this player
 * @property onBack - Callback to return to dashboard view
 */
interface ProfileProps {
  player: Player
  rounds: Round[]
  onBack: () => void
}

/**
 * Profile Component
 * 
 * Detailed view of a player's golf statistics and history
 */
export function Profile({ player, rounds, onBack }: ProfileProps) {
  // ===========================================================================
  // COMPUTED VALUES (Memoized for Performance)
  // ===========================================================================
  
  /**
   * Current Handicap
   * Calculated using all rounds for this player
   * Memoized: Only recalculates when rounds array changes
   */
  const handicap = useMemo(() => calculateHandicap(rounds), [rounds])

  /**
   * Handicap History
   * Array of handicap values over time (last 6 months)
   * Used for the trend chart
   * Memoized: Only recalculates when rounds array changes
   */
  const handicapHistory = useMemo(
    () => calculateHandicapHistory(rounds),
    [rounds]
  )

  /**
   * Sorted Rounds
   * All rounds sorted by date (newest first)
   * Memoized: Only recalculates when rounds array changes
   */
  const sortedRounds = useMemo(() => {
    return [...rounds].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      // Sort newest first (negative result = a comes before b)
    )
  }, [rounds])

  /**
   * Average Score
   * Calculates mean of all round scores
   * Returns "N/A" if no rounds exist
   * Memoized: Only recalculates when rounds array changes
   */
  const averageScore = useMemo(() => {
    if (rounds.length === 0) return "N/A"
    // Calculate sum of all scores, divide by count, format to 1 decimal
    return (rounds.reduce((sum, r) => sum + r.score, 0) / rounds.length).toFixed(
      1
    )
  }, [rounds])

  /**
   * Best Score
   * Finds the lowest (best) score from all rounds
   * Returns "N/A" if no rounds exist
   * Memoized: Only recalculates when rounds array changes
   */
  const bestScore = useMemo(() => {
    if (rounds.length === 0) return "N/A"
    // Math.min finds the smallest value in the array
    return Math.min(...rounds.map((r) => r.score))
  }, [rounds])

  // ===========================================================================
  // RENDER
  // ===========================================================================
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      {/* Main Container with gradient background */}
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack} // Call parent callback to return to dashboard
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Profile Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{player.name}</h1>
          <p className="text-slate-400">
            Home Course: {player.favorite_course || "Not set"}
            {/* Fallback to "Not set" if favorite_course is undefined */}
          </p>
        </div>

        {/* 
          Two-Column Layout
          Responsive: 1 column on mobile, 3 columns on large screens
          Left column (stats): 1/3 width
          Right column (charts/history): 2/3 width
        */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Current Stats */}
          <div className="space-y-6">
            {/* Handicap Display Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-8 shadow-xl border border-emerald-500/20">
              <div className="text-center">
                <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide mb-2">
                  Current Handicap Index
                </p>
                <p className="text-6xl font-bold text-white mb-1">{handicap}</p>
                <p className="text-emerald-100 text-sm">
                  Based on {rounds.length} round{rounds.length !== 1 ? "s" : ""}
                  {/* Conditional plural */}
                </p>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">
                Statistics
              </h3>
              <div className="space-y-3">
                {/* Total Rounds Stat */}
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Rounds</span>
                  <span className="text-white font-semibold">{rounds.length}</span>
                </div>
                {/* Average Score Stat */}
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Score</span>
                  <span className="text-white font-semibold">{averageScore}</span>
                </div>
                {/* Best Score Stat */}
                <div className="flex justify-between">
                  <span className="text-slate-400">Best Score</span>
                  <span className="text-emerald-400 font-semibold">
                    {bestScore}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Charts & Full History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Handicap Trend Chart */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-6">
                Handicap Trend (6 Months)
              </h2>
              <HandicapChart data={handicapHistory} />
            </div>

            {/* All Rounds Table */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-semibold text-white">All Rounds</h2>
              </div>
              {/* 
                Scrollable Table Container
                max-h-[500px]: Maximum height before scrolling
                overflow-y-auto: Vertical scroll when content exceeds height
              */}
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <RoundTable rounds={sortedRounds} showDifferential />
                {/* 
                  showDifferential={true}: Shows the differential column
                  This is the only place where differentials are shown
                */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
