"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

const colorThemes = ["blue", "green", "orange", "red"];

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider 
            {...props}
            themes={[...colorThemes, "light", "dark"]}
            >
            {children}
          </NextThemesProvider>
}
