import React from 'react'

function Profile({ player, onBack }) {
  const xpForNextLevel = player.level * 100
  const xpPercent = Math.min((player.xp || 0) / xpForNextLevel * 100, 100)

  const stats = [
    { label: 'PV', value: player.pv || 100, icon: '❤️' },
    { label: 'Force', value: player.force || 10, icon: '💪' },
    { label: 'Agilité', value: player.agilite || 10, icon: '🌀' },
    { label: 'Intelligence', value: player.intelligence || 10, icon: '🧠' },
    { label: 'Chance', value: player.chance || 10, icon: '🍀' },
  ]

  const classColors = {
    guerrier: '#c0392b',
    voleur: '#8e44ad',
    alchimiste: '#27ae60',
  }

  const classColor = classColors[player.class] || '#c9a84c'

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={onBack}>← Retour</button>

      <div style={styles.card}>
        <div style={{ ...styles.classTag, background: classColor }}>
          {player.class?.charAt(0).toUpperCase() + player.class?.slice(1)}
        </div>
        <h1 style={styles.name}>{player.username}</h1>
        <p style={styles.level}>Niveau {player.level}</p>

        <div style={styles.xpBarBg}>
          <div style={{ ...styles.xpBarFill, width: `${xpPercent}%` }} />
        </div>
        <p style={styles.xpLabel}>{player.xp || 0} / {xpForNextLevel} XP</p>
      </div>

      <div style={styles.isosCard}>
        <span style={styles.isosIcon}>🪙</span>
        <span style={styles.isosValue}>{player.isos}</span>
        <span style={styles.isosLabel}>Isos</span>
      </div>

      <div style={styles.statsGrid}>
        {stats.map(stat => (
          <div key={stat.label} style={styles.statCard}>
            <span style={styles.statIcon}>{stat.icon}</span>
            <span style={styles.statValue}>{stat.value}</span>
            <span style={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  page: { background: '#0d0d1a', minHeight: '100vh', color: '#e0d5c5', padding: '20px', display: 'flex', flexDirection: 'column' },
  backBtn: { background: 'none', border: 'none', color: '#c9a84c', fontSize: '1rem', cursor: 'pointer', alignSelf: 'flex-start', marginBottom: '16px' },
  card: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '16px' },
  classTag: { display: 'inline-block', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', color: 'white', marginBottom: '12px' },
  name: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '2rem', margin: '0 0 4px' },
  level: { color: '#888', fontSize: '0.9rem', margin: '0 0 16px' },
  xpBarBg: { background: '#1a1a2e', borderRadius: '10px', height: '8px', width: '100%', marginBottom: '6px' },
  xpBarFill: { background: '#c9a84c', borderRadius: '10px', height: '8px', transition: 'width 0.5s' },
  xpLabel: { color: '#555', fontSize: '0.75rem', margin: 0 },
  isosCard: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  isosIcon: { fontSize: '1.5rem' },
  isosValue: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 'bold' },
  isosLabel: { color: '#888', fontSize: '0.9rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  statCard: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  statIcon: { fontSize: '1.5rem' },
  statValue: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.4rem' },
  statLabel: { color: '#888', fontSize: '0.75rem' },
}

export default Profile