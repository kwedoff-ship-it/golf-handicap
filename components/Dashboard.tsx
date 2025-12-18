/**
 * =============================================================================
 * DASHBOARD VIEW COMPONENT
 * =============================================================================
 * 
 * The main dashboard view of the Golf Handicap Tracker application.
 * Displays player selection, KPIs, recent rounds, and forms for adding data.
 * 
 * FEATURES:
 * - Player selector with profile link
 * - Three KPI cards (Handicap, Rounds This Year, Total Rounds)
 * - Recent rounds table (last 10 rounds)
 * - Collapsible forms for adding players and rounds
 * - Responsive grid layout
 * 
 * REACT PATTERNS:
 * - Presentational component (receives all data via props)
 * - useMemo for expensive calculations
 * - Component composition (uses smaller components)
 * - Callback props for user interactions
 * 
 * DATA FLOW:
 * - Receives players, rounds, selectedPlayerId from parent
 * - Calculates derived data (handicap, roundsThisYear, recentRounds)
 * - Calls parent callbacks for user actions (onPlayerChange, onAddPlayer, etc.)
 * 
 * TAILWIND STYLING:
 * - Dark gradient background
 * - Responsive grid layouts
 * - Consistent spacing and typography
 */

"use client" // Next.js directive: Client Component

import { useMemo } from "react" // React hook for memoized calculations
import type { Player, Round } from "@/lib/types"
import { calculateHandicap } from "@/lib/handicap" // Handicap calculation utility
import { PlayerSelector } from "./PlayerSelector"
import { KPICard } from "./KPICard"
import { RoundTable } from "./RoundTable"
import { AddPlayerForm } from "./AddPlayerForm"
import { AddRoundForm } from "./AddRoundForm"

/**
 * Props Interface
 * 
 * All data and callbacks come from parent component (app/page.tsx)
 * This keeps Dashboard as a presentational component
 */
interface DashboardProps {
  players: Player[]
  selectedPlayerId: string | null
  rounds: Round[]
  onPlayerChange: (playerId: string) => void
  onViewProfile: () => void
  onAddPlayer: (player: { name: string; favorite_course: string }) => Promise<{
    success: boolean
    error?: string
  }>
  onAddRound: (round: {
    player_id: string
    date: string
    course: string
    tee: string
    rating: number
    slope: number
    score: number
  }) => Promise<{ success: boolean; error?: string }>
}

/**
 * Dashboard Component
 * 
 * Main dashboard view that orchestrates multiple child components
 */
export function Dashboard({
  players,
  selectedPlayerId,
  rounds,
  onPlayerChange,
  onViewProfile,
  onAddPlayer,
  onAddRound,
}: DashboardProps) {
  // ===========================================================================
  // COMPUTED VALUES (Memoized for Performance)
  // ===========================================================================
  
  /**
   * Current Handicap
   * Calculated using USGA World Handicap System
   * Memoized: Only recalculates when rounds array changes
   */
  const handicap = useMemo(() => calculateHandicap(rounds), [rounds])
  // useMemo prevents unnecessary recalculations on every render

  /**
   * Rounds This Year
   * Counts rounds played in the current calendar year
   * Memoized: Only recalculates when rounds array changes
   */
  const roundsThisYear = useMemo(() => {
    const currentYear = new Date().getFullYear() // Get current year (e.g., 2024)
    return rounds.filter((round) => {
      const roundYear = new Date(round.date).getFullYear() // Extract year from round date
      return roundYear === currentYear // Keep only rounds from current year
    }).length // Return count
  }, [rounds])

  /**
   * Recent Rounds
   * Gets the last 10 rounds, sorted by date (newest first)
   * Memoized: Only recalculates when rounds array changes
   */
  const recentRounds = useMemo(() => {
    return [...rounds] // Create copy (don't mutate original)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort newest first
      .slice(0, 10) // Take first 10
  }, [rounds])

  // ===========================================================================
  // RENDER
  // ===========================================================================
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      {/* 
        Main Container:
        - min-h-screen: Full viewport height
        - Gradient background (dark slate)
        - Responsive padding (p-4 on mobile, p-8 on larger screens)
      */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 
          Content Container:
          - max-w-7xl: Maximum width constraint
          - mx-auto: Center horizontally
          - space-y-8: Vertical spacing between children
        */}
        
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
            Golf Handicap Tracker
          </h1>
          <p className="text-slate-400 text-lg">
            Track your rounds and monitor your progress
          </p>
        </div>

        {/* 
          Player Selector + KPI Tiles Row
          Responsive grid: 1 column on mobile, 4 columns on large screens
        */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Player Selector Card */}
          <PlayerSelector
            players={players}
            selectedPlayerId={selectedPlayerId}
            onPlayerChange={onPlayerChange}
            onViewProfile={onViewProfile}
          />

          {/* Handicap KPI Card */}
          <KPICard
            label="Current Handicap Index"
            value={handicap}
            subtitle={`Based on ${rounds.length} round${rounds.length !== 1 ? "s" : ""}`}
            // Conditional plural: "round" vs "rounds"
          />

          {/* Rounds This Year KPI Card */}
          <KPICard
            label="Rounds This Year"
            value={roundsThisYear}
            subtitle={new Date().getFullYear().toString()}
          />

          {/* Total Rounds KPI Card */}
          <KPICard label="Total Rounds" value={rounds.length} subtitle="All Time" />
        </div>

        {/* Recent Rounds Table Section */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          {/* Card Container */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            {/* Header Row */}
            <h2 className="text-xl font-semibold text-white">
              Recent Rounds (Last 10)
            </h2>
            {/* 
              "View All" Button
              Only shown if there are more than 10 rounds
              Conditional rendering
            */}
            {rounds.length > 10 && (
              <button
                onClick={onViewProfile} // Navigate to profile view
                className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
              >
                View All
              </button>
            )}
          </div>
          {/* Table Component */}
          <RoundTable rounds={recentRounds} />
          {/* 
            Note: Not passing showDifferential (defaults to false)
            Not passing maxRows (shows all recentRounds, which is already limited to 10)
          */}
        </div>

        {/* 
          Add Player and Round Forms
          Responsive grid: 1 column on mobile, 2 columns on large screens
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AddPlayerForm onAddPlayer={onAddPlayer} />
          <AddRoundForm onAddRound={onAddRound} playerId={selectedPlayerId} />
        </div>
      </div>
    </main>
  )
}
