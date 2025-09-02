'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CheckInContextType {
  currentCheckIn: any | null
  isCheckedIn: boolean
  venueMenus: any[]
  checkIn: (venueId: string, method?: string) => Promise<void>
  checkOut: () => Promise<void>
  refreshCheckIn: () => Promise<void>
}

const CheckInContext = createContext<CheckInContextType | undefined>(undefined)

export function CheckInProvider({ children }: { children: ReactNode }) {
  const [currentCheckIn, setCurrentCheckIn] = useState<any>(null)
  const [venueMenus, setVenueMenus] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    refreshCheckIn()
  }, [])

  const refreshCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCurrentCheckIn(null)
        return
      }

      // 現在のチェックイン状態を取得
      const { data: checkInData } = await supabase
        .from('check_ins')
        .select(`
          *,
          venue:venues(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (checkInData) {
        setCurrentCheckIn(checkInData)
        
        // 店舗メニューを取得
        const { data: menus } = await supabase
          .from('venue_menus')
          .select('*')
          .eq('venue_id', checkInData.venue_id)
          .eq('is_available', true)
          .order('product_name')

        setVenueMenus(menus || [])
      } else {
        setCurrentCheckIn(null)
        setVenueMenus([])
      }
    } catch (error) {
      // エラーは無視（チェックインしていない場合）
      setCurrentCheckIn(null)
      setVenueMenus([])
    }
  }

  const checkIn = async (venueId: string, method: string = 'manual') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .rpc('check_in_to_venue', {
        p_user_id: user.id,
        p_venue_id: venueId,
        p_method: method
      })

    if (error) throw error
    
    await refreshCheckIn()
  }

  const checkOut = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .rpc('check_out_from_venue', {
        p_user_id: user.id
      })

    if (error) throw error
    
    setCurrentCheckIn(null)
    setVenueMenus([])
  }

  return (
    <CheckInContext.Provider
      value={{
        currentCheckIn,
        isCheckedIn: !!currentCheckIn,
        venueMenus,
        checkIn,
        checkOut,
        refreshCheckIn
      }}
    >
      {children}
    </CheckInContext.Provider>
  )
}

export function useCheckIn() {
  const context = useContext(CheckInContext)
  if (context === undefined) {
    throw new Error('useCheckIn must be used within a CheckInProvider')
  }
  return context
}