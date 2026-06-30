import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

function Combat({ player, monsterId, onResult }) {
  const [monster, setMonster] = useState(null)
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
    fetchMonster()
    // eslint-disable-next-line
  }, [])

  async function fetchMonster() {
    const { data } = await supabase.from('monsters').select('*').eq('id', monsterId).single()
    if (data) {
      setMonster(data)
      setMonsterHp(data.pv)
    }
  }

  useEffect(() => {
    if (monster && !started.current) {
      started.current = true
      runCombat()
    }
    // eslint-disable-next-line
  }, [monster])

  function getPlayerDamage() {
    if (player.class === 'voleur') return Math.round(player.agilite * 1.5)
    return player.force
  }

  function getPlayerInitiative() {
    return player.agilite
  }

  function getDamageToPlayer(rawDamage) {
    if (player.class === 'guerrier') return Math.round(rawDamage * 0.8)
    return rawDamage
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
        const dmg = Math.max(1, getPlayerDamage() - monster.resistance)
        // eslint-disable-next-line no-loop-func
        mHp = Math.max(0, mHp - dmg)
        setMonsterHp(mHp)
        // eslint-disable-next-line no-loop-func
        setLog(prev => [...prev, `⚔️ ${player.username} inflige ${dmg} dégâts à ${monster.name} (${mHp} PV restants)`])
        turn = 'monster'
      } else {
        const rawDmg = Math.max(1, monster.force - (player.resistance || 0))
        const dmg = getDamageToPlayer(rawDmg)
        // eslint-disable-next-line no-loop-func
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