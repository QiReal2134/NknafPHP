import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { performanceMonitor } from './utils/performanceMonitor'

// 初始化性能监控
performanceMonitor.initialize()

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
