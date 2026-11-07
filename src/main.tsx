import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { IntroGate } from './components/IntroGate.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IntroGate>
      <App />
    </IntroGate>
  </StrictMode>,
)
