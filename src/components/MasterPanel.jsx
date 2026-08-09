import React, { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function MasterPanel({ roomId, onDeleteRoom }) {
  const [trackers, setTrackers] = useState([])
  const [newTracker, setNewTracker] = useState({ name: '', max: 10, hidden: false })

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'rooms', roomId), (roomSnap) => {
      if (roomSnap.exists()) setTrackers(roomSnap.data().sceneTrackers || [])
    })
    return () => unsub()
  }, [roomId])

  const saveTrackers = async (updatedTrackers) => {
    setTrackers(updatedTrackers)
    await updateDoc(doc(db, 'rooms', roomId), { sceneTrackers: updatedTrackers })
  }

  const addTracker = async () => {
    if (!newTracker.name.trim()) return
    await saveTrackers([...trackers, { ...newTracker, name: newTracker.name.trim(), value: 0, id: Date.now() }])
    setNewTracker({ name: '', max: 10, hidden: false })
  }

  const changeTrackerValue = (id, newValue) => {
    setTrackers(current => current.map(tracker => tracker.id === id ? { ...tracker, value: Math.min(Math.max(newValue, 0), tracker.max) } : tracker))
  }

  const persistTrackerValue = async (id, value) => {
    const updatedTrackers = trackers.map(tracker => tracker.id === id ? { ...tracker, value: Math.min(Math.max(value, 0), tracker.max) } : tracker)
    await saveTrackers(updatedTrackers)
  }

  const deleteTracker = async (id) => {
    const tracker = trackers.find(item => item.id === id)
    if (!tracker || !window.confirm(`Удалить трекер «${tracker.name}»?`)) return
    await saveTrackers(trackers.filter(item => item.id !== id))
  }

  return (
    <div className="bg-gray-800/80 backdrop-blur p-4 rounded-2xl border border-purple-500/20 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-3">🎯 Трекеры сцены</h3>
      <div className="space-y-2 mb-4">
        {trackers.map(tracker => (
          <div key={tracker.id} className="bg-gray-700 p-2 rounded">
            <div className="flex justify-between">
              <span className={tracker.hidden ? 'text-gray-400' : 'text-white'}>{tracker.hidden ? '🔒 ' : ''}{tracker.name}</span>
              <button onClick={() => deleteTracker(tracker.id)} className="text-red-400 hover:text-red-300" title="Удалить трекер">✕</button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min="0"
                max={tracker.max}
                value={tracker.value}
                onChange={(e) => changeTrackerValue(tracker.id, +e.target.value)}
                onPointerUp={(e) => persistTrackerValue(tracker.id, +e.currentTarget.value)}
                onBlur={(e) => persistTrackerValue(tracker.id, +e.currentTarget.value)}
                className="w-full"
              />
              <span className="text-sm">{tracker.value}/{tracker.max}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <input value={newTracker.name} onChange={(e) => setNewTracker({ ...newTracker, name: e.target.value })} placeholder="Название трекера" className="w-full px-3 py-1 bg-gray-700 rounded text-white" />
        <div className="flex gap-2">
          <input type="number" min="1" value={newTracker.max} onChange={(e) => setNewTracker({ ...newTracker, max: Math.max(1, +e.target.value) })} className="w-20 px-2 py-1 bg-gray-700 rounded text-white" />
          <label className="text-sm text-gray-300 flex items-center"><input type="checkbox" checked={newTracker.hidden} onChange={(e) => setNewTracker({ ...newTracker, hidden: e.target.checked })} className="mr-1" /> Скрытый</label>
          <button onClick={addTracker} className="px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white">+</button>
        </div>
      </div>
      <div className="mt-6 border-t border-red-500/30 pt-4">
        <button onClick={onDeleteRoom} className="w-full rounded bg-red-800 px-4 py-2 font-semibold text-white hover:bg-red-700">Удалить комнату навсегда</button>
      </div>
    </div>
  )
}
