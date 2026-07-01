import React, { useState } from 'react'

const STATS = [
  { key: 'pv', label: 'PV', icon: '❤️', bonus: 10 },
  { key: 'force', label: 'Force', icon: '💪', bonus: 1 },
  { key: 'agilite', label: 'Agilité', icon: '🌀', bonus: 1 },
  { key: 'intelligence', label: 'Intelligence', icon: '🧠', bonus: 1 },
  { key: 'chance', label: 'Chance', icon: '🍀', bonus: 1 },
]

function LevelUp({ player, levelUpData, onComplete }) {
  const [points, setPoints] = useState(3)
  const [choices, setChoices] = useState({
    pv: player.pv,
    force: player.force,
    agilite: player.agilite,
    intelligence: player.intelligence,
    chance: player.chance,
  })

  function addPoint(statKey, bonus) {
    if (points <= 0) return
    setChoices(prev => ({ ...prev, [statKey]: prev[statKey] + bonus }))
    setPoints(p => p - 1)
  }

  function removePoint(statKey, bonus) {
    if (choices[statKey] <= player[statKey]) return
    setChoices(prev => ({ ...prev, [statKey]: prev[statKey] - bonus }))
    setPoints(p => p + 1)
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🎉 Niveau {levelUpData.level} !</h1>
      <p style={styles.subtitle}>+5 PV automatiques</p>
      <p style={styles.pointsLeft}>Points restants : <span style={styles.pointsNum}>{points}</span></p>

      <div style={styles.statsList}>
        {STATS.map(stat => (
          <div key={stat.key} style={styles.statRow}>
            <span style={styles.statIcon}>{stat.icon}</span>
            <span style={styles.statLabel}>{stat.label}</span>
            <span style={styles.statValue}>{choices[stat.key]}</span>
            <div style={styles.statBtns}>
              <button
                style={{ ...styles.statBtn, ...(choices[stat.key] <= player[stat.key] ? styles.statBtnDisabled : {}) }}
                onClick={() => removePoint(stat.key, stat.bonus)}
              >−</button>
              <button
                style={{ ...styles.statBtn, ...(points <= 0 ? styles.statBtnDisabled : {}) }}
                onClick={() => addPoint(stat.key, stat.bonus)}
              >+</button>
            </div>
          </div>
        ))}
      </div>

      <button
        style={{ ...styles.confirmBtn, ...(points > 0 ? styles.confirmBtnDisabled : {}) }}
        disabled={points > 0}
        onClick={() => onComplete(choices)}
      >
        {points > 0 ? `Distribue encore ${points} point${points > 1 ? 's' : ''}` : '✅ Confirmer'}
      </button>
    </div>
  )
}

const styles = {
  page: { background: '#0d0d1a', minHeight: '100vh', color: '#e0d5c5', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  title: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '2.5rem', marginBottom: '8px', textAlign: 'center' },
  subtitle: { color: '#4a9a5a', fontSize: '0.9rem', marginBottom: '4px' },
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
  confirmBtn: { background: '#c9a84c', color: '#0d0d1a', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia, serif' },
  confirmBtnDisabled: { background: '#444', color: '#888', cursor: 'not-allowed' },
}

export default LevelUp