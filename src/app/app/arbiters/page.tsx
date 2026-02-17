'use client';

import { useEffect, useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { usePoolSize, usePoolThresholds, useArbiterInfo } from '@/hooks/useEscrowReads';
import { ESCROW_PROOF_ADDRESS, ESCROW_PROOF_ABI } from '@/config/contracts';
import { shortenAddress } from '@/lib/utils';
import { formatEther } from 'viem';

interface ArbiterRow {
  address: string;
  stake: bigint;
  disputesServed: bigint;
  disputesMissed: bigint;
  active: boolean;
}

export default function ArbitersPage() {
  const { address } = useAccount();
  const { data: poolSize } = usePoolSize();
  const { data: thresholds } = usePoolThresholds();
  const { data: myInfo } = useArbiterInfo(address);
  const publicClient = usePublicClient();
  const { writeContract } = useWriteContract();
  const [arbiters, setArbiters] = useState<ArbiterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');

  const minTrust = thresholds?.[0]?.result as bigint | undefined;
  const minCompleted = thresholds?.[1]?.result as bigint | undefined;
  const isArbiter = myInfo?.active ?? false;

  useEffect(() => {
    if (!poolSize || !publicClient) return;
    const load = async () => {
      setLoading(true);
      const results: ArbiterRow[] = [];
      const size = Number(poolSize);
      for (let i = 0; i < size; i++) {
        try {
          const addr = await publicClient.readContract({
            address: ESCROW_PROOF_ADDRESS,
            abi: ESCROW_PROOF_ABI,
            functionName: 'arbiterPool',
            args: [BigInt(i)],
          });
          const info = await publicClient.readContract({
            address: ESCROW_PROOF_ADDRESS,
            abi: ESCROW_PROOF_ABI,
            functionName: 'getArbiterInfo',
            args: [addr as `0x${string}`],
          });
          const i2 = info as { stake: bigint; disputesServed: bigint; disputesMissed: bigint; active: boolean };
          results.push({
            address: addr as string,
            stake: i2.stake,
            disputesServed: i2.disputesServed,
            disputesMissed: i2.disputesMissed,
            active: i2.active,
          });
        } catch {}
      }
      setArbiters(results);
      setLoading(false);
    };
    load();
  }, [poolSize, publicClient]);

  const handleJoin = () => {
    writeContract({
      address: ESCROW_PROOF_ADDRESS,
      abi: ESCROW_PROOF_ABI,
      functionName: 'joinArbiterPool',
      value: stakeAmount ? BigInt(Math.floor(parseFloat(stakeAmount) * 1e18)) : BigInt(0),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-2">Arbiter Pool</h1>
        <p className="text-gray-500 text-sm">Reputation-gated dispute resolution network</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 text-center">
          <div className="text-2xl font-bold gradient-text">{poolSize?.toString() ?? '—'}</div>
          <div className="text-xs text-gray-500 mt-1">Pool Size</div>
        </div>
        <div className="glass-card rounded-xl p-5 text-center">
          <div className="text-2xl font-bold text-cyan-400">{minTrust?.toString() ?? '30'}</div>
          <div className="text-xs text-gray-500 mt-1">Min Trust Score</div>
        </div>
        <div className="glass-card rounded-xl p-5 text-center">
          <div className="text-2xl font-bold text-blue-400">{minCompleted?.toString() ?? '3'}</div>
          <div className="text-xs text-gray-500 mt-1">Min Completed</div>
        </div>
        <div className="glass-card rounded-xl p-5 text-center">
          <div className={`text-2xl font-bold ${isArbiter ? 'text-emerald-400' : 'text-gray-400'}`}>
            {isArbiter ? '✓' : '✗'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Your Status</div>
        </div>
      </div>

      {/* Join */}
      {address && !isArbiter && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold mb-3">Join the Pool</h3>
          <p className="text-sm text-gray-400 mb-4">
            Requires trust score ≥ {minTrust?.toString() ?? '30'} OR ≥ {minCompleted?.toString() ?? '3'} completed escrows.
            Optionally stake ETH for extra credibility.
          </p>
          <div className="flex gap-3">
            <input
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Optional stake (ETH)"
              className="flex-1 bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:outline-none transition"
            />
            <button
              onClick={handleJoin}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold px-6 py-3 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition"
            >
              Join Pool
            </button>
          </div>
        </div>
      )}

      {/* Pool Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-semibold">Active Arbiters</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : arbiters.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No arbiters in pool yet</div>
        ) : (
          <div className="divide-y divide-white/5">
            {arbiters.map((a) => (
              <div key={a.address} className="px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${a.active ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                  <span className="font-mono text-sm">
                    {shortenAddress(a.address)}
                    {a.address.toLowerCase() === address?.toLowerCase() && (
                      <span className="text-cyan-400 ml-2 text-xs">(you)</span>
                    )}
                  </span>
                </div>
                <div className="flex gap-6 text-sm text-gray-400">
                  <span>{formatEther(a.stake)} ETH</span>
                  <span className="text-emerald-400">{a.disputesServed.toString()} served</span>
                  <span className="text-amber-400">{a.disputesMissed.toString()} missed</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
