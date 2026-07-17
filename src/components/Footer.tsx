import { Truck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0D141C] border-t border-white/10 py-8 px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Truck size={20} className="text-[#F59E0B]" />
          <span className="font-fredoka font-bold text-lg text-white">La Mula Millonaria</span>
        </div>
        <p className="text-slate-400 text-xs mb-2">
          Toca tu tractomula, construye tu flota y convierte TicaMillas en premios reales.
        </p>
        <p className="text-slate-500 text-[10px]">
          2025 La Mula Millonaria. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
