import React, { useState } from 'react'

export default function DiceRoller() {
  const [count, setCount] = useState(3)
  const [result, setResult] = useState(null)
  const [mod, setMod] = useState(0)

  const rollDice = () => {
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1)
    const sum = rolls.reduce((acc, v) => acc + (v === 1 ? -1 : v >= 5 ? 1 : 0), 0)
    const final = sum + mod
    setResult({ rolls, sum, final })
  }

  const getResultText = (val) => {
    if (val <= -1) return '❌ Провал с осложнением'
    if (val === 0) return '⚠️ Провал с возможностью'
    if (val === 1) return '➖ Нейтрально'
    if (val === 2) return '✅ Успех с осложнением'
    return '✨ Успех с возможностью'
  }

  return (
    <div className="bg-gray-800/80 backdrop-blur p-4 rounded-2xl border border-purple-500/20 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-3">🎲 Бросок кубов</h3>
      <div className="flex items-center gap-3 mb-3">
        <label className="text-white">Кубов: 
          <input type="number" min="1" max="10" value={count} onChange={(e) => setCount(+e.target.value)} className="w-14 ml-2 px-2 py-1 bg-gray-700 rounded text-white" />
        </label>
        <label className="text-white">Мод: 
          <input type="number" value={mod} onChange={(e) => setMod(+e.target.value)} className="w-14 ml-2 px-2 py-1 bg-gray-700 rounded text-white" />
        </label>
        <button onClick={rollDice} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white">Бросить</button>
      </div>
      {result && (
        <div className="bg-gray-700 p-3 rounded">
          <p className="text-white">Результат: {result.final} ({getResultText(result.final)})</p>
          <p className="text-sm text-gray-400">Кубы: {result.rolls.join(' ')}</p>
        </div>
      )}
    </div>
  )
}