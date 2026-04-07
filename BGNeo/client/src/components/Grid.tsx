import type { ReactNode } from 'react'
interface GridProps { children: ReactNode; cols?: number; gap?: number; className?: string }

export default function Grid({ children, cols = 3, gap = 20, className = '' }: GridProps) {
  return (
    <div className={`grid ${className}`}>
      {children}
      <style>{`
        .grid{display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap}px}
        @media(max-width:1024px){.grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:768px){.grid{grid-template-columns:1fr}}
      `}</style>
    </div>
  )
}
