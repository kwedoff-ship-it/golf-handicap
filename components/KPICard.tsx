/**
 * =============================================================================
 * KPI CARD COMPONENT
 * =============================================================================
 * 
 * A reusable card component for displaying Key Performance Indicators (KPIs).
 * Used throughout the app to show metrics like handicap, rounds played, etc.
 * 
 * FEATURES:
 * - Displays a label, large value, and optional subtitle
 * - Consistent styling across all KPI displays
 * - Emerald gradient background for visual emphasis
 * - Centered text layout
 * 
 * REACT PATTERNS:
 * - Simple presentational component (no state, no side effects)
 * - Props-based configuration
 * - Conditional rendering for optional subtitle
 * 
 * TAILWIND STYLING:
 * - Gradient background (emerald-600 to emerald-700)
 * - Large text for value (text-6xl)
 * - Responsive design
 * - Shadow and border effects
 * 
 * =============================================================================
 * NEXT.JS RENDERING STRATEGY
 * =============================================================================
 * 
 * CURRENT: No "use client" directive = Server Component (by default)
 * - This component can be rendered on the server
 * - No client-side JavaScript needed
 * - Can be used in both Server and Client Components
 * 
 * WHY IT WORKS AS SERVER COMPONENT:
 * - ✅ No useState, useEffect, or event handlers
 * - ✅ No browser APIs
 * - ✅ Pure presentational component
 * - ✅ Just receives props and renders
 * 
 * PERFORMANCE BENEFITS:
 * - ✅ Rendered on server (faster initial load)
 * - ✅ No JavaScript bundle overhead
 * - ✅ Can be streamed independently
 * - ✅ Works without JavaScript enabled
 * 
 * NOTE:
 * - Currently used inside Client Components (Dashboard, Profile)
 * - When parent is Client Component, this still works but loses server benefits
 * - In future refactor, if parent becomes Server Component, this will gain benefits
 */

import type React from "react"

/**
 * Props Interface
 * 
 * @property label - The label text displayed above the value (e.g., "Current Handicap Index")
 * @property value - The main value to display (can be string or number)
 * @property subtitle - Optional subtitle text displayed below the value
 */
interface KPICardProps {
  label: string
  value: string | number
  subtitle?: string // Optional prop (indicated by ?)
}

/**
 * KPICard Component
 * 
 * A presentational component that displays a metric in a styled card.
 * No internal state or logic - just displays what it's given.
 * 
 * USAGE EXAMPLE:
 * <KPICard 
 *   label="Current Handicap Index" 
 *   value={12.5} 
 *   subtitle="Based on 20 rounds" 
 * />
 */
export function KPICard({ label, value, subtitle }: KPICardProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 shadow-xl border border-emerald-500/20 flex flex-col justify-center">
      {/* 
        Container div with:
        - Gradient background (emerald-600 to emerald-700)
        - Rounded corners (rounded-xl)
        - Padding (p-6)
        - Shadow effect (shadow-xl)
        - Border with transparency (border-emerald-500/20)
        - Flexbox layout (flex flex-col justify-center)
      */}
      <div className="text-center">
        {/* Label Text */}
        <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide mb-2">
          {/* 
            Styling:
            - Light emerald text (text-emerald-100)
            - Small text (text-sm)
            - Medium font weight
            - Uppercase letters
            - Wide letter spacing (tracking-wide)
            - Margin bottom (mb-2)
          */}
          {label}
        </p>
        
        {/* Main Value */}
        <p className="text-6xl font-bold text-white mb-1">
          {/* 
            Styling:
            - Very large text (text-6xl = 3.75rem)
            - Bold font weight
            - White text
            - Small margin bottom (mb-1)
          */}
          {value}
        </p>
        
        {/* Optional Subtitle */}
        {subtitle && (
          // Conditional rendering: Only render if subtitle exists
          <p className="text-emerald-100 text-sm">
            {/* 
              Styling:
              - Light emerald text
              - Small text size
            */}
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
