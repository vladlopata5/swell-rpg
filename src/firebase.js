import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// 🔥 ВСТАВЬТЕ СЮДА ВАШ КЛЮЧ (тот, что скопировали из Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyAPGkUpU0zlqcu5H2D-J-Ia58vU7ze63us",
  authDomain: "swell-rpg.firebaseapp.com",
  projectId: "swell-rpg",
  storageBucket: "swell-rpg.firebasestorage.app",
  messagingSenderId: "227571267772",
  appId: "1:227571267772:web:601e56a20ae6f641af38b9"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)