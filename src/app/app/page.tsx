'use client';

import { useAccount, useReadContract } from 'wagmi';
import { ESCROW_PROOF_ADDRESS, ESCROW_PROOF_ABI } from '@/config/contracts';
import { useNextEscrowId, useReputation, useTrustScore } from '@/hooks/useEscrowReads';
import { formatUSDC, shortenAddress } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';

interface EscrowData {
  id: bigint;
  payer: string;
  beneficiary: string;
  totalAmount: bigint;
  milestoneCount: number;
  disputed: boolean;
  closed: boolean;
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass-card rounded-xl p-5 glow-hover transition-all duration-300">
      <div className={`text-2xl font-bold ${accent ? 'gradient-text' : 'text-white'}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function EscrowRow({ e }: { e: EscrowData }) {
  const status = e.closed ? 'Closed' : e.disputed ? 'Disputed' : 'Active';
  const statusColor = e.closed
    ? 'text-gray-400 bg-gray-400/10'
    : e.disputed
    ? 'text-red-400 bg-red-400/10'
    : 'text-emerald-400 bg-emerald-400/10';

  return (
    <Link
      href={`/app/escrow/${e.id.toString()}`}
      className="glass-card rounded-xl p-5 glow-hover transition-all duration-300 block group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-mono text-cyan-400">Escrow #{e.id.toString()}</span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor}`}>{status}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">Payer</span>
          <div className="font-mono text-xs mt-0.5">{shortenAddress(e.payer)}</div>
        </div>
        <div>
          <span className="text-gray-500">Beneficiary</span>
          <div className="font-mono text-xs mt-0.5">{shortenAddress(e.beneficiary)}</div>
        </div>
        <div>
          <span className="text-gray-500">Amount</span>
          <div className="mt-0.5 font-semibold">{formatUSDC(e.totalAmount)} USDC</div>
        </div>
        <div>
          <span className="text-gray-500">Milestones</span>
          <div className="mt-0.5">{e.milestoneCount}</div>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { data: nextId } = useNextEscrowId();
  const { data: reputation } = useReputation(address);
  const { data: trustScoreData } = useTrustScore(address);
  const publicClient = usePublicClient();
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address || !nextId || !publicClient) return;
    const load = async () => {
      setLoading(true);
      const results: EscrowData[] = [];
      const total = Number(nextId);
      for (let i = 0; i < total; i++) {
        try {
          const data = await publicClient.readContract({
            address: ESCROW_PROOF_ADDRESS,
            abi: ESCROW_PROOF_ABI,
            functionName: 'escrows',
            args: [BigInt(i)],
          });
          const [token, payer, beneficiary, totalAmount, challengeWindow, voteDeadline, milestoneCount, disputed, closed] = data as [string, string, string, bigint, bigint, bigint, number, boolean, boolean, number, number, bigint];
          if (
            payer.toLowerCase() === address.toLowerCase() ||
            beneficiary.toLowerCase() === address.toLowerCase()
          ) {
            results.push({
              id: BigInt(i),
              payer,
              beneficiary,
              totalAmount,
              milestoneCount,
              disputed,
              closed,
            });
          }
        } catch {}
      }
      setEscrows(results);
      setLoading(false);
    };
    load();
  }, [address, nextId, publicClient]);

  const active = escrows.filter((e) => !e.closed && !e.disputed).length;
  const disputed = escrows.filter((e) => e.disputed).length;
  const completed = escrows.filter((e) => e.closed).length;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-6">🔗</div>
        <h1 className="text-3xl font-bold mb-3">Connect Your Wallet</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          Connect your wallet to view your escrows, create new ones, and manage disputes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Your escrow overview</p>
        </div>
        <Link
          href="/app/create"
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 text-sm"
        >
          + Create Escrow
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Trust Score" value={trustScoreData?.toString() ?? '0'} accent />
        <StatCard label="Total Volume" value={reputation ? `${formatUSDC(reputation[2])} USDC` : '0 USDC'} />
        <StatCard label="Active" value={active.toString()} />
        <StatCard label="Completed" value={completed.toString()} />
        <StatCard label="Disputed" value={disputed.toString()} />
      </div>

      {/* Escrow List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Escrows</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading escrows…</div>
        ) : escrows.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-400 mb-4">No escrows found</p>
            <Link href="/app/create" className="text-cyan-400 hover:underline text-sm">
              Create your first escrow →
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {escrows.map((e) => (
              <EscrowRow key={e.id.toString()} e={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
