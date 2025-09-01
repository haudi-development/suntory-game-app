import type { Meta, StoryObj } from '@storybook/react'

const Button = ({ 
  children, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick 
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  onClick?: () => void
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2'
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
  }
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  }
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
}

export const Danger: Story = {
  args: {
    children: 'Danger Button',
    variant: 'danger',
  },
}

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'small',
  },
}

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'large',
  },
}

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
}