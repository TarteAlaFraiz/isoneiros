import React from 'react'
import { supabase } from './supabase'

function Profile({ player, onBack, onOpenStats, onSave, onOpenEquipment }) {

  const xpForNextLevel = Math.floor(100 * Math.pow(player.level, 1.5))
  const xpPercent = Math.min((player.xp || 0) / xpForNextLevel * 100, 100)
  const pvBase = 100 + ((player.level - 1) * 5)
  const stats = [
    { label: 'PV', value: pvBase + (player.points_pv || 0) * 10, icon: '❤️' },
    { label: 'Force', value: (player.force || 10) + (player.points_force || 0), icon: '💪' },
    { label: 'Agilité', value: (player.agilite || 10) + (player.points_agilite || 0), icon: '🌀' },
    { label: 'Intelligence', value: (player.intelligence || 10) + (player.points_intelligence || 0), icon: '🧠' },
    { label: 'Chance', value: (player.chance || 10) + (player.points_chance || 0), icon: '🍀' },
  ]

  const classColors = {
    guerrier: '#c0392b',
    voleur: '#8e44ad',
    alchimiste: '#27ae60',
  }
  const classColor = classColors[player.class] || '#c9a84c'

  async function handleResetStats() {
    const totalSpent = (player.points_force || 0) +
      (player.points_agilite || 0) +
      (player.points_intelligence || 0) +
      (player.points_chance || 0) +
      (player.points_pv || 0)

    await supabase
      .from('players')
      .update({
        points_force: 0,
        points_agilite: 0,
        points_intelligence: 0,
        points_chance: 0,
        points_pv: 0,
        points_disponibles: (player.points_disponibles || 0) + totalSpent,
      })
      .eq('user_id', player.user_id)

    if (onSave) await onSave()
    if (totalSpent > 0) onOpenStats()
  }

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

      <button style={styles.equipBtn} onClick={() => onOpenEquipment()}>
        ⚔️ Gérer l'équipement
      </button>

      <div style={styles.statsGrid}>
        {stats.map(stat => (
          <div key={stat.label} style={styles.statCard}>
            <span style={styles.statIcon}>{stat.icon}</span>
            <span style={styles.statValue}>{stat.value}</span>
            <span style={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      <div style={styles.actionsSection}>
        {(player.points_disponibles || 0) > 0 && (
          <button style={styles.distributeBtn} onClick={onOpenStats}>
            ✨ Distribuer {player.points_disponibles} point{player.points_disponibles > 1 ? 's' : ''}
          </button>
        )}
        <button style={styles.resetBtn} onClick={handleResetStats}>
          🔄 Réinitialiser les points de stats
        </button>
        <p style={styles.hint}>Remet tous tes points manuels à zéro et te les rend à redistribuer.</p>
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
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
  statCard: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  statIcon: { fontSize: '1.5rem' },
  statValue: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.4rem' },
  statLabel: { color: '#888', fontSize: '0.75rem' },
  actionsSection: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' },
  distributeBtn: { background: '#1a1a2e', border: '1px solid #c9a84c', color: '#c9a84c', borderRadius: '10px', padding: '12px 24px', fontSize: '1rem', cursor: 'pointer' },
  resetBtn: { background: '#111122', border: '1px solid #2a2a4a', color: '#888', borderRadius: '10px', padding: '12px 24px', fontSize: '0.9rem', cursor: 'pointer' },
  successMsg: { color: '#4a9a5a', fontSize: '0.85rem' },
  hint: { color: '#444', fontSize: '0.75rem', fontStyle: 'italic' },
  equipBtn: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '10px', color: '#c9a84c', padding: '12px 24px', fontSize: '0.95rem', cursor: 'pointer', width: '100%', marginBottom: '12px' },
}

export default Profile