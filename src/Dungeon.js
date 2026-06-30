import React, { useState, useRef, useEffect } from 'react'
import { supabase } from './supabase'
import Combat from './Combat'
import { gameConfig } from './gameConfig'

const ROW_SIZES = [2, 3, 4, 3, 4, 3, 2]
const roomWeights = [
  { type: 'combat', weight: 50 },
  { type: 'buff', weight: 15 },
  { type: 'heal', weight: 10 },
  { type: 'random', weight: 25 },
]

function pickRoomType() {
  const total = roomWeights.reduce((sum, r) => sum + r.weight, 0)
  let rand = Math.random() * total
  for (const r of roomWeights) {
    if (rand < r.weight) return r.type
    rand -= r.weight
  }
  return roomWeights[0].type
}

function getAccessibleRooms(rowIndex, roomIndex, floorMap) {
  if (rowIndex < 0) return []
  const nextRow = floorMap[rowIndex + 1]
  if (!nextRow) return []
  const currentRowSize = floorMap[rowIndex].length
  const nextRowSize = nextRow.length
  const ratio = nextRowSize / currentRowSize
  const start = Math.floor(roomIndex * ratio)
  const end = Math.ceil((roomIndex + 1) * ratio) - 1
  const accessible = []
  for (let i = start; i <= end; i++) {
    if (i >= 0 && i < nextRowSize) accessible.push(i)
  }
  return accessible
}

function generateFloorMap() {
  const rows = ROW_SIZES.map(size => Array.from({ length: size }, () => ({
    type: pickRoomType(),
    cleared: false,
  })))
  rows.push([{ type: 'boss', cleared: false }])
  return rows
}

const roomIcons = { combat: '⚔️', buff: '✨', heal: '❤️', random: '❓', boss: '👑' }

