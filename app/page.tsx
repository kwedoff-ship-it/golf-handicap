"use client"

import { useState, useEffect } from "react"
import { usePlayers } from "@/hooks/usePlayers"
import { useRounds } from "@/hooks/useRounds"
import { Dashboard } from "@/components/Dashboard"
import { Profile } from "@/components/Profile"

export default function Home() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [viewingProfile, setViewingProfile] = useState(false)

  const { players, addPlayer } = usePlayers()
  const { rounds, addRound } = useRounds(selectedPlayerId)

  // Auto-select first player when players are loaded
  useEffect(() => {
    if (players.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(players[0].id)
    }
  }, [players, selectedPlayerId])

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId)

  const handleAddPlayer = async (player: {
    name: string
    favorite_course: string
  }) => {
    const result = await addPlayer(player)
    if (result.success && result.data) {
      setSelectedPlayerId(result.data.id)
    }
    return result
  }

  const handleAddRound = async (round: {
    player_id: string
    date: string
    course: string
    tee: string
    rating: number
    slope: number
    score: number
  }) => {
    return await addRound(round)
  }

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
