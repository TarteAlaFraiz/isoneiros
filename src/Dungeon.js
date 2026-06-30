import React, { useState } from 'react'

// Structure fixe : 2 -> 3 -> 4 -> 3 -> 4 -> 3 -> 2 -> boss
const ROW_SIZES = [2, 3, 4, 3, 4, 3, 2]

const roomTypes = ['combat', 'buff', 'heal', 'random']

function generateFloorMap() {
  const rows = ROW_SIZES.map((size, rowIndex) => {
    return Array.from({ length: size }, () => {
      const type = roomTypes[Math.floor(Math.random() * roomTypes.length)]
      return { type, cleared: false }
    })
  })
  rows.push([{ type: 'boss', cleared: false }])
  return rows
}

const roomIcons = {
  combat: '⚔️',
  buff: '✨',
  heal: '❤️',
  random: '❓',
  boss: '👑',
}

function Dungeon({ player, onBack }) {
  const [floorNumber] = useState(1)
  const [floorMap] = useState(generateFloorMap)
  const [currentRow, setCurrentRow] = useState(-1) // -1 = pas encore entré
  const [selectedRoom, setSelectedRoom] = useState(null)

  function handleRoomClick(rowIndex, roomIndex) {
    if (rowIndex !== currentRow + 1) return // on ne peut avancer que d'une ligne
    setSelectedRoom({ rowIndex, roomIndex, room: floorMap[rowIndex][roomIndex] })
  }

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={onBack}>← Quitter le donjon</button>
      <h1 style={styles.title}>🌲 Forêt sombre — Étage {floorNumber}</h1>

      <div style={styles.map}>
        {floorMap.slice().reverse().map((row, revIndex) => {
          const rowIndex = floorMap.length - 1 - revIndex
          return (
            <div key={rowIndex} style={styles.row}>
              {row.map((room, roomIndex) => {
                const isAvailable = rowIndex === currentRow + 1
                const isPast = rowIndex <= currentRow
                return (
                  <button
                    key={roomIndex}
                    style={{
                      ...styles.roomBtn,
                      ...(isAvailable ? styles.roomAvailable : {}),
                      ...(isPast ? styles.roomPast : {}),
                      ...(room.cleared ? styles.roomCleared : {}),
                    }}
                    disabled={!isAvailable}
                    onClick={() => handleRoomClick(rowIndex, roomIndex)}
                  >
                    {isPast || room.cleared ? roomIcons[room.type] : (isAvailable ? roomIcons[room.type] : '🔒')}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {selectedRoom && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>{roomIcons[selectedRoom.room.type]} Salle {selectedRoom.room.type}</h2>
            <p style={styles.comingSoon}>Contenu de la salle à venir...</p>
            <button style={styles.modalBtn} onClick={() => {
              setCurrentRow(selectedRoom.rowIndex)
              setSelectedRoom(null)
            }}>
              Entrer
            </button>
            <button style={styles.modalCancelBtn} onClick={() => setSelectedRoom(null)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { background: '#0d0d1a', minHeight: '100vh', color: '#e0d5c5', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  backBtn: { background: 'none', border: 'none', color: '#c9a84c', fontSize: '1rem', cursor: 'pointer', alignSelf: 'flex-start', marginBottom: '10px' },
  title: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.4rem', marginBottom: '20px', textAlign: 'center' },
  map: { display: 'flex', flexDirection: 'column-reverse', gap: '20px', width: '100%', maxWidth: '400px' },
  row: { display: 'flex', justifyContent: 'center', gap: '16px' },
  roomBtn: { width: '50px', height: '50px', borderRadius: '50%', background: '#1a1a2e', border: '2px solid #2a2a4a', fontSize: '1.3rem', cursor: 'not-allowed', opacity: 0.4 },
  roomAvailable: { cursor: 'pointer', opacity: 1, border: '2px solid #c9a84c', boxShadow: '0 0 12px rgba(201,168,76,0.4)' },
  roomPast: { opacity: 0.6, cursor: 'default' },
  roomCleared: { border: '2px solid #4a9a5a' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalContent: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '16px', padding: '30px', textAlign: 'center', maxWidth: '320px' },
  modalTitle: { color: '#c9a84c', fontFamily: 'Georgia, serif', marginBottom: '16px' },
  comingSoon: { color: '#666', marginBottom: '20px' },
  modalBtn: { background: '#c9a84c', color: '#0d0d1a', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px', width: '100%' },
  modalCancelBtn: { background: 'none', border: '1px solid #444', color: '#888', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', width: '100%' },
}

export default Dungeon