import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import Login from './components/Login'
import RoomSelector from './components/RoomSelector'
import Lobby from './components/Lobby'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/rooms" /> : <Login />} />
        <Route path="/rooms" element={user ? <RoomSelector /> : <Navigate to="/" />} />
        <Route path="/lobby/:roomId" element={user ? <Lobby /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App