import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/tier1-critical.css'
import './styles/tier2-atmosphere.css'
import './styles/tier3-polish.css'
import './styles/epic-features.css'
import './styles/ui-fixes.css'
import { TRPCProvider } from "@/providers/trpc"
import { MillasProvider } from "@/providers/MillasProvider"
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <TRPCProvider>
      <MillasProvider>
        <App />
      </MillasProvider>
    </TRPCProvider>
  </BrowserRouter>,
)
