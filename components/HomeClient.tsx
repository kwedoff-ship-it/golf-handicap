/**
 * =============================================================================
 * HOME CLIENT COMPONENT
 * =============================================================================
 * 
 * Client Component that handles all interactivity for the home page.
 * 
 * WHY THIS IS A CLIENT COMPONENT:
 * Needs useState for selectedPlayerId and viewingProfile
 * Needs event handlers (onClick, onChange)
 * Dynamic view switching (Dashboard <-> Profile)
 * Interactive player selection
 * 
 * RENDERING FLOW:
 * 1. Server Component (page.tsx) fetches data
 * 2. Server Component renders initial HTML with data
 * 3. Client Component (this file) hydrates for interactivity
 * 4. User interactions happen client-side
 * 5. Mutations use Server Actions (still server-side)
 * 
 */

"use client" // Next.js - Client Component

import { useState, useEffect } from "react"
import type { Player, Round } from "@/lib/types"
import { Dashboard } from "@/components/Dashboard"
import { Profile } from "@/components/Profile"
import { addPlayer as addPlayerAction } from "@/app/actions/players"
import { addRound as addRoundAction } from "@/app/actions/rounds"

/**
 * Props Interface
 * 
 * All data comes from Server Component (pre-fetched on server)
 * This component only handles interactivity
 */
interface HomeClientProps {
  initialPlayers: Player[]
  initialRounds: Round[] // Rounds for first player (if exists)
  initialPlayerId: string | null // First player's ID (if exists)
}

/**
 * HomeClient Component
 * 
 * Handles all client-side interactivity while receiving
 * server-fetched data as props.
 */
export function HomeClient({
  initialPlayers,
  initialRounds,
  initialPlayerId,
}: HomeClientProps) {
  // ===========================================================================
  // CLIENT-SIDE STATE (Interactivity Only)
  // ===========================================================================
  
  /**
   * Selected Player State
   * Tracks which player is currently selected
   * Starts with first player (from server)
   */
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
    initialPlayerId
  )
  
  /**
   * View State
   * Tracks whether user is viewing profile or dashboard
   */
  const [viewingProfile, setViewingProfile] = useState(false)
  
  /**
   * Players State
   * Starts with server-fetched data, updates when new player added
   */
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  
  /**
   * Rounds State
   * Starts with server-fetched data, updates when player changes or round added
   */
  const [rounds, setRounds] = useState<Round[]>(initialRounds)

  // ===========================================================================
  // DATA REFETCHING (When Player Changes)
  // ===========================================================================
  
  /**
   * Fetch Rounds When Player Changes
   * 
   * CLIENT-SIDE FETCHING:
   * - Only needed when player selection changes
   * - Initial data came from server (fast)
   * - Subsequent changes need client-side fetch
   * 
   * NOTE: Could be optimized with Server Component per route
   * (app/dashboard/[playerId]/page.tsx) but current approach is simpler
   */
  useEffect(() => {
    if (!selectedPlayerId) {
      setRounds([])
      return
    }

    // Only fetch if we don't already have rounds for this player
    // (Optimization: avoid refetch if we already have the data)
    const fetchRounds = async () => {
      try {
        const res = await fetch(`/api/rounds?player_id=${selectedPlayerId}`)
        const data = await res.json()
        setRounds(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error fetching rounds:", err)
        setRounds([])
      }
    }

    fetchRounds()
  }, [selectedPlayerId])

  // ===========================================================================
  // EVENT HANDLERS (Using Server Actions)
  // ===========================================================================
  
  /**
   * Handle Add Player
   * 
   * SERVER ACTION BENEFITS:
   * - ✅ No fetch() call needed
   * - ✅ Type-safe (TypeScript inference)
   * - ✅ Automatic cache revalidation
   * - ✅ Better error handling
   */
  const handleAddPlayer = async (player: {
    name: string
    favorite_course: string
  }) => {
    // Create FormData for Server Action
    const formData = new FormData()
    formData.append("name", player.name)
    formData.append("favorite_course", player.favorite_course || "")

    // Call Server Action (runs on server)
    const result = await addPlayerAction(formData)

    if (result.success && result.data) {
      // Update local state
      setPlayers((prev) => [...prev, result.data!])
      setSelectedPlayerId(result.data.id)
      // Note: Server Action already revalidated cache, but we update
      // local state immediately for better UX
    }

    return result
  }

  /**
   * Handle Add Round
   * 
   * SERVER ACTION BENEFITS:
   * - ✅ Runs on server (secure, fast)
   * - ✅ Automatic cache revalidation
   * - ✅ No manual refresh needed
   */
  const handleAddRound = async (round: {
    player_id: string
    date: string
    course: string
    tee: string
    rating: number
    slope: number
    score: number
  }) => {
    // Create FormData for Server Action
    const formData = new FormData()
    formData.append("player_id", round.player_id)
    formData.append("date", round.date)
    formData.append("course", round.course)
    formData.append("tee", round.tee)
    formData.append("rating", round.rating.toString())
    formData.append("slope", round.slope.toString())
    formData.append("score", round.score.toString())

    // Call Server Action (runs on server)
    const result = await addRoundAction(formData)

    if (result.success) {
      // Refetch rounds to show new round
      // Server Action revalidated cache, but we refetch for immediate update
      const res = await fetch(`/api/rounds?player_id=${round.player_id}`)
      const data = await res.json()
      setRounds(Array.isArray(data) ? data : [])
    }

    return result
  }

  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================
  
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId)

  // ===========================================================================
  // RENDER
  // ===========================================================================
  
  // Show profile view if viewing profile and player is selected
  if (viewingProfile && selectedPlayer) {
    return (
      <Profile
        player={selectedPlayer}
        rounds={rounds}
        onBack={() => setViewingProfile(false)}
      />
    )
  }

  // Show dashboard view
  return (
    <Dashboard
      players={players}
      selectedPlayerId={selectedPlayerId}
      rounds={rounds}
      onPlayerChange={setSelectedPlayerId}
      onViewProfile={() => setViewingProfile(true)}
      onAddPlayer={handleAddPlayer}
      onAddRound={handleAddRound}
    />
  )
}

