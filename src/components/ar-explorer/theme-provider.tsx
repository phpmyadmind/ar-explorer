"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

const colorThemes = ["theme-blue", "theme-green", "theme-orange", "theme-red"];

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider 
            {...props}
            themes={[...colorThemes, "light", "dark"]}
            >
            {children}
          </NextThemesProvider>
}
