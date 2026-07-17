import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import './styles/tier1-critical.css'
import './styles/tier2-atmosphere.css'
import './styles/tier3-polish.css'
import './styles/epic-features.css'
import './styles/ui-fixes.css'
import { TRPCProvider } from "@/providers/trpc"
import { MillasProvider } from "@/providers/MillasProvider"
import App from './App.tsx'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/game"
      signUpFallbackRedirectUrl="/game"
      allowedRedirectOrigins={[
        "https://la-mula-millonaria-production.up.railway.app",
        "http://localhost:5173",
      ]}
    >
      <TRPCProvider>
        <MillasProvider>
          <App />
        </MillasProvider>
      </TRPCProvider>
    </ClerkProvider>
  </BrowserRouter>,
)
