import React, { useState, useEffect } from 'react'
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'

export default function CharacterSheet({ roomId }) {
  const [character, setCharacter] = useState({
    name: '',
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
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    // В реальности тут должен быть ID персонажа, но для демо используем фиксированный
    const unsub = onSnapshot(doc(db, 'rooms', roomId, 'characters', 'player1'), (doc) => {
      if (doc.exists()) setCharacter(doc.data())
    })
    return () => unsub()
  }, [roomId])

  const handleSave = async () => {
    await updateDoc(doc(db, 'rooms', roomId, 'characters', 'player1'), character)
    setIsEditing(false)
  }

  const addAspect = () => {
    const newAspect = prompt('Введите новый аспект:')
    if (newAspect) {
      setCharacter({ ...character, aspects: [...character.aspects, newAspect] })
    }
  }

  return (
    <div className="bg-gray-800/80 backdrop-blur p-6 rounded-2xl border border-purple-500/20 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">📜 Лист персонажа</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
        >
          {isEditing ? 'Отмена' : 'Редактировать'}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <input
            value={character.name}
            onChange={(e) => setCharacter({ ...character, name: e.target.value })}
            placeholder="Имя"
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
          />
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
              {character.aspects.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Травмы:</p>
            <div className="text-sm">
              <span className="text-green-400">Лёгкие: {character.wounds.light.length}</span>
              <span className="text-yellow-400 ml-3">Средние: {character.wounds.medium.length}</span>
              <span className="text-red-400 ml-3">Тяжёлые: {character.wounds.heavy.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}