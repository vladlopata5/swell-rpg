import React, { useState, useEffect } from 'react'
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'

export default function MasterPanel({ roomId }) {
  const [trackers, setTrackers] = useState([])
  const [newTracker, setNewTracker] = useState({ name: '', max: 10, hidden: false })

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'rooms', roomId), (doc) => {
      if (doc.exists()) setTrackers(doc.data().sceneTrackers || [])
    })
    return () => unsub()
  }, [roomId])

  const addTracker = async () => {
    if (!newTracker.name) return
    const updated = [...trackers, { ...newTracker, value: 0, id: Date.now() }]
    await updateDoc(doc(db, 'rooms', roomId), { sceneTrackers: updated })
    setNewTracker({ name: '', max: 10, hidden: false })
  }

  const updateTracker = async (id, newValue) => {
    const updated = trackers.map(t => t.id === id ? { ...t, value: Math.min(Math.max(newValue, 0), t.max) } : t)
    await updateDoc(doc(db, 'rooms', roomId), { sceneTrackers: updated })
  }

  const deleteTracker = async (id) => {
    const updated = trackers.filter(t => t.id !== id)
    await updateDoc(doc(db, 'rooms', roomId), { sceneTrackers: updated })
  }

  return (
    <div className="bg-gray-800/80 backdrop-blur p-4 rounded-2xl border border-purple-500/20 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-3">🎯 Трекеры сцены</h3>
      
      <div className="space-y-2 mb-4">
        {trackers.map(t => (
          <div key={t.id} className="bg-gray-700 p-2 rounded">
            <div className="flex justify-between">
              <span className={t.hidden ? 'text-gray-400' : 'text-white'}>
                {t.hidden ? '🔒' : ''} {t.name}
              </span>
              <button onClick={() => deleteTracker(t.id)} className="text-red-400 hover:text-red-300">✕</button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min="0"
                max={t.max}
                value={t.value}
                onChange={(e) => updateTracker(t.id, +e.target.value)}
                className="w-full"
              />
              <span className="text-sm">{t.value}/{t.max}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <input
          value={newTracker.name}
          onChange={(e) => setNewTracker({ ...newTracker, name: e.target.value })}
          placeholder="Название трекера"
          className="w-full px-3 py-1 bg-gray-700 rounded text-white"
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={newTracker.max}
            onChange={(e) => setNewTracker({ ...newTracker, max: +e.target.value })}
            className="w-20 px-2 py-1 bg-gray-700 rounded text-white"
          />
          <label className="text-sm text-gray-300 flex items-center">
            <input
              type="checkbox"
              checked={newTracker.hidden}
              onChange={(e) => setNewTracker({ ...newTracker, hidden: e.target.checked })}
              className="mr-1"
            /> Скрытый
          </label>
          <button onClick={addTracker} className="px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white">+</button>
        </div>
      </div>
    </div>
  )
}