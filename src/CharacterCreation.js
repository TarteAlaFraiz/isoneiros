import React, { useState } from 'react'
import { supabase } from './supabase'

const classes = [
  { id: 'guerrier', label: 'Guerrier', icon: '⚔️', desc: 'Robuste et puissant, maître du combat rapproché.' },
  { id: 'voleur', label: 'Voleur', icon: '🗡️', desc: 'Rapide et furtif, expert en coups critiques.' },
  { id: 'alchimiste', label: 'Alchimiste', icon: '⚗️', desc: 'Maître des potions, bonus en alchimie.' },
]

function CharacterCreation({ session, onCreated, onBack }) {
  const [name, setName] = useState('')
  const [selectedClass, setSelectedClass] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreate() {
    if (!name.trim()) return setError('Choisis un nom !')
    if (!selectedClass) return setError('Choisis une classe !')
    setLoading(true)
    const { error } = await supabase.from('players').insert({
      user_id: session.user.id,
      username: name.trim(),
      class: selectedClass,
      level: 1,
      isos: 0,
      dungeon_attempts: 3,
    })
    if (error) setError(error.message)
    else onCreated()
    setLoading(false)
  }

  return (
    <div style={styles.page}>
        <button style={styles.backBtn} onClick={onBack}>← Retour</button>
      <h1 style={styles.title}>Crée ton personnage</h1>

      <div style={styles.section}>
        <label style={styles.label}>Nom du personnage</label>
        <input
          style={styles.input}
          placeholder="Entre ton nom..."
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Choisis ta classe</label>
        <div style={styles.classGrid}>
          {classes.map(c => (
            <button
              key={c.id}
              style={{ ...styles.classCard, ...(selectedClass === c.id ? styles.classCardActive : {}) }}
              onClick={() => setSelectedClass(c.id)}
            >
              <span style={styles.classIcon}>{c.icon}</span>
              <span style={styles.className}>{c.label}</span>
              <span style={styles.classDesc}>{c.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button
        style={{ ...styles.startBtn, ...(loading ? styles.startBtnDisabled : {}) }}
        onClick={handleCreate}
        disabled={loading}
      >
        {loading ? 'Création...' : '⚔️ Commencer l\'aventure'}
      </button>
    </div>
  )
}

const styles = {
  page: { background: '#0d0d1a', minHeight: '100vh', color: '#e0d5c5', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  title: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '2rem', letterSpacing: '2px', marginBottom: '30px' },
  section: { width: '100%', maxWidth: '500px', marginBottom: '24px' },
  label: { display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' },
  input: { width: '100%', background: '#111122', border: '1px solid #2a2a4a', borderRadius: '8px', padding: '12px', color: '#e0d5c5', fontSize: '1rem', boxSizing: 'border-box' },
  classGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  classCard: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', textAlign: 'left' },
  classCardActive: { border: '1px solid #c9a84c', background: '#1a1a2e' },
  classIcon: { fontSize: '2rem' },
  className: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.1rem', minWidth: '90px' },
  classDesc: { color: '#666', fontSize: '0.8rem', flex: 1 },
  error: { color: '#e05555', marginBottom: '16px' },
  startBtn: { background: '#c9a84c', color: '#0d0d1a', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '1rem', fontFamily: 'Georgia, serif', cursor: 'pointer', fontWeight: 'bold' },
  startBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  backBtn: { background: 'none', border: 'none', color: '#c9a84c', fontSize: '1rem', cursor: 'pointer', alignSelf: 'flex-start', marginBottom: '10px' },
}

export default CharacterCreation