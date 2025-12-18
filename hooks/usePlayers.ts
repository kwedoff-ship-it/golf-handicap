import { useState, useEffect } from "react"
import type { Player } from "@/lib/types"

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch("/api/players")
        const contentType = res.headers.get("content-type")

        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text()
          console.error("API returned non-JSON response:", text)
          setError("Invalid response from server")
          setPlayers([])
          return
        }

        const data = await res.json()

        if (data.error) {
          console.error("API error:", data.error)
          setError(data.error)
          setPlayers([])
          return
        }

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

  const addPlayer = async (player: Omit<Player, "id">) => {
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(player),
      })

      const data = await res.json()

      if (res.ok) {
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

