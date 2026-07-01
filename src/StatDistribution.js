import React, { useState } from 'react'
import { supabase } from './supabase'

const STATS = [
  { key: 'points_pv', label: 'PV', icon: '❤️', bonus: 10 },
  { key: 'points_force', label: 'Force', icon: '💪', bonus: 1 },
  { key: 'points_agilite', label: 'Agilité', icon: '🌀', bonus: 1 },
  { key: 'points_intelligence', label: 'Intelligence', icon: '🧠', bonus: 1 },
  { key: 'points_chance', label: 'Chance', icon: '🍀', bonus: 1 },
]

function StatDistribution({ player, onBack, onSave }) {
  const [points, setPoints] = useState(player.points_disponibles || 0)
  const [choices, setChoices] = useState({
    points_pv: player.points_pv || 0,
    points_force: player.points_force || 0,
    points_agilite: player.points_agilite || 0,
    points_intelligence: player.points_intelligence || 0,
    points_chance: player.points_chance || 0,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const baseStats = {
    points_pv: player.points_pv || 0,
    points_force: player.points_force || 0,
    points_agilite: player.points_agilite || 0,
    points_intelligence: player.points_intelligence || 0,
    points_chance: player.points_chance || 0,
  }

  function getDisplayValue(statKey) {
    const bonusMap = { points_pv: 10, points_force: 1, points_agilite: 1, points_intelligence: 1, points_chance: 1 }
    const baseStatMap = {
      points_pv: 100 + (player.level - 1) * 5,
      points_force: player.force || 10,
      points_agilite: player.agilite || 10,
      points_intelligence: player.intelligence || 10,
      points_chance: player.chance || 10,
    }
    return baseStatMap[statKey] + choices[statKey] * bonusMap[statKey]
  }

  function addPoint(statKey) {
    if (points <= 0) return
    setChoices(prev => ({ ...prev, [statKey]: prev[statKey] + 1 }))
    setPoints(p => p - 1)
  }

  function removePoint(statKey) {
    if (choices[statKey] <= baseStats[statKey]) return
    setChoices(prev => ({ ...prev, [statKey]: prev[statKey] - 1 }))
    setPoints(p => p + 1)
  }

  async function handleSave() {
    setSaving(true)
    const totalSpent = Object.keys(choices).reduce((sum, key) => sum + (choices[key] - baseStats[key]), 0)
    await supabase
      .from('players')
      .update({
        ...choices,
        points_disponibles: Math.max(0, (player.points_disponibles || 0) - totalSpent),
      })
      .eq('user_id', player.user_id)
    setSaving(false)
    setSaved(true)
    if (onSave) onSave()
  }

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={onBack}>← Retour</button>
      <h1 style={styles.title}>📊 Distribuer les stats</h1>
      <p style={styles.pointsLeft}>
        Points disponibles : <span style={styles.pointsNum}>{points}</span>
      </p>

      <div style={styles.statsList}>
        {STATS.map(stat => (
          <div key={stat.key} style={styles.statRow}>
            <span style={styles.statIcon}>{stat.icon}</span>
            <span style={styles.statLabel}>{stat.label}</span>
            <span style={styles.statValue}>{getDisplayValue(stat.key)}</span>
            <div style={styles.statBtns}>
              <button
                style={{ ...styles.statBtn, ...(choices[stat.key] <= baseStats[stat.key] ? styles.statBtnDisabled : {}) }}
                onClick={() => removePoint(stat.key)}
              >−</button>
              <button
                style={{ ...styles.statBtn, ...(points <= 0 ? styles.statBtnDisabled : {}) }}
                onClick={() => addPoint(stat.key)}
              >+</button>
            </div>
          </div>
        ))}
      </div>

      {saved ? (
        <p style={styles.savedMsg}>✅ Stats sauvegardées !</p>
      ) : (
        <button
          style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }}
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? 'Sauvegarde...' : '✅ Confirmer'}
        </button>
      )}
    </div>
  )
}

const styles = {
  page: { background: '#0d0d1a', minHeight: '100vh', color: '#e0d5c5', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  backBtn: { background: 'none', border: 'none', color: '#c9a84c', fontSize: '1rem', cursor: 'pointer', alignSelf: 'flex-start', marginBottom: '20px' },
  title: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '2rem', marginBottom: '8px', textAlign: 'center' },
  pointsLeft: { color: '#888', fontSize: '1rem', marginBottom: '30px' },
  pointsNum: { color: '#c9a84c', fontWeight: 'bold', fontSize: '1.2rem' },
  statsList: { width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' },
  statRow: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' },
  statIcon: { fontSize: '1.4rem' },
  statLabel: { flex: 1, color: '#888', fontSize: '0.9rem' },
  statValue: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.2rem', minWidth: '40px', textAlign: 'center' },
  statBtns: { display: 'flex', gap: '8px' },
  statBtn: { background: '#1a1a2e', border: '1px solid #2a2a4a', color: '#c9a84c', borderRadius: '6px', width: '32px', height: '32px', fontSize: '1.2rem', cursor: 'pointer' },
  statBtnDisabled: { opacity: 0.3, cursor: 'not-allowed' },
  saveBtn: { background: '#c9a84c', color: '#0d0d1a', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia, serif' },
  saveBtnDisabled: { background: '#444', color: '#888', cursor: 'not-allowed' },
  savedMsg: { color: '#4a9a5a', fontSize: '1rem' },
}

export default StatDistribution