// Custom hook to manage player data
// Handles fetching all players and adding new ones
import { useState, useEffect } from "react"
import type { Player } from "@/lib/types"

export function usePlayers() {
  // Track all players in state
  const [players, setPlayers] = useState<Player[]>([])
  
  // Loading flag so I can show a spinner while fetching
  const [loading, setLoading] = useState(true)
  
  // Store error messages if something goes wrong
  const [error, setError] = useState<string | null>(null)

  // Fetch players when component mounts (empty array means run once)
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch("/api/players")
        
        // Need to check if response is actually JSON, not an error page
        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text()
          console.error("API returned non-JSON response:", text)
          setError("Invalid response from server")
          setPlayers([])
          return
        }

        const data = await res.json()

        // Check if API sent back an error
        if (data.error) {
          console.error("API error:", data.error)
          setError(data.error)
          setPlayers([])
          return
        }

        // Make sure we got an array back
        if (Array.isArray(data)) {
          setPlayers(data)
        } else {
          console.error("Players data is not an array:", data)
          setError("Invalid data format")
          setPlayers([])
        }
      } catch (err) {
        console.error("Error fetching players:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch players")
        setPlayers([])
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [])

  // Function to add a new player
  // Note: Omit<Player, "id"> means the Player type without the id field since DB generates that
  const addPlayer = async (player: Omit<Player, "id">) => {
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(player),
      })

      const data = await res.json()

      if (res.ok) {
        // Add the new player to my existing list
        // Using prev => [...prev, data] ensures I have the latest state
        setPlayers((prev) => [...prev, data])
        
        return { success: true, data }
      } else {
        const error = data.error || "Failed to add player"
        console.error(error)
        return { success: false, error }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to add player"
      console.error(error)
      return { success: false, error }
    }
  }

  return { players, loading, error, addPlayer }
}
