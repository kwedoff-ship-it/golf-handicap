"use client"
// testing feature/player-list-ui deployment

import { useState, useEffect } from "react"
import { supabaseServer } from "@/lib/supabaseServer"

type Round = {
  id: string
  player_name: string
  date: string
  course: string
  tee: string
  rating: number
  slope: number
  score: number
}

export default function Home() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [form, setForm] = useState({
    player_name: "",
    date: "",
    course: "",
    tee: "",
    rating: "",
    slope: "",
    score: "",
  })
  const [loading, setLoading] = useState(false)

  const fetchRounds = async () => {
    try {
      const res = await fetch("/api/rounds")
      const data = await res.json()
      setRounds(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchRounds()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rating: parseFloat(form.rating),
          slope: parseInt(form.slope),
          score: parseInt(form.score),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setForm({
          player_name: "",
          date: "",
          course: "",
          tee: "",
          rating: "",
          slope: "",
          score: "",
        })
        fetchRounds()
      } else {
        console.error(data.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "border rounded px-3 py-2 w-full text-black placeholder-black"

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">⛳ Golf Handicap Tracker</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4"
      >
        <input
          type="text"
          name="player_name"
          placeholder="Player"
          value={form.player_name}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          type="date"
          name="date"
          placeholder="Date"
          value={form.date}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          type="text"
          name="course"
          placeholder="Course"
          value={form.course}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          type="text"
          name="tee"
          placeholder="Tee"
          value={form.tee}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          type="number"
          step="0.1"
          name="rating"
          placeholder="Rating"
          value={form.rating}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          type="number"
          name="slope"
          placeholder="Slope"
          value={form.slope}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          type="number"
          name="score"
          placeholder="Score"
          value={form.score}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 col-span-1 sm:col-span-4"
        >
          {loading ? "Saving..." : "Add Round"}
        </button>
      </form>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-200">
            {["Player", "Date", "Course", "Tee", "Rating", "Slope", "Score"].map(
              (h) => (
                <th
                  key={h}
                  className={`border px-4 py-2 ${
                    ["Player", "Date", "Course"].includes(h)
                      ? "text-red-600"
                      : "text-black"
                  }`}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rounds.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{r.player_name}</td>
              <td className="border px-4 py-2">{r.date}</td>
              <td className="border px-4 py-2">{r.course}</td>
              <td className="border px-4 py-2">{r.tee}</td>
              <td className="border px-4 py-2">{r.rating}</td>
              <td className="border px-4 py-2">{r.slope}</td>
              <td className="border px-4 py-2">{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
