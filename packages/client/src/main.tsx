import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App.js'
import './styles.css'

const host = document.getElementById('root')
if (!host) throw new Error('No #root element.')

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
