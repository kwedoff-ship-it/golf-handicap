"use client"

import type React from "react"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface AddPlayerFormProps {
  onAddPlayer: (player: { name: string; favorite_course: string }) => Promise<{
    success: boolean
    error?: string
  }>
}

export function AddPlayerForm({ onAddPlayer }: AddPlayerFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [formData, setFormData] = useState({ name: "", favorite_course: "" })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await onAddPlayer(formData)

    if (result.success) {
      setFormData({ name: "", favorite_course: "" })
      setIsExpanded(false)
    }

    setLoading(false)
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl shadow-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
      >
        <h2 className="text-xl font-semibold text-white">Add New Player</h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-slate-800 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Player Name
              </label>
              <input
                type="text"
                placeholder="Enter name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Favorite Course
              </label>
              <input
                type="text"
                placeholder="Enter course"
                value={formData.favorite_course}
                onChange={(e) =>
                  setFormData({ ...formData, favorite_course: e.target.value })
                }
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50"
            >
              {loading ? "Adding..." : "Add Player"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

