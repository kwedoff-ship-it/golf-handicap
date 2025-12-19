/**
 * =============================================================================
 * MAIN PAGE - SERVER COMPONENT
 * =============================================================================
 * 
 * SERVER-SIDE RENDERING (SSR) 
 */

// Done need to "use client" becauase this is a Server Component

import { getPlayers } from "@/app/actions/players"
import { getRounds } from "@/app/actions/rounds"
import { HomeClient } from "@/components/HomeClient"
import type { Player, Round } from "@/lib/types"

/**
 * Home Page Component (Server Component)
 * 
 * What this does:
 * Fetches players and rounds on the server
 * Passes data to client component for interactivity
 * Provides speedy initial load with data in HTML
 */
export default async function Home() {
  // ===========================================================================
  // SERVER-SIDE DATA FETCH/GET
  // ===========================================================================
  
  /**
   * Get Players (Server-Side)
   */
  const players = await getPlayers()

  /**
   * Determine Initial Player and pick first player if any exist
   */
  const initialPlayerId = players.length > 0 ? players[0].id : null

  /**
   * Get Rounds for Initial Player (Server-Side)
   */
  const initialRounds: Round[] = initialPlayerId
    ? await getRounds(initialPlayerId)
    : []

  // ===========================================================================
  // RENDER
  // ===========================================================================
  
  /**
   * Pass Server-Fetched Data to Client Component
   */
  return (
    <HomeClient
      initialPlayers={players}
      initialRounds={initialRounds}
      initialPlayerId={initialPlayerId}
    />
  )
}