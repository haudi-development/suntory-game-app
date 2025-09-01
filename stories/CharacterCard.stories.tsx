import type { Meta, StoryObj } from '@storybook/react'
import { motion } from 'framer-motion'

const CharacterCard = ({
  character,
  level = 1,
  exp = 0,
  isSelected = false,
  isLocked = false,
  onClick
}: {
  character: {
    id: string
    name: string
    type: string
    image: string
  }
  level?: number
  exp?: number
  isSelected?: boolean
  isLocked?: boolean
  onClick?: () => void
}) => {
  const maxExp = level * 100

  return (
    <motion.div
      whileHover={{ scale: isLocked ? 1 : 1.05 }}
      whileTap={{ scale: isLocked ? 1 : 0.95 }}
      className={`relative bg-white rounded-xl shadow-lg p-4 cursor-pointer transition-all ${
        isSelected ? 'ring-4 ring-primary' : ''
      } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={!isLocked ? onClick : undefined}
    >
      {isLocked && (
        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
          <div className="text-white text-center">
            <span className="text-2xl">🔒</span>
            <p className="text-sm mt-1">未解放</p>
          </div>
        </div>
      )}
      
      <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg mb-3 flex items-center justify-center">
        <span className="text-4xl">{character.image}</span>
      </div>
      
      <h3 className="font-bold text-gray-900 text-center mb-1">
        {character.name}
      </h3>
      
      <div className="text-center mb-2">
        <span className="text-sm text-gray-600">Lv.</span>
        <span className="text-xl font-bold text-primary ml-1">{level}</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>EXP</span>
          <span>{exp}/{maxExp}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all"
            style={{ width: `${(exp / maxExp) * 100}%` }}
          />
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center">
          <span className="text-xs">✓</span>
        </div>
      )}
    </motion.div>
  )
}

const meta: Meta<typeof CharacterCard> = {
  title: 'Game/CharacterCard',
  component: CharacterCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: { type: 'range', min: 1, max: 10 },
    },
    exp: {
      control: { type: 'range', min: 0, max: 1000 },
    },
    isSelected: {
      control: 'boolean',
    },
    isLocked: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    character: {
      id: '1',
      name: 'プレモルくん',
      type: 'beer',
      image: '🍺',
    },
    level: 3,
    exp: 150,
  },
}

export const Selected: Story = {
  args: {
    character: {
      id: '2',
      name: '角ハイ坊や',
      type: 'highball',
      image: '🥃',
    },
    level: 5,
    exp: 320,
    isSelected: true,
  },
}

export const Locked: Story = {
  args: {
    character: {
      id: '3',
      name: '翠ジン妖精',
      type: 'gin',
      image: '🍸',
    },
    isLocked: true,
  },
}

export const MaxLevel: Story = {
  args: {
    character: {
      id: '4',
      name: 'レモンサワー兄弟',
      type: 'sour',
      image: '🍋',
    },
    level: 10,
    exp: 1000,
  },
}