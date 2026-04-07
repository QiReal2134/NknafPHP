import type { ReactNode } from 'react'
interface ContainerProps { children: ReactNode; className?: string }

export default function Container({ children, className = '' }: ContainerProps) {
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
