import React, { useState } from 'react'
import { clearPlayersFromAllRooms, deleteAllRoomsWithCharacters } from '../utils/roomCleanup'

export default function DebugPanel({ user }) {
  const [confirmation, setConfirmation] = useState('')
  const [isWorking, setIsWorking] = useState(false)
  const adminEmail = import.meta.env.VITE_DEBUG_ADMIN_EMAIL

  if (!adminEmail || user?.email !== adminEmail) return null

  const runAction = async (label, action) => {
    if (confirmation !== 'УДАЛИТЬ ВСЁ') {
      alert('Введите фразу «УДАЛИТЬ ВСЁ» для подтверждения')
      return
    }
    if (!window.confirm(label + '? Это действие нельзя отменить.')) return

    setIsWorking(true)
    try {
      await action()
      alert('Готово')
      setConfirmation('')
    } catch (error) {
      console.error(error)
      alert('Не удалось выполнить действие. Проверьте правила Firestore.')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-red-500/50 bg-red-950/40 p-4">
      <h2 className="text-lg font-bold text-red-200">⚠ Служебные действия</h2>
      <p className="mt-1 text-sm text-red-100/80">Только для отладки. Firebase Auth-аккаунты эти кнопки не удаляют.</p>
      <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Введите: УДАЛИТЬ ВСЁ" className="mt-3 w-full rounded bg-gray-800 px-3 py-2 text-white" disabled={isWorking} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => runAction('Удалить все комнаты и листы персонажей', deleteAllRoomsWithCharacters)} disabled={isWorking} className="rounded bg-red-700 px-3 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50">Удалить все комнаты и персонажей</button>
        <button onClick={() => runAction('Удалить всех игроков из всех комнат', clearPlayersFromAllRooms)} disabled={isWorking} className="rounded bg-red-800 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">Очистить игроков из комнат</button>
      </div>
    </div>
  )
}
