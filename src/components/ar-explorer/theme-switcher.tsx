"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme()

  const handleThemeChange = (newTheme: string) => {
    const currentTheme = theme ?? 'system';
    const isDark = document.documentElement.classList.contains('dark');
    
    let themeClass = '';

    if (newTheme === 'light') {
      themeClass = 'light';
    } else if (newTheme === 'dark') {
      themeClass = 'dark';
    } else {
       const baseTheme = isDark ? 'dark' : 'light';
       themeClass = `${baseTheme} theme-${newTheme}`;
    }
    setTheme(newTheme)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            <span>Color Themes</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleThemeChange("blue")}>Blue</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange("green")}>Green</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange("orange")}>Orange</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange("red")}>Red</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