function Dungeon({ player, onBack }) {
  const [floorNumber, setFloorNumber] = useState(1)
  const [floorMap, setFloorMap] = useState(generateFloorMap)
  const [currentRow, setCurrentRow] = useState(-1)
  const [currentRoomIndex, setCurrentRoomIndex] = useState(null)
  const [pathHistory, setPathHistory] = useState([])
  const [inCombat, setInCombat] = useState(false)
  const [currentMonsterId, setCurrentMonsterId] = useState(null)
  const [pendingRoomTarget, setPendingRoomTarget] = useState(null)
  const [combatCount, setCombatCount] = useState(0)
  const [lines, setLines] = useState([])
  const [runLoot, setRunLoot] = useState({})
  const [screen, setScreen] = useState('map')
  const [currentHp, setCurrentHp] = useState(player.pv)

  const mapRef = useRef(null)
  const roomRefs = useRef({})

  useEffect(() => {
    const timer = setTimeout(() => computeLines(), 50)
    return () => clearTimeout(timer)
    // eslint-disable-next-line
  }, [currentRow, currentRoomIndex])

  function computeLines() {
    if (!mapRef.current) return
    const mapBox = mapRef.current.getBoundingClientRect()
    const newLines = []

    function getCenter(rowIdx, roomIdx) {
      const el = roomRefs.current[`${rowIdx}-${roomIdx}`]
      if (!el) return null
      const box = el.getBoundingClientRect()
      return {
        x: box.left + box.width / 2 - mapBox.left,
        y: box.top + box.height / 2 - mapBox.top,
      }
    }

    for (let i = 0; i < pathHistory.length - 1; i++) {
      const from = getCenter(pathHistory[i].rowIndex, pathHistory[i].roomIndex)
      const to = getCenter(pathHistory[i + 1].rowIndex, pathHistory[i + 1].roomIndex)
      if (from && to) newLines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, type: 'past' })
    }

    if (currentRow >= 0) {
      const accessible = getAccessibleRooms(currentRow, currentRoomIndex, floorMap)
      const from = getCenter(currentRow, currentRoomIndex)
      if (from) {
        accessible.forEach(roomIndex => {
          const to = getCenter(currentRow + 1, roomIndex)
          if (to) newLines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, type: 'future' })
        })
      }
    }

    setLines(newLines)
  }

  async function handleRoomClick(rowIndex, roomIndex) {
    if (rowIndex !== currentRow + 1) return
    const room = floorMap[rowIndex][roomIndex]

    if (room.type === 'combat' || room.type === 'boss') {
      setPendingRoomTarget({ rowIndex, roomIndex })
      const roomType = room.type === 'boss' ? 'boss' : 'combat'
      const { data } = await supabase
        .from('dungeon_floor_monsters')
        .select('monster_ids')
        .eq('dungeon_id', 'foret_sombre')
        .eq('floor_number', 1)
        .eq('room_type', roomType)
        .single()

      if (data) {
        const ids = data.monster_ids.split(',').map(id => id.trim())
        const randomId = ids[Math.floor(Math.random() * ids.length)]
        setCurrentMonsterId(randomId)
        setCombatCount(c => c + 1)
        setInCombat(true)
        return
      }
    }

    if (room.type === 'heal') {
      setCurrentHp(player.pv)
    }

    setCurrentRow(rowIndex)
    setPathHistory(prev => [...prev, { rowIndex, roomIndex }])
    setCurrentRoomIndex(roomIndex)
  }

  async function handleCombatResult(result) {
    setInCombat(false)
    setCurrentMonsterId(null)
    setCurrentHp(result.playerHpLeft)

    if (result.victory) {
      await handleCombatVictory(result.monster)
      const targetRow = pendingRoomTarget.rowIndex
      const targetRoomIdx = pendingRoomTarget.roomIndex
      const isBoss = floorMap[targetRow][targetRoomIdx]?.type === 'boss'

      setCurrentRow(targetRow)
      setPathHistory(prev => [...prev, { rowIndex: targetRow, roomIndex: targetRoomIdx }])
      setCurrentRoomIndex(targetRoomIdx)
      setPendingRoomTarget(null)

      if (isBoss || targetRow === floorMap.length - 1) {
        setTimeout(() => setScreen('floorClear'), 300)
      } else {
        setTimeout(() => computeLines(), 100)
      }
    } else {
      setTimeout(() => setScreen('death'), 300)
    }
  }

  async function handleCombatVictory(monster) {
    const { data: lootTable } = await supabase
      .from('monster_loot')
      .select('*')
      .eq('monster_id', monster.id)

    if (!lootTable) return

    const lootBonus = player.class === 'alchimiste' ? 1.2 : 1
    const newLoot = { ...runLoot }

    for (const loot of lootTable) {
      const roll = Math.random()
      const effectiveDropRate = Math.min(loot.drop_rate * lootBonus, 1)
      if (roll <= effectiveDropRate) {
        if (newLoot[loot.item_name]) {
          newLoot[loot.item_name].quantity += 1
        } else {
          newLoot[loot.item_name] = { quantity: 1, category: loot.item_category }
        }
      }
    }

    setRunLoot(newLoot)
  }

  async function commitLootToInventory(lootObj) {
    for (const [itemName, info] of Object.entries(lootObj)) {
      const { data: existingItems } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', player.user_id)
        .eq('item_name', itemName)

      if (existingItems && existingItems.length > 0) {
        const existing = existingItems[0]
        await supabase
          .from('inventory')
          .update({ quantity: existing.quantity + info.quantity })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('inventory')
          .insert({ user_id: player.user_id, item_name: itemName, item_category: info.category, quantity: info.quantity })
      }
    }
  }

  async function handleExitWithLoot() {
    await commitLootToInventory(runLoot)
    setScreen('exited')
  }

  async function handleNextFloor() {
    setFloorNumber(f => f + 1)
    setFloorMap(generateFloorMap())
    setCurrentRow(-1)
    setCurrentRoomIndex(null)
    setPathHistory([])
    setCurrentHp(player.pv)
    setScreen('map')
  }

  async function handleDeathConfirm() {
    const keptLoot = {}
    for (const [itemName, info] of Object.entries(runLoot)) {
      const keptQuantity = Math.floor(info.quantity * (1 - gameConfig.dungeon.deathLootLossPercent))
      if (keptQuantity > 0) {
        keptLoot[itemName] = { quantity: keptQuantity, category: info.category }
      }
    }
    await commitLootToInventory(keptLoot)
    setScreen('exited')
  }

  if (inCombat && currentMonsterId) {
    return (
      <Combat
        key={combatCount}
        player={{ ...player, currentHp }}
        monsterId={currentMonsterId}
        onResult={handleCombatResult}
      />
    )
  }

  if (screen === 'floorClear') {
    return (
      <div style={styles.page}>
        <h2 style={styles.title}>🏆 Étage {floorNumber} terminé !</h2>
        <div style={styles.lootBox}>
          <h3 style={styles.lootTitle}>Butin accumulé</h3>
          {Object.keys(runLoot).length === 0 ? (
            <p style={styles.comingSoon}>Aucun loot pour l'instant...</p>
          ) : (
            Object.entries(runLoot).map(([name, info]) => (
              <p key={name} style={styles.lootLine}>{name} x{info.quantity}</p>
            ))
          )}
        </div>
        <button style={styles.exitBtn} onClick={handleExitWithLoot}>🚪 Sortir avec le butin</button>
        <button style={styles.continueBtn} onClick={handleNextFloor}>⬆️ Tenter l'étage {floorNumber + 1} (plus difficile)</button>
      </div>
    )
  }

  if (screen === 'death') {
    const lostItems = Object.entries(runLoot).map(([name, info]) => {
      const kept = Math.floor(info.quantity * (1 - gameConfig.dungeon.deathLootLossPercent))
      const lost = info.quantity - kept
      return { name, kept, lost }
    })
    return (
      <div style={styles.page}>
        <h2 style={styles.deathTitle}>💀 Tu es tombé...</h2>
        <div style={styles.lootBox}>
          <h3 style={styles.lootTitle}>Bilan du butin</h3>
          {lostItems.length === 0 ? (
            <p style={styles.comingSoon}>Tu n'avais rien à perdre...</p>
          ) : (
            lostItems.map(item => (
              <p key={item.name} style={styles.lootLine}>
                {item.name} — <span style={styles.kept}>gardé: {item.kept}</span> / <span style={styles.lost}>perdu: {item.lost}</span>
              </p>
            ))
          )}
        </div>
        <button style={styles.exitBtn} onClick={handleDeathConfirm}>Quitter le donjon</button>
      </div>
    )
  }

  if (screen === 'exited') {
    return (
      <div style={styles.page}>
        <h2 style={styles.title}>✅ Retour au village</h2>
        <p style={styles.comingSoon}>Le butin a été ajouté à ton inventaire.</p>
        <button style={styles.exitBtn} onClick={onBack}>Retour au menu</button>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={onBack}>← Quitter le donjon</button>
      <h1 style={styles.title}>🌲 Forêt sombre — Étage {floorNumber}</h1>

      <div style={styles.mapWrapper} ref={mapRef}>
        <svg style={styles.linesSvg}>
          {lines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.type === 'past' ? '#4a9a5a' : '#c9a84c'}
              strokeWidth="2"
              opacity={line.type === 'past' ? 0.5 : 0.7}
            />
          ))}
        </svg>

        <div style={styles.map}>
          {floorMap.slice().reverse().map((row, revIndex) => {
            const rowIndex = floorMap.length - 1 - revIndex
            return (
              <div key={rowIndex} style={styles.row}>
                {row.map((room, roomIndex) => {
                  const accessibleIndices = currentRow === -1
                    ? (rowIndex === 0 ? row.map((_, i) => i) : [])
                    : getAccessibleRooms(currentRow, currentRoomIndex, floorMap)
                  const isAvailable = rowIndex === currentRow + 1 && accessibleIndices.includes(roomIndex)
                  const isOnPath = pathHistory.some(p => p.rowIndex === rowIndex && p.roomIndex === roomIndex)
                  const isCurrent = rowIndex === currentRow && roomIndex === currentRoomIndex
                  return (
                    <button
                      key={roomIndex}
                      ref={el => { roomRefs.current[`${rowIndex}-${roomIndex}`] = el }}
                      style={{
                        ...styles.roomBtn,
                        ...(isAvailable ? styles.roomAvailable : {}),
                        ...(isOnPath ? styles.roomPast : {}),
                        ...(room.cleared ? styles.roomCleared : {}),
                        ...(isCurrent ? styles.roomCurrent : {}),
                      }}
                      disabled={!isAvailable}
                      onClick={() => handleRoomClick(rowIndex, roomIndex)}
                    >
                      {roomIcons[room.type]}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { background: '#0d0d1a', minHeight: '100vh', color: '#e0d5c5', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  backBtn: { background: 'none', border: 'none', color: '#c9a84c', fontSize: '1rem', cursor: 'pointer', alignSelf: 'flex-start', marginBottom: '10px' },
  title: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.4rem', marginBottom: '20px', textAlign: 'center' },
  deathTitle: { color: '#e05555', fontFamily: 'Georgia, serif', fontSize: '1.6rem', marginBottom: '20px', textAlign: 'center' },
  mapWrapper: { position: 'relative', width: '100%', maxWidth: '400px' },
  linesSvg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' },
  map: { display: 'flex', flexDirection: 'column-reverse', gap: '20px', width: '100%', position: 'relative' },
  row: { display: 'flex', justifyContent: 'center', gap: '16px' },
  roomBtn: { width: '50px', height: '50px', borderRadius: '50%', background: '#1a1a2e', border: '2px solid #2a2a4a', fontSize: '1.3rem', cursor: 'not-allowed', opacity: 0.4 },
  roomAvailable: { cursor: 'pointer', opacity: 1, border: '2px solid #c9a84c', boxShadow: '0 0 12px rgba(201,168,76,0.4)' },
  roomPast: { opacity: 0.6, cursor: 'default' },
  roomCleared: { border: '2px solid #4a9a5a' },
  roomCurrent: { border: '3px solid #4a9a5a', boxShadow: '0 0 16px rgba(74,154,90,0.6)' },
  lootBox: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '400px', marginBottom: '20px' },
  lootTitle: { color: '#c9a84c', fontFamily: 'Georgia, serif', marginTop: 0 },
  lootLine: { fontSize: '0.9rem', color: '#ccc', margin: '6px 0' },
  kept: { color: '#4a9a5a' },
  lost: { color: '#e05555' },
  comingSoon: { color: '#555', fontStyle: 'italic' },
  exitBtn: { background: '#1a1a2e', border: '1px solid #c9a84c', color: '#c9a84c', borderRadius: '8px', padding: '12px 24px', fontSize: '1rem', cursor: 'pointer', marginBottom: '12px', width: '100%', maxWidth: '400px' },
  continueBtn: { background: '#c9a84c', border: 'none', color: '#0d0d1a', borderRadius: '8px', padding: '12px 24px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', width: '100%', maxWidth: '400px' },
}

export default Dungeon