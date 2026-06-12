import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DesignParams, PatternType, SavedWork } from '../types'
import { THEMES } from '../themes/palettes'

interface DesignStore extends DesignParams {
  svgContent: string
  savedWorks: SavedWork[]
  setParam: <K extends keyof DesignParams>(key: K, value: DesignParams[K]) => void
  setPattern: (p: PatternType) => void
  setTheme: (id: string) => void
  randomSeed: () => void
  setSvgContent: (s: string) => void
  exportSvg: () => void
  exportPng: () => void
  saveCurrentWork: (name?: string) => Promise<void>
  deleteWork: (id: string) => void
  loadWork: (id: string) => void
  exportSavedWork: (id: string, format: 'svg' | 'png') => void
  renameWork: (id: string, name: string) => void
}

const generateThumbnail = (svgContent: string): Promise<string> => {
  return new Promise((resolve) => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = svgContent
    const svg = tempDiv.querySelector('svg')!
    const originalWidth = Number(svg.getAttribute('width'))
    const originalHeight = Number(svg.getAttribute('height'))
    const thumbWidth = 160
    const thumbHeight = (originalHeight / originalWidth) * thumbWidth
    svg.setAttribute('width', String(thumbWidth))
    svg.setAttribute('height', String(thumbHeight))
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = thumbWidth
    canvas.height = thumbHeight
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png', 0.8))
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  })
}

export const useDesignStore = create<DesignStore>()(
  persist(
    (set, get) => ({
      pattern: 'spiral',
      seed: 42,
      iterations: 200,
      scale: 1.0,
      rotation: 0,
      strokeWidth: 1.5,
      opacity: 0.8,
      bgColor: '#030712',
      palette: THEMES[0].colors,
      width: 800,
      height: 1000,
      svgContent: '',
      savedWorks: [],
      setParam: (key, value) => set({ [key]: value } as any),
      setPattern: (p) => set({ pattern: p }),
      setTheme: (id) => {
        const theme = THEMES.find(t => t.id === id)
        if (theme) set({ palette: theme.colors })
      },
      randomSeed: () => set({ seed: Math.floor(Math.random() * 99999) }),
      setSvgContent: (s) => set({ svgContent: s }),
      exportSvg: () => {
        const { svgContent } = get()
        const blob = new Blob([svgContent], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `art-${get().seed}.svg`; a.click()
        URL.revokeObjectURL(url)
      },
      exportPng: () => {
        const { svgContent, width, height } = get()
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')!
        const img = new Image()
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(svgBlob)
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
          URL.revokeObjectURL(url)
          canvas.toBlob(blob => {
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob!)
            a.download = `art-${get().seed}.png`; a.click()
          })
        }
        img.src = url
      },
      saveCurrentWork: async (name) => {
        const { svgContent, savedWorks, ...params } = get()
        if (!svgContent) return
        const thumbnail = await generateThumbnail(svgContent)
        const workName = name?.trim() || `作品 ${savedWorks.length + 1}`
        const newWork: SavedWork = {
          id: `work-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: workName,
          thumbnail,
          params,
          svgContent,
          createdAt: Date.now(),
        }
        set({ savedWorks: [newWork, ...savedWorks] })
      },
      deleteWork: (id) => {
        set({ savedWorks: get().savedWorks.filter(w => w.id !== id) })
      },
      loadWork: (id) => {
        const work = get().savedWorks.find(w => w.id === id)
        if (work) {
          set({ ...work.params, svgContent: work.svgContent })
        }
      },
      exportSavedWork: (id, format) => {
        const work = get().savedWorks.find(w => w.id === id)
        if (!work) return
        const { svgContent, params } = work
        if (format === 'svg') {
          const blob = new Blob([svgContent], { type: 'image/svg+xml' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = `${work.name}.svg`; a.click()
          URL.revokeObjectURL(url)
        } else {
          const canvas = document.createElement('canvas')
          canvas.width = params.width; canvas.height = params.height
          const ctx = canvas.getContext('2d')!
          const img = new Image()
          const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
          const url = URL.createObjectURL(svgBlob)
          img.onload = () => {
            ctx.drawImage(img, 0, 0)
            URL.revokeObjectURL(url)
            canvas.toBlob(blob => {
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob!)
              a.download = `${work.name}.png`; a.click()
            })
          }
          img.src = url
        }
      },
      renameWork: (id, name) => {
        set({
          savedWorks: get().savedWorks.map(w =>
            w.id === id ? { ...w, name: name.trim() || w.name } : w
          ),
        })
      },
    }),
    {
      name: 'design-store',
      partialize: (state) => ({ savedWorks: state.savedWorks }),
    }
  )
)
