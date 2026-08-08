import React, { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const createDefaultCharacter = (player) => ({
  name: player?.characterName || player?.email?.split('@')[0] || 'Безымянный',
  level: 1,
  body: 1,
  spirit: 1,
  mind: 1,
  lr: 2,
  os: 0,
  armor: 0,
  aspects: [],
  wounds: { light: [], medium: [], heavy: [] },
  abilities: ['Усиление', 'Возможность']
})

export default function CharacterSheet({ roomId, userId, isMaster, players, selectedUid, onCharacterNameChange }) {
  const [character, setCharacter] = useState(createDefaultCharacter())
  const [originalCharacter, setOriginalCharacter] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!roomId || !selectedUid) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const player = players.find(item => item.uid === selectedUid)
    const charRef = doc(db, 'rooms', roomId, 'characters', selectedUid)

    const unsub = onSnapshot(charRef, (docSnap) => {
      if (docSnap.exists()) {
        setCharacter({ ...createDefaultCharacter(player), ...docSnap.data() })
      } else {
        const defaultCharacter = createDefaultCharacter(player)
        setCharacter(defaultCharacter)
        setDoc(charRef, defaultCharacter)
      }
      setIsLoading(false)
    })

    return () => unsub()
  }, [roomId, selectedUid, players])

  const canEdit = Boolean(selectedUid) && (isMaster || selectedUid === userId)

  const startEditing = () => {
    if (!canEdit) {
      alert('Вы не можете редактировать этот лист')
      return
    }
    setOriginalCharacter(structuredClone(character))
    setIsEditing(true)
  }

  const cancelEditing = () => {
    if (originalCharacter) setCharacter(originalCharacter)
    setIsEditing(false)
    setOriginalCharacter(null)
  }

  const handleSave = async () => {
    if (!selectedUid) return
    const charRef = doc(db, 'rooms', roomId, 'characters', selectedUid)
    const savedCharacter = { ...character, name: character.name.trim() || 'Безымянный' }

    await updateDoc(charRef, savedCharacter)
    onCharacterNameChange?.(selectedUid, savedCharacter.name)
    setCharacter(savedCharacter)
    setIsEditing(false)
    setOriginalCharacter(null)
  }

  const addAspect = () => {
    const newAspect = prompt('Введите новый аспект:')
    if (newAspect?.trim()) {
      setCharacter({ ...character, aspects: [...(character.aspects || []), newAspect.trim()] })
    }
  }

  if (!selectedUid && isMaster) {
    return (
      <div className="bg-gray-800/80 backdrop-blur p-6 rounded-2xl border border-purple-500/20 shadow-xl text-gray-300">
        В комнате пока нет игроков. Их персонажи появятся здесь после присоединения.
      </div>
    )
  }

  if (isLoading) return <div className="text-gray-400">Загрузка листа...</div>

  const wounds = character.wounds || { light: [], medium: [], heavy: [] }

  return (
    <div className="bg-gray-800/80 backdrop-blur p-6 rounded-2xl border border-purple-500/20 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">📜 Лист персонажа</h2>
        {isEditing ? (
          <button onClick={cancelEditing} className="px-4 py-1 rounded-lg text-white transition bg-gray-600 hover:bg-gray-500">
            Отмена
          </button>
        ) : (
          <button
            onClick={startEditing}
            className={`px-4 py-1 rounded-lg text-white transition ${canEdit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'}`}
            disabled={!canEdit}
          >
            Редактировать
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <input value={character.name} onChange={(e) => setCharacter({ ...character, name: e.target.value })} placeholder="Имя" className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" />
          <div className="grid grid-cols-3 gap-2">
            <label>Тело: <input type="number" min="1" max="5" value={character.body} onChange={(e) => setCharacter({ ...character, body: +e.target.value })} className="w-full px-2 py-1 bg-gray-700 rounded text-white" /></label>
            <label>Дух: <input type="number" min="1" max="5" value={character.spirit} onChange={(e) => setCharacter({ ...character, spirit: +e.target.value })} className="w-full px-2 py-1 bg-gray-700 rounded text-white" /></label>
            <label>Разум: <input type="number" min="1" max="5" value={character.mind} onChange={(e) => setCharacter({ ...character, mind: +e.target.value })} className="w-full px-2 py-1 bg-gray-700 rounded text-white" /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label>ЛР: <input type="number" value={character.lr} onChange={(e) => setCharacter({ ...character, lr: +e.target.value })} className="w-full px-2 py-1 bg-gray-700 rounded text-white" /></label>
            <label>ОС: <input type="number" value={character.os} onChange={(e) => setCharacter({ ...character, os: +e.target.value })} className="w-full px-2 py-1 bg-gray-700 rounded text-white" /></label>
          </div>
          <button onClick={addAspect} className="w-full py-1 bg-green-600 hover:bg-green-700 rounded text-white">+ Добавить аспект</button>
          <button onClick={handleSave} className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-bold">Сохранить</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xl font-semibold">{character.name || 'Безымянный'}</p>
          <p>Уровень {character.level}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-700 p-2 rounded">Тело {character.body}</div>
            <div className="bg-gray-700 p-2 rounded">Дух {character.spirit}</div>
            <div className="bg-gray-700 p-2 rounded">Разум {character.mind}</div>
          </div>
          <div className="flex gap-4">
            <span>ЛР: {character.lr}</span>
            <span>ОС: {character.os}</span>
            <span>Броня: {character.armor}</span>
          </div>
          <div>
            <p className="font-semibold">Аспекты:</p>
            <ul className="list-disc list-inside text-sm">
              {(character.aspects || []).map((aspect, index) => <li key={index}>{aspect}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Травмы:</p>
            <div className="text-sm">
              <span className="text-green-400">Лёгкие: {wounds.light?.length || 0}</span>
              <span className="text-yellow-400 ml-3">Средние: {wounds.medium?.length || 0}</span>
              <span className="text-red-400 ml-3">Тяжёлые: {wounds.heavy?.length || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
