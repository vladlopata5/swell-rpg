import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

const BATCH_SIZE = 400

export async function deleteRoomWithCharacters(roomId) {
  const roomRef = doc(db, 'rooms', roomId)
  const characters = await getDocs(collection(roomRef, 'characters'))

  for (let index = 0; index < characters.docs.length; index += BATCH_SIZE) {
    const batch = writeBatch(db)
    characters.docs.slice(index, index + BATCH_SIZE).forEach(character => batch.delete(character.ref))
    await batch.commit()
  }

  await deleteDoc(roomRef)
}

export async function deleteAllRoomsWithCharacters() {
  const rooms = await getDocs(collection(db, 'rooms'))
  for (const room of rooms.docs) {
    await deleteRoomWithCharacters(room.id)
  }
}

export async function clearPlayersFromAllRooms() {
  const rooms = await getDocs(collection(db, 'rooms'))

  for (let index = 0; index < rooms.docs.length; index += BATCH_SIZE) {
    const batch = writeBatch(db)
    rooms.docs.slice(index, index + BATCH_SIZE).forEach(room => {
      batch.update(room.ref, { players: [], kickedPlayerUids: [] })
    })
    await batch.commit()
  }
}
