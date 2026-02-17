'use client';

import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { ESCROW_PROOF_ADDRESS, ESCROW_PROOF_ABI } from '@/config/contracts';

const BASESCAN = 'https://sepolia.basescan.org';
const GITHUB = 'https://github.com/afafw/usdc-hackathon-smartcontract-arb';
const CONTRACT = ESCROW_PROOF_ADDRESS;

const STEPS = [
  {
    num: '01',
    icon: '📝',
    title: 'Create Escrow',
    desc: 'Deposit USDC with milestone-based payment schedule',
  },
  {
    num: '02',
    icon: '🔍',
    title: 'Submit Proof',
    desc: 'Worker submits proof hash for each completed milestone',
  },
  {
    num: '03',
    icon: '⏳',
    title: 'Challenge Window',
    desc: 'Time window for payer to dispute before auto-release',
  },
  {
    num: '04',
    icon: '✅',
    title: 'Release / Dispute',
    desc: 'Funds release automatically or enter arbitration',
  },
  {
    num: '05',
    icon: '⚖️',
    title: 'Commit-Reveal Vote',
    desc: 'Reputation-gated arbiters resolve disputes fairly',
  },
];

const FEATURES = [
  {
    icon: '🎯',
    title: 'Milestone Payments',
    desc: 'Split escrows into granular milestones with individual proof requirements and independent release.',
  },
  {
    icon: '🔐',
    title: 'Commit-Reveal Voting',
    desc: 'Tamper-proof arbitration: arbiters commit vote hashes before revealing, preventing collusion.',
  },
  {
    icon: '💎',
    title: 'Dispute Bonds',
    desc: '3% bond requirement prevents frivolous challenges. Winners get their bond back.',
  },
  {
    icon: '🏛️',
    title: 'Reputation-Gated Arbiters',
    desc: 'Only agents with proven track records (trust score ≥ 30 or ≥ 3 completed) can arbitrate.',
  },
  {
    icon: '📏',
    title: 'Soft-Spec Rubrics',
    desc: 'Convert subjective deliverables into scored criteria with off-chain proof bundles anchored by hash.',
  },
  {
    icon: '🤖',
    title: 'Agent-Native',
    desc: 'Built for the agentic economy — autonomous agents can create, prove, and arbitrate escrows.',
  },
];

function LiveStats() {
  const { data: nextId } = useReadContract({
    address: ESCROW_PROOF_ADDRESS,
    abi: ESCROW_PROOF_ABI,
    functionName: 'nextEscrowId',
  });
  const { data: poolSize } = useReadContract({
    address: ESCROW_PROOF_ADDRESS,
    abi: ESCROW_PROOF_ABI,
    functionName: 'getPoolSize',
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total Escrows', value: nextId?.toString() ?? '—' },
        { label: 'Arbiter Pool', value: poolSize?.toString() ?? '—' },
        { label: 'Network', value: 'Base Sepolia' },
        { label: 'Token', value: 'USDC' },
      ].map((s) => (
        <div key={s.label} className="glass-card rounded-xl p-5 text-center glow-hover transition-all duration-300">
          <div className="text-2xl font-bold gradient-text">{s.value}</div>
          <div className="text-sm text-gray-500 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold gradient-text">
            EscrowProof
          </Link>
          <div className="flex items-center gap-6">
            <a href={GITHUB} target="_blank" className="text-sm text-gray-400 hover:text-white transition hidden md:block">
              GitHub
            </a>
            <a
              href={`${BASESCAN}/address/${CONTRACT}`}
              target="_blank"
              className="text-sm text-gray-400 hover:text-white transition hidden md:block"
            >
              Contract
            </a>
            <Link
              href="/app"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-5 py-2 rounded-lg transition-all duration-200 text-sm"
            >
              Launch App →
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Live on Base Sepolia
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="gradient-text">Trustless Escrow</span>
            <br />
            <span className="text-gray-300">for the Agentic Economy</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Milestone-based USDC escrow with commit-reveal arbitration, dispute bonds,
            and on-chain reputation. Built for agents and humans alike.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/app"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-cyan-500/25"
            >
              Launch App →
            </Link>
            <a
              href={GITHUB}
              target="_blank"
              className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3.5 rounded-xl transition-all duration-200 text-lg"
            >
              View Source
            </a>
          </div>
        </section>

        {/* Live Stats */}
        <section className="pb-20">
          <LiveStats />
        </section>

        {/* How it works */}
        <section className="pb-24">
          <h2 className="text-3xl font-bold text-center mb-4">
            <span className="gradient-text">How It Works</span>
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">
            Five steps from deposit to resolution. Fully on-chain, fully transparent.
          </p>
          <div className="grid md:grid-cols-5 gap-4">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-6 text-center glow-hover transition-all duration-300 group animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{s.icon}</div>
                <div className="text-xs text-cyan-500 font-mono mb-2">{s.num}</div>
                <div className="font-semibold text-sm mb-2">{s.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="pb-24">
          <h2 className="text-3xl font-bold text-center mb-4">
            <span className="gradient-text">Features</span>
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">
            Every mechanism designed to align incentives and minimize trust.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-6 glow-hover transition-all duration-300 group animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contract Info */}
        <section className="pb-24">
          <div className="glass-card rounded-2xl p-8 glow">
            <h2 className="text-2xl font-bold mb-6 gradient-text">Verified on Base Sepolia</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Contract Address</span>
                <a
                  href={`${BASESCAN}/address/${CONTRACT}`}
                  target="_blank"
                  className="block text-cyan-400 font-mono text-sm hover:underline break-all mt-1"
                >
                  {CONTRACT}
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-white/5">
                {[
                  { label: 'Create Escrow', hash: '0x991a3b694e2d3c9f8476fb3af41a75e04e34adce241c18f7378b62932732ef15' },
                  { label: 'Submit Proof', hash: '0x9698617b037d6aea2490e655b1fb2f83e98f20672ac1a4e44e9c0b3d66612303' },
                  { label: 'Release Funds', hash: '0x2b77161f28c849e26de4c6a3e6ff51e11af7dcbf876e7f72f49b2289fe763adc' },
                ].map((tx) => (
                  <a
                    key={tx.hash}
                    href={`${BASESCAN}/tx/${tx.hash}`}
                    target="_blank"
                    className="glass-card rounded-lg p-4 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="text-sm font-medium mb-1">{tx.label}</div>
                    <div className="text-xs text-cyan-400/70 font-mono">{tx.hash.slice(0, 14)}…</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 text-center">
          <div className="glass-card rounded-2xl p-12 glow">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Create your first milestone-based escrow in minutes. Connect your wallet and go.
            </p>
            <Link
              href="/app"
              className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-semibold px-10 py-4 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-cyan-500/25"
            >
              Launch App →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <span className="gradient-text font-semibold">EscrowProof v3.1</span>
          <div className="flex gap-6">
            <a href={GITHUB} target="_blank" className="hover:text-gray-400 transition">
              GitHub
            </a>
            <a href={`${BASESCAN}/address/${CONTRACT}`} target="_blank" className="hover:text-gray-400 transition">
              BaseScan
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
