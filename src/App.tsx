import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Game from './pages/Game'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import Redemption from './pages/Redemption'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import Garage from './pages/Garage'
import Brands from './pages/Brands'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import { ClickerEngine } from './components/ClickerEngine'

export default function App() {
  return (
    <>
      <ClickerEngine />
      <Routes>
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
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}
