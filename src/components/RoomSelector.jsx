import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'

export default function RoomSelector() {
  const [rooms, setRooms] = useState([])
  const [newRoomName, setNewRoomName] = useState('')
  const [joinRoomId, setJoinRoomId] = useState('')
  const navigate = useNavigate()
  const user = auth.currentUser

  // Загружаем список комнат
  useEffect(() => {
    const fetchRooms = async () => {
      const snapshot = await getDocs(collection(db, 'rooms'))
      const roomsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setRooms(roomsList)
    }
    fetchRooms()
  }, [])

  // Создать новую комнату
  const createRoom = async () => {
    if (!newRoomName.trim() || !user) return
    const docRef = await addDoc(collection(db, 'rooms'), {
      name: newRoomName,
      creatorUid: user.uid,
      players: [{ uid: user.uid, email: user.email, role: 'master' }],
      sceneTrackers: [],
      bgImage: '',
      createdAt: new Date()
    })
    navigate(`/lobby/${docRef.id}`)
  }

  // Присоединиться по ID
  const joinRoom = async () => {
    if (!joinRoomId.trim() || !user) return
    // Проверяем, существует ли комната
    const roomRef = doc(db, 'rooms', joinRoomId)
    const roomSnap = await getDoc(roomRef)
    if (!roomSnap.exists()) {
      alert('Комната не найдена')
      return
    }
    // Добавляем игрока в players (если ещё не добавлен)
    const roomData = roomSnap.data()
    const players = roomData.players || []
    const alreadyIn = players.some(p => p.uid === user.uid)
    if (!alreadyIn) {
      // Обновим позже, пока просто переходим
    }
    navigate(`/lobby/${joinRoomId}`)
  }

  // Получить имя пользователя (до @)
  const getUserName = (email) => email ? email.split('@')[0] : 'Аноним'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-purple-500/20">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-4xl font-bold text-purple-400">🏰 Выбор комнаты</h1>
          <div className="text-gray-300 text-sm bg-gray-700 px-3 py-1 rounded-full">
            {user ? getUserName(user.email) : 'Гость'}
          </div>
        </div>
        <p className="text-center text-gray-400 mb-6">Создайте новую или присоединитесь к существующей</p>

        {/* Создание комнаты */}
        <div className="mb-6 p-4 bg-gray-700/50 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">Создать новую комнату</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Название комнаты"
              className="flex-1 px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={createRoom}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition"
            >
              Создать
            </button>
          </div>
        </div>

        {/* Присоединение по ID */}
        <div className="mb-6 p-4 bg-gray-700/50 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">Присоединиться по ID</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="Введите ID комнаты"
              className="flex-1 px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={joinRoom}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition"
            >
              Присоединиться
            </button>
          </div>
        </div>

        {/* Список существующих комнат */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Существующие комнаты</h3>
          {rooms.length === 0 ? (
            <p className="text-gray-400 text-center">Нет комнат. Создайте первую!</p>
          ) : (
            <ul className="space-y-2">
              {rooms.map(room => (
                <li key={room.id}>
                  <button
                    onClick={() => navigate(`/lobby/${room.id}`)}
                    className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition flex justify-between items-center"
                  >
                    <span>{room.name || 'Без названия'}</span>
                    <span className="text-sm text-gray-400">
                      {room.creatorUid ? `Создатель: ${getUserName(room.creatorEmail || '')}` : ''} • {room.players?.length || 0} игроков
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}