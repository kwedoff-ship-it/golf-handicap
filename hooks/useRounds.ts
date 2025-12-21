// Custom hook to manage rounds data for a specific player
// Re-fetches whenever the selected player changes
import { useState, useEffect } from "react"
import type { Round } from "@/lib/types"

export function useRounds(playerId: string | null) {
  // Store rounds for the selected player
  const [rounds, setRounds] = useState<Round[]>([])
  
  // Loading state for showing spinner
  const [loading, setLoading] = useState(false)
  
  // Error messages if fetch fails
  const [error, setError] = useState<string | null>(null)

  // Fetch rounds whenever playerId changes
  useEffect(() => {
    // Don't fetch if no player is selected
    if (!playerId) {
      setRounds([])
      return
    }

    const fetchRounds = async () => {
      try {
        setLoading(true)
        setError(null)

        // Query parameter tells API which player's rounds to get
        const res = await fetch(`/api/rounds?player_id=${playerId}`)

        // Make sure response is JSON
        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Rounds API returned non-JSON response")
          setError("Invalid response from server")
          setRounds([])
          return
        }

        const data = await res.json()

        // Check for API errors
        if (data.error) {
          console.error("API error fetching rounds:", data.error)
          setError(data.error)
          setRounds([])
          return
        }

        // Set rounds or empty array if none exist
        setRounds(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error fetching rounds:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch rounds")
        setRounds([])
      } finally {
        setLoading(false)
      }
    }

    fetchRounds()
  }, [playerId])

  // Function to add a new round
  const addRound = async (round: Omit<Round, "id">) => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(round),
      })

      const data = await res.json()

      if (res.ok) {
        // Re-fetch all rounds to make sure everything is in sync
        const roundsRes = await fetch(`/api/rounds?player_id=${playerId}`)
        const roundsData = await roundsRes.json()
        setRounds(Array.isArray(roundsData) ? roundsData : [])
        
        return { success: true, data }
      } else {
        const error = data.error || "Failed to add round"
        console.error(error)
        setError(error)
        return { success: false, error }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to add round"
      console.error(error)
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  return { rounds, loading, error, addRound }
}
