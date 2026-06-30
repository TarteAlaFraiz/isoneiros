import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
import CharacterCreation from './CharacterCreation'
import Settings from './Settings'
import Profile from './Profile'
import Dungeon from './Dungeon'

const menuItems = [
  { id: 'dungeon',     label: 'Donjon',      icon: '⚔️' },
  { id: 'profile',     label: 'Personnage',  icon: '👤' },
  { id: 'inventory',   label: 'Inventaire',  icon: '🎒' },
  { id: 'alchemy',     label: 'Alchimie',    icon: '⚗️' },
  { id: 'market',      label: 'Marché',      icon: '🏪' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
]

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState(null)
  const [player, setPlayer] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) fetchPlayer()
  // eslint-disable-next-line
  }, [session])

  async function fetchPlayer() {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    if (data) setPlayer(data)
  }

  if (!session) return (
    <div style={styles.loginPage}>
      <h1 style={styles.loginTitle}>Isoneiros</h1>
      <p style={styles.loginSub}>Connecte-toi pour jouer</p>
      <button style={styles.discordBtn} onClick={() => supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: { redirectTo: window.location.origin }
      })}>
        Se connecter avec Discord
      </button>
    </div>
  )

  if (session && player === null) return (
    <CharacterCreation session={session} onCreated={fetchPlayer} />
  )
  if (showSettings) return (
  <Settings onBack={() => setShowSettings(false)} />
  )
  if (activeTab === 'dungeon') return (
  <Dungeon player={player} onBack={() => setActiveTab(null)} />
)
  if (activeTab) return (
    <div style={styles.app}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => setActiveTab(null)}>← Retour</button>
        <span style={styles.topTitle}>{menuItems.find(m => m.id === activeTab)?.icon} {menuItems.find(m => m.id === activeTab)?.label}</span>
        <span />
      </div>
      <div style={styles.content}>
        {activeTab === 'profile' ? 
  <Profile player={player} onBack={() => setActiveTab(null)} /> : 
  <p style={styles.comingSoon}>Bientôt disponible...</p>
}
      </div>
    </div>
  )

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div>
          <div style={styles.gameTitle}>Isoneiros</div>
          <div style={styles.playerName}>👤 {player?.username || 'Aventurier'}</div>
        </div>
        <button style={styles.settingsBtn} onClick={() => setShowSettings(true)}>
          ⚙️
        </button>
      </div>

      <div style={styles.grid}>
        {menuItems.map(item => (
          <button key={item.id} style={styles.card} onClick={() => setActiveTab(item.id)}>
            <span style={styles.cardIcon}>{item.icon}</span>
            <span style={styles.cardLabel}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const styles = {
  loginPage: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0d0d1a', color: '#e0d5c5' },
  loginTitle: { fontSize: '3rem', color: '#c9a84c', fontFamily: 'Georgia, serif', letterSpacing: '4px', marginBottom: '10px' },
  loginSub: { color: '#888', marginBottom: '30px' },
  discordBtn: { background: '#5865F2', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' },
  app: { background: '#0d0d1a', minHeight: '100vh', color: '#e0d5c5', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 10px' },
  gameTitle: { fontSize: '1.8rem', color: '#c9a84c', fontFamily: 'Georgia, serif', letterSpacing: '3px' },
  playerName: { fontSize: '0.85rem', color: '#888', marginTop: '4px' },
  settingsBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '20px 16%', flex: 1 },
  card: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s', gap: '8px' },
  cardIcon: { fontSize: '2.5rem' },
  cardLabel: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '0.9rem' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #222' },
  backBtn: { background: 'none', border: 'none', color: '#c9a84c', fontSize: '1rem', cursor: 'pointer' },
  topTitle: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.2rem' },
  content: { flex: 1, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  comingSoon: { color: '#555', fontStyle: 'italic' },
}

export default App