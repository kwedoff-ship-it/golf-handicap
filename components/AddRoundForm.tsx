/**
 * =============================================================================
 * ADD ROUND FORM COMPONENT
 * =============================================================================
 * 
 * A collapsible form component for recording new golf rounds.
 * 
 * FEATURES:
 * - Collapsible/expandable form (starts collapsed)
 * - Multi-field form with date, course, tee, rating, slope, score
 * - Type conversion (strings to numbers for rating, slope, score)
 * - Form validation (required fields, numeric validation)
 * - Loading state during submission
 * - Auto-reset form on success
 * - Auto-collapse form on success
 * - Disabled when no player is selected
 * 
 * REACT PATTERNS:
 * - Uses useState for local form state
 * - Controlled inputs (value + onChange)
 * - Form submission with preventDefault
 * - Conditional rendering for expanded/collapsed state
 * - Type conversion on submit
 * 
 * TAILWIND STYLING:
 * - Dark theme with slate colors
 * - Emerald accent colors for buttons
 * - Responsive grid layout (adapts to screen size)
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
 * - ✅ Needs type conversion (string to number)
 * 
 * THIS IS CORRECT:
 * - Forms with interactivity must be Client Components
 * - Cannot be converted to Server Component
 * 
 * POTENTIAL IMPROVEMENTS:
 * - Replace onAddRound callback with Server Action
 *   * Server Actions can be called directly from Client Components
 *   * No need for API route (/api/rounds)
 *   * Better type safety and error handling
 *   * Automatic revalidation after mutation
 * 
 * FUTURE REFACTOR IDEA:
 * - Create server action: app/actions/rounds.ts
 * - export async function addRound(formData: FormData)
 * - Call from this component: await addRound(formData)
 * - Benefits: Simpler, type-safe, no API route needed
 */

"use client" // Next.js directive: Client Component (needs hooks, state, event handlers)

import type React from "react"
import { useState } from "react" // React hook for component state
import { ChevronDown, ChevronUp } from "lucide-react" // Icon components

/**
 * Props Interface
 * 
 * @property onAddRound - Callback function that handles adding a round
 *                        Returns a Promise with success/error result
 * @property playerId - Currently selected player ID (null if none selected)
 *                      Form is disabled if this is null
 */
interface AddRoundFormProps {
  onAddRound: (round: {
    player_id: string
    date: string
    course: string
    tee: string
    rating: number
    slope: number
    score: number
  }) => Promise<{ success: boolean; error?: string }>
  playerId: string | null
}

/**
 * AddRoundForm Component
 * 
 * Self-contained form component for recording golf rounds
 * Manages its own state and communicates with parent via callback
 */
export function AddRoundForm({ onAddRound, playerId }: AddRoundFormProps) {
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  
  /**
   * Expanded State
   * Controls whether the form is visible or collapsed
   */
  const [isExpanded, setIsExpanded] = useState(false)
  
  /**
   * Form Data State
   * All fields stored as strings initially (HTML inputs return strings)
   * Converted to numbers (rating, slope, score) on submit
   */
  const [formData, setFormData] = useState({
    date: "",      // Date input value (YYYY-MM-DD format)
    course: "",    // Course name
    tee: "",       // Tee box (e.g., "Blue", "White")
    rating: "",    // Course rating (will be parsed to float)
    slope: "",     // Slope rating (will be parsed to int)
    score: "",     // Total score (will be parsed to int)
  })
  
  /**
   * Loading State
   * Prevents duplicate submissions
   */
  const [loading, setLoading] = useState(false)

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================
  
  /**
   * Handle Form Submit
   * 
   * PURPOSE:
   * - Prevent default form submission
   * - Validate player is selected
   * - Convert string inputs to numbers
   * - Call parent's onAddRound callback
   * - Reset form and collapse on success
   * 
   * TYPE CONVERSION:
   * - rating: string → float (allows decimals like 72.5)
   * - slope: string → integer (whole numbers only)
   * - score: string → integer (whole numbers only)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent page reload

    // Guard clause: require player selection
    if (!playerId) return

    setLoading(true) // Show loading state

    // Call parent's callback with converted data
    // Note: rating, slope, score are converted from strings to numbers
    const result = await onAddRound({
      player_id: playerId,
      date: formData.date,
      course: formData.course,
      tee: formData.tee,
      rating: Number.parseFloat(formData.rating),  // Convert to float (72.5)
      slope: Number.parseInt(formData.slope),       // Convert to int (130)
      score: Number.parseInt(formData.score),        // Convert to int (85)
    })

    // If successful, clean up form
    if (result.success) {
      setFormData({
        date: "",
        course: "",
        tee: "",
        rating: "",
        slope: "",
        score: "",
      })
      setIsExpanded(false) // Collapse form
    }

    setLoading(false) // Clear loading state
  }

  // ===========================================================================
  // RENDER
  // ===========================================================================
  
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl shadow-xl overflow-hidden">
      {/* Collapsible Header Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
      >
        <h2 className="text-xl font-semibold text-white">Record New Round</h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {/* Form Content - Only shown when expanded */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-slate-800 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 
              First Row: Date and Course Name
              Responsive grid: 1 column on mobile, 3 columns on larger screens
              Date takes 1 column, Course takes 2 columns
            */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date
                </label>
                <input
                  type="date" // HTML5 date picker
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Course Name Input (spans 2 columns on larger screens) */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Course Name
                </label>
                <input
                  type="text"
                  placeholder="Course name"
                  value={formData.course}
                  onChange={(e) =>
                    setFormData({ ...formData, course: e.target.value })
                  }
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* 
              Second Row: Tee, Rating, Slope, Score
              Responsive grid: 2 columns on mobile, 4 columns on larger screens
            */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Tee Box Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tee
                </label>
                <input
                  type="text"
                  placeholder="Blue"
                  value={formData.tee}
                  onChange={(e) =>
                    setFormData({ ...formData, tee: e.target.value })
                  }
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Course Rating Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rating
                </label>
                <input
                  type="number"
                  step="0.1" // Allow decimal values (e.g., 72.5)
                  placeholder="72.5"
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: e.target.value })
                  }
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Slope Rating Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Slope
                </label>
                <input
                  type="number"
                  placeholder="130"
                  value={formData.slope}
                  onChange={(e) =>
                    setFormData({ ...formData, slope: e.target.value })
                  }
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Score Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Score
                </label>
                <input
                  type="number"
                  placeholder="85"
                  value={formData.score}
                  onChange={(e) =>
                    setFormData({ ...formData, score: e.target.value })
                  }
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !playerId} // Disable if loading OR no player selected
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium px-4 py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50"
            >
              {loading ? "Saving Round..." : "Save Round"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
