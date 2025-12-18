/**
 * =============================================================================
 * PLAYER SELECTOR COMPONENT
 * =============================================================================
 * 
 * A component that allows users to select which player they want to view.
 * Displays a dropdown selector and shows selected player's information.
 * 
 * FEATURES:
 * - Dropdown select for choosing a player
 * - Displays selected player's home course
 * - "View Full Profile" button to navigate to profile view
 * - Handles case when no player is selected
 * 
 * REACT PATTERNS:
 * - Controlled select input (value + onChange)
 * - Conditional rendering for player info
 * - Callback props for parent communication
 * - Array.find() to locate selected player
 * 
 * TAILWIND STYLING:
 * - Dark theme card
 * - Styled select dropdown
 * - Hover effects on interactive elements
 */

"use client" // Next.js directive: Client Component

import type React from "react"
import { ChevronRight } from "lucide-react" // Icon component
import type { Player } from "@/lib/types" // TypeScript type import

/**
 * Props Interface
 * 
 * @property players - Array of all available players
 * @property selectedPlayerId - ID of currently selected player (null if none)
 * @property onPlayerChange - Callback when user selects a different player
 * @property onViewProfile - Callback when user clicks "View Full Profile" button
 */
interface PlayerSelectorProps {
  players: Player[]
  selectedPlayerId: string | null
  onPlayerChange: (playerId: string) => void
  onViewProfile: () => void
}

/**
 * PlayerSelector Component
 * 
 * Manages player selection UI and displays selected player info
 */
export function PlayerSelector({
  players,
  selectedPlayerId,
  onPlayerChange,
  onViewProfile,
}: PlayerSelectorProps) {
  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================
  
  /**
   * Selected Player Data
   * Finds the full player object for the currently selected player ID
   * Returns undefined if no player is selected or player not found
   */
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId)

  // ===========================================================================
  // RENDER
  // ===========================================================================
  
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col">
      {/* 
        Container Card:
        - Dark background with transparency
        - Backdrop blur effect
        - Border and shadow
        - Flexbox column layout
      */}
      
      <h2 className="text-xl font-semibold text-white mb-4">Select Player</h2>

      {/* 
        Player Dropdown Select
        Controlled component: value comes from props, onChange calls callback
      */}
      <select
        value={selectedPlayerId || ""} // Controlled: value from props (empty string if null)
        onChange={(e) => onPlayerChange(e.target.value)} // Call parent callback with new selection
        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-lg"
      >
        {/* 
          Map through players array to create option elements
          Each option displays player name, value is player ID
        */}
        {players.map((p) => (
          <option key={p.id} value={p.id} className="bg-slate-800">
            {/* 
              React key prop: Required for list items
              Helps React efficiently update the DOM
            */}
            {p.name}
          </option>
        ))}
      </select>

      {/* 
        Selected Player Info Section
        Only rendered if a player is selected
        Uses conditional rendering pattern
      */}
      {selectedPlayer && (
        <div className="mt-4 flex-1 flex flex-col justify-between">
          {/* Home Course Display */}
          <div className="text-sm text-slate-400">
            <span className="font-medium">Home Course:</span>{" "}
            {/* 
              Display favorite course or "Not set" if undefined
              Uses logical OR operator (||) for fallback
            */}
            {selectedPlayer.favorite_course || "Not set"}
          </div>
          
          {/* View Profile Button */}
          <button
            onClick={onViewProfile} // Call parent callback to navigate to profile
            className="mt-3 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
          >
            {/* 
              Button styling:
              - Emerald color with hover effect
              - Flex layout with gap for icon spacing
              - Smooth color transition
            */}
            View Full Profile
            <ChevronRight className="w-4 h-4" /> {/* Right arrow icon */}
          </button>
        </div>
      )}
    </div>
  )
}
