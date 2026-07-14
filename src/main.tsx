import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import { MillasProvider } from "@/providers/MillasProvider"
import App from './App.tsx'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
      <TRPCProvider>
        <MillasProvider>
          <App />
        </MillasProvider>
      </TRPCProvider>
    </ClerkProvider>
  </HashRouter>,
)
