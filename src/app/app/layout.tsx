'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const NAV = [
  { href: '/app', label: 'Dashboard' },
  { href: '/app/create', label: 'Create' },
  { href: '/app/reputation', label: 'Reputation' },
  { href: '/app/arbiters', label: 'Arbiters' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-400 text-xs text-center py-1.5">
        🧪 Testnet MVP — You are using Base Sepolia. No real funds involved.
      </div>
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-lg font-bold gradient-text">
              EscrowProof
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                    pathname === n.href
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
          <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
