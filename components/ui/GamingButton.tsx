'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GamingButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'success' | 'gold' | 'danger' | 'purple'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  disabled?: boolean
  pulse?: boolean
  glow?: boolean
  className?: string
}

export function GamingButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  pulse = false,
  glow = false,
  className = ''
}: GamingButtonProps) {
  const gradients = {
    primary: 'linear-gradient(135deg, #6DCFF6 0%, #0099DA 100%)',
    success: 'linear-gradient(135deg, #00D9A3 0%, #00B894 100%)',
    gold: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    danger: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  }

  const shadows = {
    primary: '0 10px 30px rgba(109, 207, 246, 0.4)',
    success: '0 10px 30px rgba(0, 217, 163, 0.4)',
    gold: '0 10px 30px rgba(255, 215, 0, 0.4)',
    danger: '0 10px 30px rgba(255, 107, 157, 0.4)',
    purple: '0 10px 30px rgba(102, 126, 234, 0.4)'
  }

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={`
        relative overflow-hidden rounded-2xl font-bold text-white
        transition-all duration-300 
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${pulse ? 'pulse' : ''}
        ${glow ? 'glow' : ''}
        ${className}
      `}
      style={{
        background: disabled ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)' : gradients[variant],
        boxShadow: disabled ? 'none' : shadows[variant]
      }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      
      {/* キラキラエフェクト */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 opacity-0 hover:opacity-100"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          }}
        />
      )}
      
      {/* パルスエフェクト */}
      {pulse && !disabled && (
        <div className="absolute inset-0 rounded-2xl animate-ping opacity-75" 
          style={{ background: gradients[variant] }}
        />
      )}
    </motion.button>
  )
}