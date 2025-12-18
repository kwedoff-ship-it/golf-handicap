/**
 * =============================================================================
 * NEXT.JS RENDERING STRATEGY - CURRENT APPROACH
 * =============================================================================
 * 
 * CURRENT: Client Component (Full Client-Side Rendering)
 * - Uses "use client" directive = entire page is client-side
 * - All data fetching happens in browser via useEffect hooks
 * - All interactivity requires JavaScript to be enabled
 * - Initial page load shows empty state, then fetches data
 * 
 * WHY CLIENT COMPONENT:
 * - Requires useState for selectedPlayerId and viewingProfile
 * - Uses useEffect for side effects (auto-select first player)
 * - Needs event handlers (onClick, onChange)
 * - Dynamic view switching (Dashboard ↔ Profile)
 * 
 * PERFORMANCE IMPLICATIONS:
 * - ❌ No server-side rendering (slower initial load)
 * - ❌ JavaScript bundle must download before page is interactive
 * - ❌ Data fetching happens after page loads (waterfall)
 * - ❌ No SEO benefits (content not in initial HTML)
 * - ✅ Good for highly interactive apps
 * - ✅ Simpler mental model (all client-side)
 * 
 * =============================================================================
 * POTENTIAL IMPROVEMENTS (Future Refactoring)
 * =============================================================================
 * 
 * OPTION 1: Hybrid Approach (Recommended)
 * - Convert to Server Component for initial data fetching
 * - Fetch players and initial rounds on server
 * - Pass data as props to client components
 * - Keep interactivity in client components
 * 
 * Benefits:
 * - ✅ Faster initial load (data in HTML)
 * - ✅ Better SEO (content in initial HTML)
 * - ✅ Smaller JavaScript bundle
 * - ✅ Progressive enhancement
 * 
 * Implementation:
 * - Remove "use client" from this file
 * - Fetch players/rounds directly from Supabase in server component
 * - Create separate client components for interactive parts
 * - Use Server Actions for mutations (addPlayer, addRound)
 * 
 * OPTION 2: Server Actions
 * - Replace API routes with Server Actions
 * - Server Actions can be called directly from client components
 * - No need for fetch() calls
 * - Better type safety and error handling
 * 
 * OPTION 3: Streaming with Suspense
 * - Use React Suspense boundaries
 * - Stream data as it becomes available
 * - Show loading states per section
 * - Better perceived performance
 * 
 * OPTION 4: Route Groups for Separate Views
 * - Use Next.js route groups: app/(dashboard)/page.tsx and app/(profile)/[id]/page.tsx
 * - Separate routes instead of conditional rendering
 * - Better URL structure (/profile/123)
 * - Enables better caching and prefetching
 * 
 * =============================================================================
 * WHEN TO REFACTOR
 * =============================================================================
 * 
 * Consider refactoring when:
 * - SEO becomes important (public-facing pages)
 * - Initial load performance is critical
 * - You want to reduce JavaScript bundle size
 * - You need better caching strategies
 * - You want to leverage Next.js 13+ features fully
 * 
 * Current approach is fine for:
 * - Internal/admin tools
 * - Highly interactive dashboards
 * - Apps where SEO isn't critical
 * - Rapid prototyping
 */

"use client" // Next.js directive: This entire page is a Client Component

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
