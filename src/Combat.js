import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

function Combat({ player, monsterId, onResult }) {
  const [monster, setMonster] = useState(null)
  const [weaponLines, setWeaponLines] = useState([])
  const [log, setLog] = useState([])
  const [playerHp, setPlayerHp] = useState(player.currentHp ?? player.pv)
  const [monsterHp, setMonsterHp] = useState(null)
  const [finished, setFinished] = useState(false)
  const started = useRef(false)
  const speedRef = useRef(1000)
  const [speedDisplay, setSpeedDisplay] = useState(1000)

  function setSpeed(value) {
    speedRef.current = value
    setSpeedDisplay(value)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line
  }, [])

  async function fetchData() {
    const { data: monsterData } = await supabase
      .from('monsters')
      .select('*')
      .eq('id', monsterId)
      .single()

    if (monsterData) {
      setMonster(monsterData)
      setMonsterHp(monsterData.pv)
    }

    if (player.weapon_id) {
      const { data: lines } = await supabase
        .from('weapon_damage_lines')
        .select('*')
        .eq('weapon_id', player.weapon_id)
      if (lines) setWeaponLines(lines)
    }
  }

  useEffect(() => {
    if (monster && !started.current) {
      started.current = true
      runCombat()
    }
    // eslint-disable-next-line
  }, [monster])

  function getPlayerStats() {
    return {
      force: (player.force || 10) + (player.points_force || 0),
      agilite: (player.agilite || 10) + (player.points_agilite || 0),
      intelligence: (player.intelligence || 10) + (player.points_intelligence || 0),
      chance: (player.chance || 10) + (player.points_chance || 0),
    }
  }

  function calcPlayerDamage() {
    const stats = getPlayerStats()
    const damageBonus = player.damage_bonus || 0
    const damageMultiplier = 1 + (player.damage_multiplier || 0) / 100

    // Si le joueur a une arme avec des lignes de dégâts
    if (weaponLines.length > 0) {
      let totalDamage = 0
      weaponLines.forEach(line => {
        const roll = Math.floor(Math.random() * (line.max_damage - line.min_damage + 1)) + line.min_damage
        const statValue = stats[line.stat] || 10
        const lineDamage = (roll + damageBonus) * 0.01 * statValue * damageMultiplier
        totalDamage += Math.round(lineDamage)
      })
      return Math.max(1, totalDamage)
    }

    // Sans arme : dégâts de base selon la classe
    // Sans arme : dégâts de base selon la classe
    if (player.class === 'voleur') {
      const roll = Math.floor(Math.random() * 4) + 3 // 3-6 dégâts de base
      return Math.max(1, Math.round(roll + stats.agilite * 1.5 * 0.1 * damageMultiplier))
    }
    const roll = Math.floor(Math.random() * 4) + 3
    return Math.max(1, Math.round(roll + stats.force * 0.1 * damageMultiplier))
  }

  function applyResistances(rawDamage, stat, monster) {
    const resFixe = monster[`res_fixe_${stat}`] || 0
    const resPct = monster[`res_pct_${stat}`] || 0
    const resGlobale = monster.res_globale || 0

    const afterFixe = rawDamage - resFixe
    const afterPct = afterFixe * (1 - resPct / 100)
    const afterGlobal = afterPct * (1 - resGlobale / 100)

    return Math.max(0, Math.round(afterGlobal))
  }

  function calcMonsterDamage(monster) {
    const roll = Math.floor(Math.random() * 4) + 1
    const monsterMultiplier = 1 + (monster.damage_multiplier || 0) / 100
    const rawDamage = Math.round((roll + monster.force * 0.1) * monsterMultiplier)

    // Résistances du joueur
    const resFixe = player.res_fixe_force || 0
    const resPct = player.res_pct_force || 0
    const resGlobale = player.res_globale || 0

    const afterFixe = rawDamage - resFixe
    const afterPct = afterFixe * (1 - resPct / 100)
    const afterGlobal = afterPct * (1 - resGlobale / 100)

    if (player.class === 'guerrier') return Math.max(0, Math.round(afterGlobal * 0.8))
    return Math.max(0, Math.round(afterGlobal))
  }

  function getPlayerInitiative() {
    return (player.agilite || 10) + (player.points_agilite || 0)
  }

  async function runCombat() {
    let pHp = player.currentHp ?? player.pv
    let mHp = monster.pv

    const playerFirst = getPlayerInitiative() >= monster.agilite
    setLog([playerFirst ? `${player.username} attaque en premier !` : `${monster.name} attaque en premier !`])

    let turn = playerFirst ? 'player' : 'monster'

    while (pHp > 0 && mHp > 0) {
      await new Promise(resolve => setTimeout(resolve, speedRef.current))

      if (turn === 'player') {
        const rawDmg = calcPlayerDamage()
        // Pour les dégâts sans arme, on utilise 'force' comme élément par défaut
        const stat = (weaponLines.length > 0 && weaponLines[0].stat) || (player.class === 'voleur' ? 'agilite' : 'force')
        const dmg = applyResistances(rawDmg, stat, monster)
        mHp = Math.max(0, mHp - dmg)
        setMonsterHp(mHp)
        // eslint-disable-next-line no-loop-func
        setLog(prev => [...prev, `⚔️ ${player.username} inflige ${dmg} dégâts à ${monster.name} (${mHp} PV restants)`])
        turn = 'monster'
      } else {
        const dmg = calcMonsterDamage(monster)
        pHp = Math.max(0, pHp - dmg)
        setPlayerHp(pHp)
        // eslint-disable-next-line no-loop-func
        setLog(prev => [...prev, `💢 ${monster.name} inflige ${dmg} dégâts à ${player.username} (${pHp} PV restants)`])
        turn = 'player'
      }
    }

    setFinished(true)
  }

  if (!monster) return <div style={styles.page}><p style={styles.loading}>Chargement du combat...</p></div>

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>⚔️ Combat</h2>
      <div style={styles.controls}>
        <div style={styles.speedBtns}>
          <button style={{ ...styles.speedBtn, ...(speedDisplay === 1000 ? styles.speedBtnActive : {}) }} onClick={() => setSpeed(1000)}>🐢 Lent</button>
          <button style={{ ...styles.speedBtn, ...(speedDisplay === 500 ? styles.speedBtnActive : {}) }} onClick={() => setSpeed(500)}>🚶 Normal</button>
          <button style={{ ...styles.speedBtn, ...(speedDisplay === 100 ? styles.speedBtnActive : {}) }} onClick={() => setSpeed(100)}>⚡ Rapide</button>
        </div>
        {!finished && (
          <button style={styles.forfeitBtn} onClick={() => onResult({ victory: false, monster, playerHpLeft: 0, forfeit: true })}>
            🏳️ Abandonner
          </button>
        )}
      </div>

      <div style={styles.combatants}>
        <div style={styles.combatant}>
          <span style={styles.name}>{player.username}</span>
          <div style={styles.hpBarBg}>
            <div style={{ ...styles.hpBarFill, width: `${(playerHp / player.pv) * 100}%` }} />
          </div>
          <span style={styles.hpText}>{playerHp} / {player.pv}</span>
        </div>
        <span style={styles.vs}>VS</span>
        <div style={styles.combatant}>
          <span style={styles.name}>{monster.name}</span>
          <div style={styles.hpBarBg}>
            <div style={{ ...styles.hpBarFill, ...styles.hpBarFillEnemy, width: `${(monsterHp / monster.pv) * 100}%` }} />
          </div>
          <span style={styles.hpText}>{monsterHp} / {monster.pv}</span>
        </div>
      </div>

      <div style={styles.log}>
        {log.map((line, i) => <p key={i} style={styles.logLine}>{line}</p>)}
      </div>

      {finished && (
        <>
          <p style={styles.result}>{playerHp > 0 ? '🎉 Victoire !' : '💀 Défaite...'}</p>
          <button style={styles.continueBtn} onClick={() => onResult({ victory: playerHp > 0, monster, playerHpLeft: playerHp })}>
            Continuer
          </button>
        </>
      )}
    </div>
  )
}

