import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc } from 'firebase/firestore'
import CharacterSheet from './CharacterSheet'
import MasterPanel from './MasterPanel'
import DiceRoller from './DiceRoller'
import YouTube from 'react-youtube'

export default function Lobby() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const user = auth.currentUser
  const [roomData, setRoomData] = useState({ players: [], sceneTrackers: [], bgImage: '', creatorUid: '' })
  const [showMaster, setShowMaster] = useState(false)
  const [bgImage, setBgImage] = useState('')
  const [youtubeId, setYoutubeId] = useState('')
  const [playersList, setPlayersList] = useState([])
  const [isMaster, setIsMaster] = useState(false)

  useEffect(() => {
    if (!roomId || !user) return

    const unsub = onSnapshot(doc(db, 'rooms', roomId), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setRoomData(data)
        setBgImage(data.bgImage || '')
        setPlayersList(data.players || [])
        setIsMaster(data.creatorUid === user.uid)

        // Если пользователь ещё не в списке игроков — добавляем
        const players = data.players || []
        const alreadyIn = players.some(p => p.uid === user.uid)
        if (!alreadyIn) {
          await updateDoc(doc(db, 'rooms', roomId), {
            players: arrayUnion({ uid: user.uid, email: user.email, role: 'player' })
          })
        }
      }
    })
    return () => unsub()
  }, [roomId, user])

  const leaveRoom = () => {
    navigate('/rooms')
  }

  // Получить имя пользователя
  const getUserName = (email) => email ? email.split('@')[0] : 'Аноним'

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed transition-all duration-700"
      style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
    >
      <div className="min-h-screen bg-black/40 backdrop-blur-sm p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">🏰 {roomData.name || 'Комната'}</h1>
              <p className="text-gray-400 text-sm">
                Игроков: {playersList.length} • {isMaster ? '👑 Мастер' : '🎲 Игрок'}
              </p>
            </div>
            <div className="flex gap-3">
              {isMaster && (
                <button
                  onClick={() => setShowMaster(!showMaster)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition"
                >
                  {showMaster ? 'Скрыть панель мастера' : 'Панель мастера'}
                </button>
              )}
              <button
                onClick={leaveRoom}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
              >
                Выйти
              </button>
              <button
                onClick={() => signOut(auth)}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white transition"
              >
                Выйти из аккаунта
              </button>
            </div>
          </div>

          {/* Список игроков */}
          <div className="mb-4 flex flex-wrap gap-2">
            {playersList.map(p => (
              <span key={p.uid} className="bg-gray-700 px-3 py-1 rounded-full text-sm text-white">
                {p.role === 'master' ? '👑' : '🎲'} {getUserName(p.email)}
              </span>
            ))}
          </div>

          {youtubeId && (
            <div className="mb-6">
              <YouTube videoId={youtubeId} className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CharacterSheet roomId={roomId} userId={user?.uid} isMaster={isMaster} players={playersList} />
            </div>
            <div className="lg:col-span-1 space-y-4">
              <DiceRoller />
              {showMaster && isMaster && <MasterPanel roomId={roomId} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}