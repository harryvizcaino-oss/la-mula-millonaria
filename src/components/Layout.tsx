import { Outlet } from 'react-router-dom';
import TopAppBar from './TopAppBar';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto relative bg-white">
      {/* Top App Bar */}
      <TopAppBar transparent />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 relative flex flex-col">
          <Outlet />
        </div>
        {/* Bottom Navigation */}
        <Navbar />
      </main>
    </div>
  );
}
