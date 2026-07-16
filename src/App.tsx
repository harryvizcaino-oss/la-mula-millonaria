import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/Layout'
import Home from './pages/Home'
import Game from './pages/Game'

import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import Redemption from './pages/Redemption'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import Garage from './pages/Garage'
import Brands from './pages/Brands'
import Login from "./pages/Login"
import Register from "./pages/Register"
import NotFound from "./pages/NotFound"
import { ClickerEngine } from './components/ClickerEngine'
import { useClickerSync } from './hooks/useClickerSync'

function ClickerSync() {
  useClickerSync()
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.985 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen"
      >
        <Routes location={location}>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<Game />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/garage" element={<Garage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/redemption" element={<Redemption />} />
            <Route path="/brands" element={<Brands />} />
          </Route>
          <Route path="/login/*" element={<Login />} />
          <Route path="/register/*" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <>
      <ClickerEngine />
      <ClickerSync />
      <AnimatedRoutes />
    </>
  )
}