const styles = {
  page: { background: '#0d0d1a', minHeight: '100vh', color: '#e0d5c5', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  loading: { color: '#666', marginTop: '100px' },
  title: { color: '#c9a84c', fontFamily: 'Georgia, serif', marginBottom: '20px' },
  combatants: { display: 'flex', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '500px', marginBottom: '20px' },
  combatant: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  name: { color: '#c9a84c', fontSize: '0.9rem' },
  hpBarBg: { background: '#1a1a2e', borderRadius: '8px', height: '10px' },
  hpBarFill: { background: '#4a9a5a', height: '10px', borderRadius: '8px', transition: 'width 0.4s' },
  hpBarFillEnemy: { background: '#a04040' },
  hpText: { fontSize: '0.75rem', color: '#888' },
  vs: { color: '#555', fontWeight: 'bold' },
  log: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '12px', padding: '16px', width: '100%', maxWidth: '500px', maxHeight: '300px', overflowY: 'auto' },
  logLine: { fontSize: '0.85rem', color: '#aaa', margin: '4px 0' },
  result: { fontSize: '1.4rem', color: '#c9a84c', fontFamily: 'Georgia, serif', marginTop: '20px' },
  continueBtn: { background: '#c9a84c', color: '#0d0d1a', border: 'none', borderRadius: '8px', padding: '12px 32px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px' },
  controls: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  speedBtns: { display: 'flex', gap: '8px' },
  speedBtn: { background: '#111122', border: '1px solid #2a2a4a', color: '#888', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' },
  speedBtnActive: { border: '1px solid #c9a84c', color: '#c9a84c' },
  forfeitBtn: { background: 'none', border: '1px solid #5a2a2a', color: '#e05555', borderRadius: '8px', padding: '6px 16px', fontSize: '0.85rem', cursor: 'pointer' },
}

export default Combat