import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import { MillasProvider } from "@/providers/MillasProvider"
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <TRPCProvider>
      <MillasProvider>
        <App />
      </MillasProvider>
    </TRPCProvider>
  </HashRouter>,
)
