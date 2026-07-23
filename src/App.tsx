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
import SeasonPass from './pages/SeasonPass'
import Garage from './pages/Garage'
import Brands from './pages/Brands'
import Login from "./pages/Login"
import Register from "./pages/Register"
import AuthCallback from "./pages/AuthCallback"
import NotFound from "./pages/NotFound"
import { ClickerEngine } from './components/ClickerEngine'
import { useClickerSync } from './hooks/useClickerSync'
import { useSeasonSync } from './hooks/useSeasonSync'

function ClickerSync() {
  useClickerSync()
  return null
}

function SeasonSync() {
  useSeasonSync()
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen"
      >
        <Routes location={location}>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<Game />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/season" element={<SeasonPass />} />
            <Route path="/garage" element={<Garage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/redemption" element={<Redemption />} />
            <Route path="/brands" element={<Brands />} />
          </Route>
          <Route path="/login/*" element={<Login />} />
          <Route path="/register/*" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
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
      <SeasonSync />
      <AnimatedRoutes />
    </>
  )
}
