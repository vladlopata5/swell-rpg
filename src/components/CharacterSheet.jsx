import React, { useEffect, useRef, useState } from 'react'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const ASPECT_EXAMPLES = ['Волк-одиночка', 'Лучший друг города', 'Меткий глаз', 'Слабость к спиртному', 'Профессиональный авантюрист', 'Невозмутимый', 'Запах пороха', 'Книжный червь', 'Старые долги', 'Ночная сова', 'Знаток анатомии', 'Легко отвлекается', 'Любимец животных', 'Неуклюжий', 'Твёрдая рука', 'Шёпот ветра', 'Богатая фантазия', 'Боевой клич', 'Память на лица', 'Чувство вины']

const createDefaultCharacter = (player) => ({
  name: player?.characterName || player?.email?.split('@')[0] || '',
  level: 1, body: 1, spirit: 1, mind: 1, lr: 3, os: 1, armor: 0,
  aspects: [], wounds: { light: [], medium: [], heavy: [] },
  abilities: ['Усиление', 'Возможность']
})

export default function CharacterSheet({ roomId, userId, isMaster, selectedUid, selectedPlayer, isInitialSetup = false, onCharacterNameChange, onCharacterCreated }) {
  const [character, setCharacter] = useState(createDefaultCharacter())
  const [originalCharacter, setOriginalCharacter] = useState(null)
  const [isEditing, setIsEditing] = useState(isInitialSetup)
  const [isLoading, setIsLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeField, setActiveField] = useState('level')
  const [aspectDraft, setAspectDraft] = useState('')
  const selectedPlayerRef = useRef(selectedPlayer)

  useEffect(() => { selectedPlayerRef.current = selectedPlayer }, [selectedPlayer])

  useEffect(() => {
    if (isInitialSetup) {
      setCharacter(createDefaultCharacter(selectedPlayerRef.current))
      setIsEditing(true)
      setIsLoading(false)
      return
    }
    if (!roomId || !selectedUid) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const charRef = doc(db, 'rooms', roomId, 'characters', selectedUid)
    const unsub = onSnapshot(charRef, (docSnap) => {
      if (docSnap.exists()) {
        setCharacter({ ...createDefaultCharacter(selectedPlayerRef.current), ...docSnap.data() })
      }
      setIsLoading(false)
    })
    return () => unsub()
  }, [roomId, selectedUid, isInitialSetup])

  const canEdit = isInitialSetup || (Boolean(selectedUid) && (isMaster || selectedUid === userId))
  const level = Number(character.level) || 0
  const recommendedSum = 2 + level
  const currentSum = (Number(character.body) || 0) + (Number(character.spirit) || 0) + (Number(character.mind) || 0)
  const recommendedLr = 2 + level
  const recommendedOs = Math.ceil(level / 2)
  const recommendedAspects = 3 + Math.ceil(level / 2)

  const updateField = (field, value) => {
    setCharacter(current => ({ ...current, [field]: value }))
    setActiveField(field)
  }

  const addAspect = (value = aspectDraft) => {
    const aspect = value.trim()
    if (!aspect) return
    setCharacter(current => ({ ...current, aspects: [...(current.aspects || []), aspect] }))
    setAspectDraft('')
    setActiveField('aspects')
  }

  const removeAspect = (index) => {
    setCharacter(current => ({ ...current, aspects: current.aspects.filter((_, itemIndex) => itemIndex !== index) }))
  }

  const startEditing = () => {
    if (!canEdit) {
      alert('Вы не можете редактировать этот лист')
      return
    }
    setOriginalCharacter(structuredClone(character))
    setIsEditing(true)
    setIsCollapsed(false)
  }

  const cancelEditing = () => {
    if (isInitialSetup) return
    if (originalCharacter) setCharacter(originalCharacter)
    setIsEditing(false)
    setOriginalCharacter(null)
  }

  const handleSave = async () => {
    const savedCharacter = { ...character, name: character.name.trim() || 'Безымянный' }
    const charRef = doc(db, 'rooms', roomId, 'characters', selectedUid)

    if (isInitialSetup) {
      await setDoc(charRef, savedCharacter)
      await onCharacterCreated?.(savedCharacter.name)
    } else {
      await updateDoc(charRef, savedCharacter)
      await onCharacterNameChange?.(selectedUid, savedCharacter.name)
    }

    setCharacter(savedCharacter)
    setIsEditing(false)
    setOriginalCharacter(null)
  }

  const renderRecommendation = () => {
    if (activeField === 'body' || activeField === 'spirit' || activeField === 'mind') {
      return <><p className="font-semibold text-purple-200">Характеристики</p><p>Для уровня {level} рекомендуемая сумма: <b>{recommendedSum}</b>.</p><p>Сейчас: <b>{currentSum}</b>.</p></>
    }
    if (activeField === 'lr') return <><p className="font-semibold text-purple-200">Личный ресурс</p><p>Для уровня {level} рекомендуемый ЛР: <b>{recommendedLr}</b>.</p></>
    if (activeField === 'os') return <><p className="font-semibold text-purple-200">Очки судьбы</p><p>Для уровня {level} рекомендуемые стартовые ОС: <b>{recommendedOs}</b>.</p></>
    if (activeField === 'aspects') return <><p className="font-semibold text-purple-200">Аспекты</p><p>Рекомендуемое количество: <b>{recommendedAspects}</b>. Сейчас: <b>{character.aspects?.length || 0}</b>.</p></>
    if (activeField === 'name') return <><p className="font-semibold text-purple-200">Имя персонажа</p><p>Выберите имя, по которому персонажа увидят мастер и другие игроки.</p></>
    return <><p className="font-semibold text-purple-200">Уровень</p><p>Сумма характеристик: <b>{recommendedSum}</b>.</p><p>ЛР: <b>{recommendedLr}</b>. ОС: <b>{recommendedOs}</b>. Аспектов: <b>{recommendedAspects}</b>.</p></>
  }

  if (!selectedUid && isMaster) return <div className="bg-gray-800/80 backdrop-blur p-6 rounded-2xl border border-purple-500/20 shadow-xl text-gray-300">В комнате пока нет игроков. Их персонажи появятся здесь после присоединения.</div>
  if (isLoading) return <div className="text-gray-400">Загрузка листа...</div>

  const wounds = character.wounds || { light: [], medium: [], heavy: [] }

  return (
    <div className={isInitialSetup ? 'fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4' : ''}>
      <div className={isInitialSetup ? 'mx-auto my-8 max-w-4xl rounded-2xl border border-purple-500/30 bg-gray-900 p-6 shadow-2xl' : 'bg-gray-800/80 backdrop-blur p-6 rounded-2xl border border-purple-500/20 shadow-xl'}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{isInitialSetup ? '✨ Создание персонажа' : '📜 Лист персонажа'}</h2>
          <div className="flex gap-2">
            {!isInitialSetup && !isEditing && <button onClick={() => setIsCollapsed(!isCollapsed)} className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition">{isCollapsed ? 'Развернуть' : 'Свернуть'}</button>}
            {isEditing && !isInitialSetup ? <button onClick={cancelEditing} className="px-4 py-1 rounded-lg text-white transition bg-gray-600 hover:bg-gray-500">Отмена</button> : !isInitialSetup && <button onClick={startEditing} className={`px-4 py-1 rounded-lg text-white transition ${canEdit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'}`} disabled={!canEdit}>Редактировать</button>}
          </div>
        </div>

        {!isCollapsed && (
          <div className="mt-4">
            {isEditing ? (
              <div className="grid gap-5 lg:grid-cols-[1fr_19rem]">
                <div className="space-y-3">
                  <input value={character.name} onFocus={() => setActiveField('name')} onChange={(e) => updateField('name', e.target.value)} placeholder="Имя персонажа" className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" />
                  <label className="block">Уровень <input type="number" value={character.level} onFocus={() => setActiveField('level')} onChange={(e) => updateField('level', +e.target.value)} className="ml-2 w-20 px-2 py-1 bg-gray-700 rounded text-white" /></label>
                  <div className="grid grid-cols-3 gap-2">
                    <label>Тело <input type="number" value={character.body} onFocus={() => setActiveField('body')} onChange={(e) => updateField('body', +e.target.value)} className="w-full px-2 py-1 bg-gray-700 rounded text-white" /></label>
                    <label>Дух <input type="number" value={character.spirit} onFocus={() => setActiveField('spirit')} onChange={(e) => updateField('spirit', +e.target.value)} className="w-full px-2 py-1 bg-gray-700 rounded text-white" /></label>
                    <label>Разум <input type="number" value={character.mind} onFocus={() => setActiveField('mind')} onChange={(e) => updateField('mind', +e.target.value)} className="w-full px-2 py-1 bg-gray-700 rounded text-white" /></label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label>ЛР <input type="number" value={character.lr} onFocus={() => setActiveField('lr')} onChange={(e) => updateField('lr', +e.target.value)} className="w-full px-2 py-1 bg-gray-700 rounded text-white" /></label>
                    <label>ОС <input type="number" value={character.os} onFocus={() => setActiveField('os')} onChange={(e) => updateField('os', +e.target.value)} className="w-full px-2 py-1 bg-gray-700 rounded text-white" /></label>
                  </div>
                  <div onFocus={() => setActiveField('aspects')}>
                    <p className="mb-2 font-semibold">Аспекты</p>
                    <div className="mb-3 flex flex-wrap gap-2">{(character.aspects || []).map((aspect, index) => <span key={index} className="rounded-full bg-purple-700 px-3 py-1 text-sm text-white">{aspect}<button onClick={() => removeAspect(index)} className="ml-2 text-purple-200 hover:text-white">×</button></span>)}</div>
                    <div className="flex gap-2"><input value={aspectDraft} onChange={(e) => setAspectDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addAspect()} placeholder="Новый аспект" className="flex-1 px-3 py-2 bg-gray-700 rounded text-white" /><button onClick={() => addAspect()} className="rounded bg-green-600 px-3 text-white hover:bg-green-700">Добавить</button></div>
                    <div className="mt-4 border-t border-purple-500/30 pt-3"><p className="mb-2 font-semibold text-purple-200">Примеры аспектов</p><div className="flex flex-wrap gap-1">{ASPECT_EXAMPLES.map(aspect => <button key={aspect} onClick={() => addAspect(aspect)} className="rounded bg-gray-700 px-2 py-1 text-left text-xs hover:bg-purple-700">{aspect}</button>)}</div></div>
                  </div>
                  <button onClick={handleSave} className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-bold">{isInitialSetup ? 'Создать персонажа и войти' : 'Сохранить'}</button>
                </div>
                <aside className="rounded-xl border border-purple-500/30 bg-purple-950/30 p-4 text-sm text-gray-200">
                  {renderRecommendation()}
                </aside>
              </div>
            ) : (
              <div className="space-y-3"><p className="text-xl font-semibold">{character.name || 'Безымянный'}</p><p>Уровень {character.level}</p><div className="grid grid-cols-3 gap-2 text-center"><div className="bg-gray-700 p-2 rounded">Тело {character.body}</div><div className="bg-gray-700 p-2 rounded">Дух {character.spirit}</div><div className="bg-gray-700 p-2 rounded">Разум {character.mind}</div></div><div className="flex gap-4"><span>ЛР: {character.lr}</span><span>ОС: {character.os}</span><span>Броня: {character.armor}</span></div><div><p className="font-semibold">Аспекты:</p><ul className="list-disc list-inside text-sm">{(character.aspects || []).map((aspect, index) => <li key={index}>{aspect}</li>)}</ul></div><div><p className="font-semibold">Травмы:</p><div className="text-sm"><span className="text-green-400">Лёгкие: {wounds.light?.length || 0}</span><span className="text-yellow-400 ml-3">Средние: {wounds.medium?.length || 0}</span><span className="text-red-400 ml-3">Тяжёлые: {wounds.heavy?.length || 0}</span></div></div></div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
