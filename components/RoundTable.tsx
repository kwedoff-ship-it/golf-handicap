/**
 * =============================================================================
 * ROUND TABLE COMPONENT
 * =============================================================================
 * 
 * A reusable table component for displaying golf rounds in a structured format.
 * 
 * [KW] Features:
 * - Displays rounds in a table with columns: Date, Course, Tee, Rating, Slope, Score
 * - Empty state message when no rounds exist
 * - Sticky header (stays visible when scrolling)
 * - Hover effects on rows
 * - Calculates differential for each round
 * 
 * [KW] React:
 * - Presentational component (receives data via props)
 * - Array.map() to render table rows
 * - Conditional rendering for optional columns
 * - Conditional rendering for empty state
 * 
 * [KW] Tailwind:
 * - Dark theme table
 * - Sticky header with backdrop blur
 * - Responsive overflow handling
 * - Hover states for interactivity
 * 

 */

"use client" // Next.js directive: Client Component (only because parent is client)

import type { Round } from "@/lib/types"
import { calculateDifferential } from "@/lib/handicap" // Utility function for calculating differential

/**
 * Props Interface
 * 
 * @property rounds - Array of round objects to display
 * @property showDifferential - If true, shows an additional "Diff" column
 * @property maxRows - Optional limit on number of rows to display (for "recent rounds")
 */
interface RoundTableProps {
  rounds: Round[]
  showDifferential?: boolean // Optional prop (defaults to false)
  maxRows?: number // Optional prop (no limit if not provided)
}

/**
 * RoundTable Component
 * 
 * Renders a table of golf rounds with optional features
 */
export function RoundTable({
  rounds,
  showDifferential = false, // Default value if prop not provided
  maxRows, // Optional, no default
}: RoundTableProps) {
  // ===========================================================================
  // DATA PREPARATION
  // ===========================================================================
  
  /**
   * Display Rounds
   * Limits the number of rounds displayed if maxRows is specified
   * Used for "Recent Rounds" on dashboard (shows last 10)
   */
  const displayRounds = maxRows ? rounds.slice(0, maxRows) : rounds
  // If maxRows provided, take first N rounds; otherwise show all

  // ===========================================================================
  // RENDER
  // ===========================================================================
  
  return (
    <div className="overflow-x-auto">
      {/* 
        Scrollable container:
        - overflow-x-auto: Horizontal scroll on small screens
      */}
      <table className="w-full">
        <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-sm z-10">
          {/* 
            Sticky Header:
            - sticky top-0: Stays at top when scrolling
            - backdrop-blur-sm: Blur effect for visual separation
            - z-10: Ensures header stays above table body
          */}
          <tr className="bg-slate-800/50">
            {/* Table Header Row */}
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
              Date
            </th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
              Course
            </th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
              Tee
            </th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
              Rating
            </th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
              Slope
            </th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
              Score
            </th>
            {/* 
              Conditional Column Header:
              Only show "Diff" column if showDifferential is true
            */}
            {showDifferential && (
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                Diff
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {/* 
            Table Body:
            - divide-y: Horizontal dividers between rows
            - divide-slate-800: Divider color
          */}
          
          {/* Empty State */}
          {displayRounds.length === 0 ? (
            <tr>
              <td
                colSpan={showDifferential ? 7 : 6} // Span all columns (6 or 7 depending on differential)
                className="px-6 py-12 text-center text-slate-500"
              >
                No rounds recorded yet
              </td>
            </tr>
          ) : (
            // Map through rounds to create table rows
            displayRounds.map((r) => {
              /**
               * Calculate Differential
               * Differential = (Score - Course Rating) × 113 / Slope Rating
               * Used to normalize scores across different courses
               */
              const diff = calculateDifferential(r)
              
              return (
                <tr 
                  key={r.id} // React key: Required for list items
                  className="hover:bg-slate-800/30 transition-colors"
                  // Hover effect: Background color change on hover
                >
                  {/* Date Cell */}
                  <td className="px-6 py-4 text-slate-200 font-medium">
                    {new Date(r.date).toLocaleDateString("en-US", {
                      month: "short", // "Jan", "Feb", etc.
                      day: "numeric", // "1", "2", etc.
                      year: showDifferential ? "numeric" : undefined, // Show year in profile view
                    })}
                  </td>
                  
                  {/* Course Cell */}
                  <td className="px-6 py-4 text-slate-200">{r.course}</td>
                  
                  {/* Tee Cell */}
                  <td className="px-6 py-4 text-slate-300">{r.tee}</td>
                  
                  {/* Rating Cell */}
                  <td className="px-6 py-4 text-slate-300">{r.rating}</td>
                  
                  {/* Slope Cell */}
                  <td className="px-6 py-4 text-slate-300">{r.slope}</td>
                  
                  {/* Score Cell - Styled with badge */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {/* 
                        Score Badge:
                        - Rounded pill shape
                        - Emerald color scheme
                        - Subtle background and border
                      */}
                      {r.score}
                    </span>
                  </td>
                  
                  {/* Differential Cell - Conditional */}
                  {showDifferential && (
                    <td className="px-6 py-4 text-slate-300">
                      {diff.toFixed(1)} {/* Format to 1 decimal place */}
                    </td>
                  )}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
