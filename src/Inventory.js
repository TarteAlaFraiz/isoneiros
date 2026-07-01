import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'

const SORT_MODES = [
  { id: 'acquisition', label: '🕐 Acquisition' },
  { id: 'category', label: '📦 Catégorie' },
  { id: 'monster', label: '👾 Monstre' },
]

function Inventory({ player, onBack }) {
  const [items, setItems] = useState([])
  const [monsters, setMonsters] = useState({})
  const [monsterLoot, setMonsterLoot] = useState([])
  const [sortMode, setSortMode] = useState('acquisition')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line
  }, [])

  async function fetchAll() {
    setLoading(true)

    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', player.user_id)

    const { data: monstersData } = await supabase
      .from('monsters')
      .select('id, name')

    const { data: monsterLootData } = await supabase
      .from('monster_loot')
      .select('monster_id, item_name')

    if (inventoryData) setItems(inventoryData)
    if (monstersData) {
      const monsterMap = {}
      monstersData.forEach(m => { monsterMap[m.id] = m.name })
      setMonsters(monsterMap)
    }
    if (monsterLootData) setMonsterLoot(monsterLootData)

    setLoading(false)
  }

  function getMonsterForItem(itemName) {
    const loot = monsterLoot.find(l => l.item_name === itemName)
    if (!loot) return 'Inconnu'
    return monsters[loot.monster_id] || 'Inconnu'
  }

  function getSortedItems() {
    if (sortMode === 'acquisition') return items

    if (sortMode === 'category') {
      const groups = {}
      items.forEach(item => {
        const cat = item.item_category || 'Autre'
        if (!groups[cat]) groups[cat] = []
        groups[cat].push(item)
      })
      return groups
    }

    if (sortMode === 'monster') {
      const groups = {}
      items.forEach(item => {
        const monsterName = getMonsterForItem(item.item_name)
        if (!groups[monsterName]) groups[monsterName] = []
        groups[monsterName].push(item)
      })
      return groups
    }
  }

  function renderItem(item) {
    return (
      <div key={item.id} style={styles.itemCard}>
        <span style={styles.itemName}>{item.item_name}</span>
        <span style={styles.itemQty}>x{item.quantity}</span>
        <span style={styles.itemCat}>{item.item_category}</span>
      </div>
    )
  }

  function renderContent() {
    if (loading) return <p style={styles.loading}>Chargement...</p>
    if (items.length === 0) return <p style={styles.empty}>Ton inventaire est vide — pars en donjon !</p>

    const sorted = getSortedItems()

    if (sortMode === 'acquisition') {
      return <div style={styles.grid}>{sorted.map(item => renderItem(item))}</div>
    }

    return Object.entries(sorted).map(([groupName, groupItems]) => (
      <div key={groupName} style={styles.group}>
        <h3 style={styles.groupTitle}>{groupName}</h3>
        <div style={styles.grid}>
          {groupItems.map(item => renderItem(item))}
        </div>
      </div>
    ))
  }

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={onBack}>← Retour</button>
      <h1 style={styles.title}>🎒 Inventaire</h1>

      <div style={styles.sortBar}>
        {SORT_MODES.map(mode => (
          <button
            key={mode.id}
            style={{ ...styles.sortBtn, ...(sortMode === mode.id ? styles.sortBtnActive : {}) }}
            onClick={() => setSortMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {renderContent()}
      </div>
    </div>
  )
}

const styles = {
  page: { background: '#0d0d1a', minHeight: '100vh', color: '#e0d5c5', padding: '20px', display: 'flex', flexDirection: 'column' },
  backBtn: { background: 'none', border: 'none', color: '#c9a84c', fontSize: '1rem', cursor: 'pointer', alignSelf: 'flex-start', marginBottom: '10px' },
  title: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.8rem', marginBottom: '16px', textAlign: 'center' },
  sortBar: { display: 'flex', gap: '8px', marginBottom: '20px', justifyContent: 'center', flexWrap: 'wrap' },
  sortBtn: { background: '#111122', border: '1px solid #2a2a4a', color: '#888', borderRadius: '8px', padding: '8px 14px', fontSize: '0.85rem', cursor: 'pointer' },
  sortBtnActive: { border: '1px solid #c9a84c', color: '#c9a84c' },
  content: { flex: 1 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' },
  itemCard: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' },
  itemName: { color: '#e0d5c5', fontSize: '0.9rem', fontWeight: 'bold' },
  itemQty: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.1rem' },
  itemCat: { color: '#555', fontSize: '0.75rem', fontStyle: 'italic' },
  group: { marginBottom: '24px' },
  groupTitle: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.1rem', marginBottom: '10px', borderBottom: '1px solid #222', paddingBottom: '6px' },
  loading: { color: '#666', textAlign: 'center', marginTop: '40px' },
  empty: { color: '#555', textAlign: 'center', fontStyle: 'italic', marginTop: '40px' },
}

export default Inventory