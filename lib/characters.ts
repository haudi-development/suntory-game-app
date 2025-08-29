export interface Character {
  id: string
  name: string
  description: string
  type: string
  baseImage: string
  evolutionStages: {
    stage: number
    name: string
    image: string
    requiredLevel: number
  }[]
}

export const CHARACTERS: Character[] = [
  {
    id: 'premol',
    name: 'プレモルくん',
    description: '王冠を被った金色のビールグラス',
    type: 'beer',
    baseImage: '/characters/premol-1.png',
    evolutionStages: [
      { stage: 1, name: '銅の王冠', image: '/characters/premol-1.png', requiredLevel: 1 },
      { stage: 2, name: '銀の王冠', image: '/characters/premol-2.png', requiredLevel: 3 },
      { stage: 3, name: '金の王冠', image: '/characters/premol-3.png', requiredLevel: 5 },
      { stage: 4, name: 'プラチナ王冠', image: '/characters/premol-4.png', requiredLevel: 10 },
    ],
  },
  {
    id: 'kakuhai',
    name: '角ハイ坊や',
    description: '角瓶と炭酸の元気キャラ',
    type: 'highball',
    baseImage: '/characters/kakuhai-1.png',
    evolutionStages: [
      { stage: 1, name: 'ミニ角瓶', image: '/characters/kakuhai-1.png', requiredLevel: 1 },
      { stage: 2, name: '通常サイズ', image: '/characters/kakuhai-2.png', requiredLevel: 3 },
      { stage: 3, name: 'メガジョッキ', image: '/characters/kakuhai-3.png', requiredLevel: 5 },
      { stage: 4, name: '伝説の角瓶', image: '/characters/kakuhai-4.png', requiredLevel: 10 },
    ],
  },
  {
    id: 'sui',
    name: '翠ジン妖精',
    description: '翡翠色の爽やかな妖精',
    type: 'gin',
    baseImage: '/characters/sui-1.png',
    evolutionStages: [
      { stage: 1, name: '種', image: '/characters/sui-1.png', requiredLevel: 1 },
      { stage: 2, name: '芽', image: '/characters/sui-2.png', requiredLevel: 3 },
      { stage: 3, name: '花', image: '/characters/sui-3.png', requiredLevel: 5 },
      { stage: 4, name: '翡翠の木', image: '/characters/sui-4.png', requiredLevel: 10 },
    ],
  },
  {
    id: 'lemon',
    name: 'レモンサワー兄弟',
    description: 'レモンの双子キャラ',
    type: 'sour',
    baseImage: '/characters/lemon-1.png',
    evolutionStages: [
      { stage: 1, name: '小レモン', image: '/characters/lemon-1.png', requiredLevel: 1 },
      { stage: 2, name: '氷入り', image: '/characters/lemon-2.png', requiredLevel: 3 },
      { stage: 3, name: '凍結ジョッキ', image: '/characters/lemon-3.png', requiredLevel: 5 },
      { stage: 4, name: '極冷', image: '/characters/lemon-4.png', requiredLevel: 10 },
    ],
  },
  {
    id: 'allfree',
    name: 'オールフリー先生',
    description: '健康的なノンアルキャラ',
    type: 'non_alcohol',
    baseImage: '/characters/allfree-1.png',
    evolutionStages: [
      { stage: 1, name: '新人', image: '/characters/allfree-1.png', requiredLevel: 1 },
      { stage: 2, name: '先生', image: '/characters/allfree-2.png', requiredLevel: 3 },
      { stage: 3, name: '博士', image: '/characters/allfree-3.png', requiredLevel: 5 },
      { stage: 4, name: '賢者', image: '/characters/allfree-4.png', requiredLevel: 10 },
    ],
  },
  {
    id: 'water',
    name: '天然水スピリット',
    description: '透明な水の精霊',
    type: 'water',
    baseImage: '/characters/water-1.png',
    evolutionStages: [
      { stage: 1, name: '雫', image: '/characters/water-1.png', requiredLevel: 1 },
      { stage: 2, name: '泉', image: '/characters/water-2.png', requiredLevel: 3 },
      { stage: 3, name: '滝', image: '/characters/water-3.png', requiredLevel: 5 },
      { stage: 4, name: '海', image: '/characters/water-4.png', requiredLevel: 10 },
    ],
  },
]

export function getCharacterById(id: string): Character | undefined {
  return CHARACTERS.find(char => char.id === id)
}

export function getCharacterEvolutionStage(character: Character, level: number) {
  const stages = character.evolutionStages.sort((a, b) => b.requiredLevel - a.requiredLevel)
  return stages.find(stage => level >= stage.requiredLevel) || stages[0]
}

export function calculateExpForNextLevel(currentLevel: number): number {
  return currentLevel * 100
}

export function getExpProgress(currentExp: number, currentLevel: number): number {
  const expForCurrentLevel = (currentLevel - 1) * 100
  const expForNextLevel = currentLevel * 100
  const progressExp = currentExp - expForCurrentLevel
  const requiredExp = expForNextLevel - expForCurrentLevel
  return (progressExp / requiredExp) * 100
}