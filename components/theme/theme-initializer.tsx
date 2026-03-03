'use client'

import { useEffect } from 'react'
import { applyTheme, getResolvedTheme } from '@/lib/theme/theme-manager'

export function ThemeInitializer() {
  useEffect(() => {
    applyTheme(getResolvedTheme())
  }, [])

  return null
}

