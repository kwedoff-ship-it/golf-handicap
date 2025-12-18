/**
 * =============================================================================
 * HANDICAP CHART COMPONENT
 * =============================================================================
 * 
 * A line chart component that visualizes handicap progression over time.
 * Uses the Recharts library for rendering.
 * 
 * FEATURES:
 * - Line chart showing handicap trend over last 6 months
 * - Responsive container (adapts to parent width)
 * - Custom styling to match app theme
 * - Empty state when insufficient data
 * - Interactive tooltips on hover
 * - Custom date formatting on axes
 * 
 * LIBRARY:
 * - Uses Recharts (React charting library)
 * - ResponsiveContainer: Automatically sizes chart to container
 * - LineChart: Main chart component
 * - XAxis, YAxis: Chart axes
 * - Tooltip: Hover information
 * - Line: The actual line showing handicap values
 * 
 * REACT PATTERNS:
 * - Presentational component (receives data via props)
 * - Conditional rendering for empty state
 * - Props-based configuration
 * 
 * TAILWIND STYLING:
 * - Dark theme colors
 * - Custom tooltip styling
 * 
 * =============================================================================
 * NEXT.JS RENDERING STRATEGY
 * =============================================================================
 * 
 * CURRENT: Client Component ("use client" directive)
 * - Requires client-side rendering for chart interactivity
 * - Uses Recharts library (requires browser APIs)
 * - Interactive tooltips and hover effects
 * 
 * WHY CLIENT COMPONENT:
 * - ✅ Recharts library requires browser DOM APIs
 * - ✅ Interactive tooltips on hover
 * - ✅ Chart rendering happens in browser
 * - ✅ Cannot run on server
 * 
 * THIS IS CORRECT:
 * - Chart libraries (Recharts, Chart.js, etc.) must be Client Components
 * - Cannot be converted to Server Component
 * - Interactive visualizations require browser APIs
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Chart library adds to JavaScript bundle size
 * - Consider code-splitting if bundle size becomes issue
 * - Could lazy load chart component
 * 
 * FUTURE OPTIMIZATION:
 * - Lazy load: const HandicapChart = dynamic(() => import('./HandicapChart'))
 * - Only load chart library when needed
 * - Reduces initial bundle size
 * - Benefits: Faster initial load, smaller bundle
 */

"use client" // Next.js directive: Client Component (Recharts requires browser APIs)

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts" // Chart library components
import type { HandicapHistory } from "@/lib/types"

/**
 * Props Interface
 * 
 * @property data - Array of handicap history points
 *                  Each point has: date, handicap, rounds
 */
interface HandicapChartProps {
  data: HandicapHistory[]
}

/**
 * HandicapChart Component
 * 
 * Renders a line chart showing handicap progression
 */
export function HandicapChart({ data }: HandicapChartProps) {
  // ===========================================================================
  // EMPTY STATE
  // ===========================================================================
  
  /**
   * Empty State Check
   * If no data, show message instead of empty chart
   */
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-500">
        {/* 
          Empty State:
          - Fixed height to match chart height
          - Centered text
          - Informative message
        */}
        Need at least 3 rounds to display handicap trend
      </div>
    )
  }

  // ===========================================================================
  // CHART RENDER
  // ===========================================================================
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      {/* 
        ResponsiveContainer:
        - Automatically adjusts to parent width
        - Maintains aspect ratio
        - Fixed height of 300px
      */}
      <LineChart data={data}>
        {/* 
          LineChart:
          - Main chart component
          - data prop: Array of data points to chart
        */}
        
        {/* Grid Lines */}
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        {/* 
          CartesianGrid:
          - Background grid lines
          - strokeDasharray="3 3": Dashed lines (3px dash, 3px gap)
          - stroke="#334155": Slate color matching theme
        */}
        
        {/* X-Axis (Dates) */}
        <XAxis
          dataKey="date" // Which property from data to use for X-axis
          stroke="#94a3b8" // Axis line color
          tick={{ fill: "#94a3b8" }} // Tick label color
          tickFormatter={(date) =>
            // Custom formatter: Convert date string to readable format
            new Date(date).toLocaleDateString("en-US", {
              month: "short", // "Jan", "Feb", etc.
              day: "numeric", // "1", "2", etc.
            })
          }
        />
        
        {/* Y-Axis (Handicap Values) */}
        <YAxis 
          stroke="#94a3b8" 
          tick={{ fill: "#94a3b8" }} 
          domain={["dataMin - 2", "dataMax + 2"]} 
          // 
          // Domain:
          // - "dataMin - 2": Start 2 units below lowest value
          // - "dataMax + 2": End 2 units above highest value
          // - Adds padding so line doesn't touch edges
        />
        
        {/* Tooltip (Hover Information) */}
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b", // Dark background
            border: "1px solid #334155", // Border color
            borderRadius: "8px", // Rounded corners
            color: "#fff", // White text
          }}
          labelFormatter={(date) =>
            // Custom label formatter: Full date format for tooltip
            new Date(date).toLocaleDateString("en-US", {
              month: "long", // "January", "February", etc.
              day: "numeric",
              year: "numeric",
            })
          }
        />
        
        {/* The Actual Line */}
        <Line
          type="monotone" // Smooth curve interpolation
          dataKey="handicap" // Which property from data to plot
          stroke="#10b981" // Emerald green color
          strokeWidth={3} // Line thickness
          dot={{ fill: "#10b981", r: 4 }} // Data point dots
          activeDot={{ r: 6 }} // Larger dot when hovering
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
