import { useState, useEffect } from "react"
import type { Round } from "@/lib/types"

export function useRounds(playerId: string | null) {
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!playerId) {
      setRounds([])
      return
    }

    const fetchRounds = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/rounds?player_id=${playerId}`)
        const contentType = res.headers.get("content-type")

        if (!contentType || !contentType.includes("application/json")) {
          console.error("Rounds API returned non-JSON response")
          setError("Invalid response from server")
          setRounds([])
          return
        }

        const data = await res.json()

        if (data.error) {
          console.error("API error fetching rounds:", data.error)
          setError(data.error)
          setRounds([])
          return
        }

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
        // Refresh rounds list
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

