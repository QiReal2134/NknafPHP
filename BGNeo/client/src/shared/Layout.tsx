import type { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
}

interface GridProps {
  children: ReactNode
  cols?: number
  gap?: number
  className?: string
}

export function Container({ children, className = '' }: ContainerProps) {
  return (
    <div className={`container ${className}`}>
      {children}
      <style>{`
        .container{max-width:1200px;margin:0 auto;padding-left:20px;padding-right:20px}
        @media(min-width:768px){.container{padding-left:40px;padding-right:40px}}
      `}</style>
    </div>
  )
}

export function Grid({ children, cols = 3, gap = 20, className = '' }: GridProps) {
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

export default { Container, Grid }
