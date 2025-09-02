'use client'

import { motion } from 'framer-motion'
import { Character as CharacterType, getCharacterEvolutionStage } from '@/lib/characters'
import { CharacterPlaceholder } from '@/components/CharacterPlaceholder'

interface CharacterProps {
  character: CharacterType
  level: number
  exp: number
  isSelected?: boolean
  onClick?: () => void
  showDetails?: boolean
}

export default function Character({
  character,
  level,
  exp,
  isSelected = false,
  onClick,
  showDetails = true,
}: CharacterProps) {
  const evolutionStage = getCharacterEvolutionStage(character, level)
  const expProgress = Math.min(100, (exp % 100))

  return (
    <motion.div
      className={`relative ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
    >
      <div className={`relative ${isSelected ? 'character-glow' : ''}`}>
        <CharacterPlaceholder character={character.id} size={128} />

        {isSelected && (
          <motion.div
            className="absolute -top-2 -right-2 bg-accent text-white text-xs px-2 py-1 rounded-full"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            選択中
          </motion.div>
        )}
      </div>

      {showDetails && (
        <div className="mt-2 text-center">
          <h3 className="font-bold text-sm">{character.name}</h3>
          <p className="text-xs text-gray-600">Lv.{level} {evolutionStage.name}</p>
          
          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${expProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">EXP: {exp}</p>
        </div>
      )}
    </motion.div>
  )
}