// Configuration centrale du jeu — ajuste ces valeurs facilement
export const gameConfig = {
  dungeon: {
    deathLootLossPercent: 0.5, // % du loot perdu à la mort (0.5 = 50%)
    difficultyScalingPerFloor: 1.3, // multiplicateur de difficulté par étage
  },
  classBonus: {
    guerrier: { damageReduction: 0.2 },
    voleur: { damageMultiplier: 1.5 },
    alchimiste: { lootBonus: 0.2 },
  },
}