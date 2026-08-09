import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { arrayUnion, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import CharacterSheet from './CharacterSheet'
import MasterPanel from './MasterPanel'
import DiceRoller from './DiceRoller'
import YouTube from 'react-youtube'
import { deleteRoomWithCharacters } from '../utils/roomCleanup'

export default function Lobby() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const user = auth.currentUser
  const [roomData, setRoomData] = useState({ players: [], sceneTrackers: [], bgImage: '', creatorUid: '' })
  const [showMaster, setShowMaster] = useState(false)
  const [youtubeId] = useState('')
  const [selectedUid, setSelectedUid] = useState(null)
  const [isEditingRoomName, setIsEditingRoomName] = useState(false)
  const [roomNameDraft, setRoomNameDraft] = useState('')

  const isMaster = roomData.creatorUid === user?.uid
  const playersList = useMemo(
    () => (roomData.players || []).filter(player => player.uid !== roomData.creatorUid && player.role !== 'master'),
    [roomData.players, roomData.creatorUid]
  )
  const visibleTrackers = (roomData.sceneTrackers || []).filter(tracker => !tracker.hidden)
  const selectedPlayer = playersList.find(player => player.uid === selectedUid) || null
  const needsCharacterSetup = !isMaster && !playersList.some(player => player.uid === user?.uid)

  useEffect(() => {
    if (!roomId || !user) return

    const roomRef = doc(db, 'rooms', roomId)
    const unsub = onSnapshot(roomRef, async (roomSnap) => {
      if (!roomSnap.exists()) {
        navigate('/rooms')
        return
      }

      const data = roomSnap.data()
      if ((data.kickedPlayerUids || []).includes(user.uid)) {
        alert('Мастер удалил вас из этой комнаты')
        navigate('/rooms')
        return
      }

      setRoomData(data)
    })

    return () => unsub()
  }, [roomId, user, navigate])

  useEffect(() => {
    if (isMaster) {
      setSelectedUid(currentUid => playersList.some(player => player.uid === currentUid) ? currentUid : (playersList[0]?.uid || null))
    } else {
      setSelectedUid(user?.uid || null)
    }
  }, [isMaster, playersList, user])

  useEffect(() => {
    if (!isEditingRoomName) setRoomNameDraft(roomData.name || '')
  }, [roomData.name, isEditingRoomName])

  const leaveRoom = () => navigate('/rooms')
  const getPlayerName = (player) => player.characterName || player.email?.split('@')[0] || 'Аноним'

  const kickPlayer = async (player) => {
    if (!isMaster || !window.confirm(`Удалить игрока «${getPlayerName(player)}» из комнаты?`)) return
    await updateDoc(doc(db, 'rooms', roomId), {
      players: (roomData.players || []).filter(item => item.uid !== player.uid),
      kickedPlayerUids: arrayUnion(player.uid)
    })
  }

  const updateCharacterName = useCallback(async (uid, characterName) => {
    await updateDoc(doc(db, 'rooms', roomId), {
      players: (roomData.players || []).map(player => player.uid === uid ? { ...player, characterName } : player)
    })
  }, [roomData.players, roomId])

  const completeCharacterSetup = async (characterName) => {
    await updateDoc(doc(db, 'rooms', roomId), {
      players: arrayUnion({ uid: user.uid, email: user.email, role: 'player', characterName })
    })
  }

  const deleteRoom = async () => {
    if (!isMaster || !window.confirm('Удалить эту комнату и все листы персонажей? Это действие нельзя отменить.')) return
    await deleteRoomWithCharacters(roomId)
    navigate('/rooms')
  }

  const saveRoomName = async () => {
    const name = roomNameDraft.trim()
    if (!name) return
    await updateDoc(doc(db, 'rooms', roomId), { name })
    setIsEditingRoomName(false)
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed transition-all duration-700" style={{ backgroundImage: roomData.bgImage ? `url(${roomData.bgImage})` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
      <div className="min-h-screen bg-black/40 backdrop-blur-sm p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2">
                {isEditingRoomName ? (
                  <>
                    <input value={roomNameDraft} onChange={(e) => setRoomNameDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveRoomName()} className="rounded-lg bg-gray-800 px-3 py-1 text-2xl font-bold text-white" autoFocus />
                    <button onClick={saveRoomName} className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-500">Сохранить</button>
                    <button onClick={() => setIsEditingRoomName(false)} className="rounded-lg bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-600">Отмена</button>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-white">🏰 {roomData.name || 'Комната'}</h1>
                    {isMaster && <button onClick={() => setIsEditingRoomName(true)} className="rounded-lg px-2 py-1 text-gray-300 hover:bg-gray-700 hover:text-white" title="Переименовать комнату">✎</button>}
                  </>
                )}
              </div>
              <p className="text-gray-400 text-sm">Игроков: {playersList.length} • {isMaster ? '👑 Мастер' : '🎲 Игрок'}</p>
            </div>
            <div className="flex gap-3">
              {isMaster && <button onClick={() => setShowMaster(!showMaster)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition">{showMaster ? 'Скрыть панель мастера' : 'Панель мастера'}</button>}
              <button onClick={leaveRoom} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition">Выйти</button>
              <button onClick={() => signOut(auth)} className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white transition">Выйти из аккаунта</button>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-300 mb-2">Персонажи</p>
            <div className="flex flex-wrap gap-2">
              {playersList.map(player => (
                <div key={player.uid} className="relative">
                  <button onClick={() => isMaster && setSelectedUid(player.uid)} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${selectedUid === player.uid ? 'border-purple-400 bg-purple-600 text-white' : 'border-gray-600 bg-gray-800 text-gray-200'} ${isMaster ? 'hover:border-purple-300' : 'cursor-default'}`} title={isMaster ? `Открыть лист «${getPlayerName(player)}»` : getPlayerName(player)}>
                    <span>🎲</span><span>{getPlayerName(player)}</span>
                  </button>
                  {isMaster && showMaster && (
                    <button onClick={() => kickPlayer(player)} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white hover:bg-red-500" title={`Удалить «${getPlayerName(player)}» из комнаты`}>×</button>
                  )}
                </div>
              ))}
              {playersList.length === 0 && <span className="text-sm text-gray-400">Игроки ещё не присоединились</span>}
            </div>
          </div>

          {visibleTrackers.length > 0 && (
            <div className="mb-6 rounded-2xl border border-purple-500/20 bg-gray-800/80 p-4 shadow-xl">
              <h2 className="mb-3 text-xl font-bold text-white">🎯 Трекеры сцены</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleTrackers.map(tracker => (
                  <div key={tracker.id} className="rounded-lg bg-gray-700 p-3">
                    <div className="mb-2 flex justify-between text-sm text-white"><span>{tracker.name}</span><span>{tracker.value}/{tracker.max}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-600"><div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${tracker.max ? (tracker.value / tracker.max) * 100 : 0}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {youtubeId && <div className="mb-6"><YouTube videoId={youtubeId} className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden" /></div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CharacterSheet roomId={roomId} userId={user?.uid} isMaster={isMaster} selectedUid={selectedUid} selectedPlayer={selectedPlayer || (needsCharacterSetup ? { email: user?.email } : null)} isInitialSetup={needsCharacterSetup} onCharacterNameChange={updateCharacterName} onCharacterCreated={completeCharacterSetup} />
            </div>
            <div className="lg:col-span-1 space-y-4">
              <DiceRoller />
              {showMaster && isMaster && <MasterPanel roomId={roomId} onDeleteRoom={deleteRoom} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
