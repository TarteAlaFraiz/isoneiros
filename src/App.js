import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'Arial' }}>
      {!session ? (
        <div>
          <h1>Isoneiros</h1>
          <p>Connecte-toi pour jouer</p>
          <button onClick={() => supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: { redirectTo: window.location.origin }
          })}>
            Se connecter avec Discord
          </button>
        </div>
      ) : (
        <div>
          <h1>Bienvenue sur Isoneiros !</h1>
          <p>Connecté en tant que : {session.user.email}</p>
          <button onClick={() => supabase.auth.signOut()}>
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}

export default App