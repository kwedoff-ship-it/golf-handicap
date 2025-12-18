/**
 * =============================================================================
 * ADD PLAYER FORM COMPONENT
 * =============================================================================
 * 
 * A collapsible form component for adding new players to the system.
 * 
 * FEATURES:
 * - Collapsible/expandable form (starts collapsed)
 * - Form validation (required fields)
 * - Loading state during submission
 * - Auto-reset form on success
 * - Auto-collapse form on success
 * 
 * REACT PATTERNS:
 * - Uses useState for local form state
 * - Controlled inputs (value + onChange)
 * - Form submission with preventDefault
 * - Conditional rendering for expanded/collapsed state
 * 
 * TAILWIND STYLING:
 * - Dark theme with slate colors
 * - Emerald accent colors for buttons
 * - Smooth transitions
 * 
 * =============================================================================
 * NEXT.JS RENDERING STRATEGY
 * =============================================================================
 * 
 * CURRENT: Client Component ("use client" directive)
 * - Requires client-side rendering for form interactivity
 * - Uses useState for form state and UI state (expanded/collapsed)
 * - Handles form submission with event handlers
 * 
 * WHY CLIENT COMPONENT:
 * - ✅ Needs useState for form state management
 * - ✅ Needs onClick handlers for expand/collapse
 * - ✅ Needs onSubmit handler for form submission
 * - ✅ Needs controlled inputs (value + onChange)
 * 
 * THIS IS CORRECT:
 * - Forms with interactivity must be Client Components
 * - Cannot be converted to Server Component
 * 
 * POTENTIAL IMPROVEMENTS:
 * - Replace onAddPlayer callback with Server Action
 *   * Server Actions can be called directly from Client Components
 *   * No need for API route (/api/players)
 *   * Better type safety and error handling
 *   * Automatic revalidation
 * 
 * FUTURE REFACTOR IDEA:
 * - Create server action: app/actions/players.ts
 * - export async function addPlayer(formData: FormData)
 * - Call from this component: await addPlayer(formData)
 * - Benefits: Simpler, type-safe, no API route needed
 */

"use client" // Next.js directive: Client Component (needs hooks, state, event handlers)

import type React from "react"
import { useState } from "react" // React hook for component state
import { ChevronDown, ChevronUp } from "lucide-react" // Icon components

/**
 * Props Interface
 * Defines what data this component expects from its parent
 * 
 * @property onAddPlayer - Callback function that handles adding a player
 *                         Returns a Promise with success/error result
 */
interface AddPlayerFormProps {
  onAddPlayer: (player: { name: string; favorite_course: string }) => Promise<{
    success: boolean
    error?: string
  }>
}

/**
 * AddPlayerForm Component
 * 
 * Self-contained form component that manages its own state
 * Communicates with parent via callback prop
 */
export function AddPlayerForm({ onAddPlayer }: AddPlayerFormProps) {
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  
  /**
   * Expanded State
   * Controls whether the form is visible or collapsed
   * false = collapsed (only header visible)
   * true = expanded (form fields visible)
   */
  const [isExpanded, setIsExpanded] = useState(false)
  
  /**
   * Form Data State
   * Stores the current values of form inputs
   * Reset to empty strings after successful submission
   */
  const [formData, setFormData] = useState({ name: "", favorite_course: "" })
  
  /**
   * Loading State
   * Prevents duplicate submissions and shows loading indicator
   * Set to true when form is submitting
   */
  const [loading, setLoading] = useState(false)

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================
  
  /**
   * Handle Form Submit
   * 
   * PURPOSE:
   * - Prevent default form submission (page reload)
   * - Call parent's onAddPlayer callback
   * - Reset form and collapse on success
   * - Handle loading state
   * 
   * FLOW:
   * 1. Prevent page reload (e.preventDefault())
   * 2. Set loading to true
   * 3. Call onAddPlayer with form data
   * 4. If successful, reset form and collapse
   * 5. Always set loading to false
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent browser's default form submission (page reload)
    setLoading(true) // Show loading state

    // Call parent's callback function
    // This will make API call to add player
    const result = await onAddPlayer(formData)

    // If successful, clean up form
    if (result.success) {
      setFormData({ name: "", favorite_course: "" }) // Clear form inputs
      setIsExpanded(false) // Collapse form
    }

    setLoading(false) // Clear loading state
  }

  // ===========================================================================
  // RENDER
  // ===========================================================================
  
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl shadow-xl overflow-hidden">
      {/* 
        Collapsible Header Button
        Clicking toggles expanded/collapsed state
        Shows chevron icon indicating state
      */}
      <button
        onClick={() => setIsExpanded(!isExpanded)} // Toggle expanded state
        className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
      >
        <h2 className="text-xl font-semibold text-white">Add New Player</h2>
        {/* Conditional rendering: Show up chevron when expanded, down when collapsed */}
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {/* 
        Form Content
        Only rendered when isExpanded is true
        Uses conditional rendering pattern
      */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-slate-800 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Player Name Input Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Player Name
              </label>
              <input
                type="text"
                placeholder="Enter name"
                value={formData.name} // Controlled input: value comes from state
                onChange={(e) =>
                  // Update state when user types
                  // Spread operator keeps existing fields, updates only 'name'
                  setFormData({ ...formData, name: e.target.value })
                }
                required // HTML5 validation: field must be filled
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Favorite Course Input Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Favorite Course
              </label>
              <input
                type="text"
                placeholder="Enter course"
                value={formData.favorite_course} // Controlled input
                onChange={(e) =>
                  setFormData({ ...formData, favorite_course: e.target.value })
                }
                required // HTML5 validation
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Submit Button */}
            <button
              type="submit" // Triggers form's onSubmit handler
              disabled={loading} // Disable button while submitting
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50"
            >
              {/* Show different text based on loading state */}
              {loading ? "Adding..." : "Add Player"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
