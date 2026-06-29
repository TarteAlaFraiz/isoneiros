import React from 'react'
import { supabase } from './supabase'

function Settings({ onBack }) {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={onBack}>← Retour</button>
      <h1 style={styles.title}>Paramètres</h1>

      <div style={styles.section}>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: { background: '#0d0d1a', minHeight: '100vh', color: '#e0d5c5', padding: '30px 20px', display: 'flex', flexDirection: 'column' },
  backBtn: { background: 'none', border: 'none', color: '#c9a84c', fontSize: '1rem', cursor: 'pointer', alignSelf: 'flex-start', marginBottom: '20px' },
  title: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '2rem', letterSpacing: '2px', marginBottom: '30px' },
  section: { maxWidth: '500px' },
  logoutBtn: { background: '#1a0a0a', border: '1px solid #5a2a2a', borderRadius: '10px', color: '#e05555', padding: '14px 24px', fontSize: '1rem', cursor: 'pointer', width: '100%' },
}

export default Settings