'use client'

interface CharacterPlaceholderProps {
  character: string
  size?: number
}

const characterEmojis: Record<string, string> = {
  premol: '🍺',
  kakuhai: '🥃',
  midori: '🍸',
  lemon: '🍋',
  allfree: '🍻',
  tennensui: '💧',
}

const characterColors: Record<string, string> = {
  premol: 'from-yellow-400 to-amber-600',
  kakuhai: 'from-amber-500 to-amber-700',
  midori: 'from-green-400 to-green-600',
  lemon: 'from-yellow-300 to-yellow-500',
  allfree: 'from-blue-300 to-blue-500',
  tennensui: 'from-cyan-300 to-cyan-500',
}

export function CharacterPlaceholder({ character, size = 80 }: CharacterPlaceholderProps) {
  const emoji = characterEmojis[character] || '🎮'
  const gradient = characterColors[character] || 'from-gray-400 to-gray-600'
  
  return (
    <div 
      className={`relative bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center shadow-lg`}
      style={{ width: size, height: size }}
    >
      <span className="text-white" style={{ fontSize: size * 0.5 }}>{emoji}</span>
      <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-pulse" />
    </div>
  )
}