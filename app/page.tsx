import { getPlayers } from "@/app/actions/players"
import { getRounds } from "@/app/actions/rounds"
import { HomeClient } from "@/components/HomeClient"
import { getFlag } from "@/lib/launchdarkly"
import type { Player, Round } from "@/lib/types"

// Server component - fetches initial data on the server
export default async function Home() {
  const players = await getPlayers()
  const initialPlayerId = players.length > 0 ? players[0].id : null
  const initialRounds: Round[] = initialPlayerId
    ? await getRounds(initialPlayerId)
    : []

  // 🚩 LaunchDarkly flag evaluation (server-side)
  const newCheckoutEnabled = await getFlag("new-checkout")

  return (
    <HomeClient
      initialPlayers={players}
      initialRounds={initialRounds}
      initialPlayerId={initialPlayerId}
      newCheckoutEnabled={newCheckoutEnabled}
    />
  )
}

