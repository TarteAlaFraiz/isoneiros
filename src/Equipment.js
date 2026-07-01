import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'

const SLOTS = [
  { key: 'slot_arme', label: 'Arme', icon: '⚔️' },
  { key: 'slot_bouclier', label: 'Bouclier', icon: '🛡️' },
  { key: 'slot_casque', label: 'Casque', icon: '🪖' },
  { key: 'slot_plastron', label: 'Plastron', icon: '🦺' },
  { key: 'slot_cape', label: 'Cape', icon: '🧣' },
  { key: 'slot_jambieres', label: 'Jambières', icon: '👖' },
  { key: 'slot_bottes', label: 'Bottes', icon: '👢' },
  { key: 'slot_anneau', label: 'Anneau', icon: '💍' },
  { key: 'slot_amulette', label: 'Amulette', icon: '📿' },
  { key: 'slot_ceinture', label: 'Ceinture', icon: '🪢' },
]

function Equipment({ player, onBack, onSave }) {
  const [bag, setBag] = useState([])
  const [equippedItems, setEquippedItems] = useState({})
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEquipment()
    // eslint-disable-next-line
  }, [])

  async function fetchEquipment() {
    setLoading(true)

    const { data: peData } = await supabase
      .from('player_equipment')
      .select('*')
      .eq('user_id', player.user_id)

    console.log('peData:', peData)

    if (peData && peData.length > 0) {
      const equipmentIds = peData.map(e => e.equipment_id)
      const { data: eqData } = await supabase
        .from('equipment')
        .select('*')
        .in('id', equipmentIds)

      console.log('eqData:', eqData)

      const merged = peData.map(pe => ({
        ...pe,
        equipment: eqData?.find(e => e.id === pe.equipment_id) || null
      }))

      const inBag = merged.filter(e => !e.equipped_slot)
      const equipped = {}
      merged.filter(e => e.equipped_slot).forEach(e => {
        equipped[e.equipped_slot] = e
      })
      setBag(inBag)
      setEquippedItems(equipped)
    }

    setLoading(false)
  }

  async function equipItem(playerEquipmentId, slot) {
    if (equippedItems[slot]) {
      await supabase
        .from('player_equipment')
        .update({ equipped_slot: null })
        .eq('id', equippedItems[slot].id)
    }

    await supabase
      .from('player_equipment')
      .update({ equipped_slot: slot })
      .eq('id', playerEquipmentId)

    await supabase
      .from('players')
      .update({ [slot]: playerEquipmentId })
      .eq('user_id', player.user_id)

    await fetchEquipment()
    if (onSave) onSave()
    setSelectedItem(null)
  }

  async function unequipItem(slot) {
    if (!equippedItems[slot]) return

    await supabase
      .from('player_equipment')
      .update({ equipped_slot: null })
      .eq('id', equippedItems[slot].id)

    await supabase
      .from('players')
      .update({ [slot]: null })
      .eq('user_id', player.user_id)

    await fetchEquipment()
    if (onSave) onSave()
  }

  function renderStats(equipment) {
    const stats = []
    if (equipment.bonus_force) stats.push(`💪 +${equipment.bonus_force} Force`)
    if (equipment.bonus_agilite) stats.push(`🌀 +${equipment.bonus_agilite} Agilité`)
    if (equipment.bonus_intelligence) stats.push(`🧠 +${equipment.bonus_intelligence} Intelligence`)
    if (equipment.bonus_chance) stats.push(`🍀 +${equipment.bonus_chance} Chance`)
    if (equipment.bonus_pv) stats.push(`❤️ +${equipment.bonus_pv} PV`)
    if (equipment.damage_bonus) stats.push(`⚔️ +${equipment.damage_bonus} Dégâts`)
    if (equipment.damage_multiplier) stats.push(`✨ +${equipment.damage_multiplier}% Dégâts`)
    if (equipment.res_globale) stats.push(`🛡️ ${equipment.res_globale}% Rés. globale`)
    if (equipment.res_fixe_force) stats.push(`🔥 ${equipment.res_fixe_force} Rés. Force`)
    if (equipment.res_fixe_agilite) stats.push(`💨 ${equipment.res_fixe_agilite} Rés. Agilité`)
    if (equipment.res_fixe_intelligence) stats.push(`❄️ ${equipment.res_fixe_intelligence} Rés. Intel.`)
    if (equipment.res_fixe_chance) stats.push(`🌿 ${equipment.res_fixe_chance} Rés. Chance`)
    return stats
  }

  if (loading) return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={onBack}>← Retour</button>
      <p style={styles.loading}>Chargement...</p>
    </div>
  )

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={onBack}>← Retour</button>
      <h1 style={styles.title}>⚔️ Équipement</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Porté</h2>
        <div style={styles.slotsGrid}>
          {SLOTS.map(slot => {
            const equipped = equippedItems[slot.key]
            return (
              <div
                key={slot.key}
                style={{ ...styles.slotCard, ...(equipped ? styles.slotCardEquipped : {}) }}
                onClick={() => equipped ? unequipItem(slot.key) : null}
              >
                <span style={styles.slotIcon}>{slot.icon}</span>
                <span style={styles.slotLabel}>{slot.label}</span>
                {equipped ? (
                  <span style={styles.slotItemName}>{equipped.equipment.name}</span>
                ) : (
                  <span style={styles.slotEmpty}>Vide</span>
                )}
                {equipped && <span style={styles.unequipHint}>Tap pour retirer</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Sac</h2>
        {bag.length === 0 ? (
          <p style={styles.empty}>Aucun équipement dans ton sac — craft des items via l'Alchimie !</p>
        ) : (
          <div style={styles.bagGrid}>
            {bag.map(item => (
              <div
                key={item.id}
                style={{ ...styles.bagCard, ...(selectedItem?.id === item.id ? styles.bagCardSelected : {}) }}
                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
              >
                <span style={styles.bagItemName}>{item.equipment.name}</span>
                <span style={styles.bagItemSlot}>{SLOTS.find(s => s.key === `slot_${item.equipment.slot}`)?.icon} {item.equipment.slot}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>{selectedItem.equipment.name}</h3>
            <div style={styles.statsList}>
              {renderStats(selectedItem.equipment).map((stat, i) => (
                <p key={i} style={styles.statLine}>{stat}</p>
              ))}
              {renderStats(selectedItem.equipment).length === 0 && (
                <p style={styles.noStats}>Aucun bonus</p>
              )}
            </div>
            <button
              style={styles.equipBtn}
              onClick={() => equipItem(selectedItem.id, `slot_${selectedItem.equipment.slot}`)}
            >
              ✅ Équiper
            </button>
            <button style={styles.cancelBtn} onClick={() => setSelectedItem(null)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { background: '#0d0d1a', minHeight: '100vh', color: '#e0d5c5', padding: '20px', display: 'flex', flexDirection: 'column' },
  backBtn: { background: 'none', border: 'none', color: '#c9a84c', fontSize: '1rem', cursor: 'pointer', alignSelf: 'flex-start', marginBottom: '10px' },
  title: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.8rem', marginBottom: '20px', textAlign: 'center' },
  loading: { color: '#666', textAlign: 'center', marginTop: '40px' },
  section: { marginBottom: '24px' },
  sectionTitle: { color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' },
  slotsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  slotCard: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'default' },
  slotCardEquipped: { border: '1px solid #c9a84c', cursor: 'pointer' },
  slotIcon: { fontSize: '1.2rem' },
  slotLabel: { color: '#555', fontSize: '0.75rem' },
  slotItemName: { color: '#c9a84c', fontSize: '0.85rem', fontWeight: 'bold' },
  slotEmpty: { color: '#333', fontSize: '0.8rem', fontStyle: 'italic' },
  unequipHint: { color: '#555', fontSize: '0.7rem', fontStyle: 'italic' },
  bagGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  bagCard: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer' },
  bagCardSelected: { border: '1px solid #c9a84c' },
  bagItemName: { color: '#e0d5c5', fontSize: '0.9rem', fontWeight: 'bold' },
  bagItemSlot: { color: '#888', fontSize: '0.75rem' },
  empty: { color: '#555', fontStyle: 'italic', textAlign: 'center' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalContent: { background: '#111122', border: '1px solid #2a2a4a', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '340px' },
  modalTitle: { color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.3rem', marginBottom: '16px' },
  statsList: { marginBottom: '20px' },
  statLine: { color: '#ccc', fontSize: '0.85rem', margin: '4px 0' },
  noStats: { color: '#555', fontStyle: 'italic', fontSize: '0.85rem' },
  equipBtn: { background: '#c9a84c', color: '#0d0d1a', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', width: '100%', marginBottom: '8px' },
  cancelBtn: { background: 'none', border: '1px solid #444', color: '#888', borderRadius: '8px', padding: '10px', fontSize: '0.9rem', cursor: 'pointer', width: '100%' },
}

export default Equipment