'use client';

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { useReputation, useTrustScore, useArbiterInfo, useArbiterScore } from '@/hooks/useEscrowReads';
import { ESCROW_PROOF_ADDRESS, ESCROW_PROOF_ABI } from '@/config/contracts';
import { formatUSDC, shortenAddress } from '@/lib/utils';
import { formatEther } from 'viem';

function ScoreRing({ score, label }: { score: number; label: string }) {
  const pct = Math.min(score, 100);
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" className="transform -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute mt-8 text-2xl font-bold" style={{ color }}>{pct}</div>
      <div className="text-xs text-gray-500 mt-2">{label}</div>
    </div>
  );
}

export default function Reputation() {
  const { address } = useAccount();
  const [lookup, setLookup] = useState('');
  const target = (lookup.startsWith('0x') && lookup.length === 42 ? lookup : address) as `0x${string}` | undefined;

  const { data: reputation } = useReputation(target);
  const { data: trustScore } = useTrustScore(target);
  const { data: arbiterInfo } = useArbiterInfo(target);
  const { data: arbScore } = useArbiterScore(target);
  const { writeContract: joinPool } = useWriteContract();
  const { writeContract: leavePool } = useWriteContract();

  const isArbiter = arbiterInfo?.active ?? false;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-2">Reputation</h1>
        <p className="text-gray-500 text-sm">Look up any address&apos;s on-chain trust profile</p>
      </div>

      {/* Lookup */}
      <div>
        <input
          value={lookup}
          onChange={(e) => setLookup(e.target.value)}
          placeholder={address ? `${shortenAddress(address)} (your address)` : '0x... address to look up'}
          className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-cyan-500/50 focus:outline-none transition"
        />
      </div>

      {target && (
        <>
          {/* Scores */}
          <div className="glass-card rounded-xl p-8">
            <div className="flex justify-center gap-12 relative">
              <ScoreRing score={Number(trustScore ?? 0)} label="Trust Score" />
              <ScoreRing score={Number(arbScore ?? 0)} label="Arbiter Score" />
            </div>
          </div>

          {/* Reputation Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-5 text-center">
              <div className="text-2xl font-bold text-emerald-400">{reputation?.[0]?.toString() ?? '0'}</div>
              <div className="text-xs text-gray-500 mt-1">Completed</div>
            </div>
            <div className="glass-card rounded-xl p-5 text-center">
              <div className="text-2xl font-bold text-red-400">{reputation?.[1]?.toString() ?? '0'}</div>
              <div className="text-xs text-gray-500 mt-1">Disputed</div>
            </div>
            <div className="glass-card rounded-xl p-5 text-center">
              <div className="text-2xl font-bold gradient-text">
                {reputation ? formatUSDC(reputation[2]) : '0'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Volume (USDC)</div>
            </div>
          </div>

          {/* Arbiter Info */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Arbiter Profile</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Status</span>
                <div className={`mt-1 font-medium ${isArbiter ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {isArbiter ? 'Active' : 'Not in pool'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Stake</span>
                <div className="mt-1">{arbiterInfo ? formatEther(arbiterInfo.stake) + ' ETH' : '0'}</div>
              </div>
              <div>
                <span className="text-gray-500">Disputes Served</span>
                <div className="mt-1">{arbiterInfo?.disputesServed?.toString() ?? '0'}</div>
              </div>
              <div>
                <span className="text-gray-500">Missed</span>
                <div className="mt-1 text-amber-400">{arbiterInfo?.disputesMissed?.toString() ?? '0'}</div>
              </div>
              <div>
                <span className="text-gray-500">Overturned</span>
                <div className="mt-1 text-red-400">{arbiterInfo?.disputesOverturned?.toString() ?? '0'}</div>
              </div>
              <div>
                <span className="text-gray-500">Rewards Earned</span>
                <div className="mt-1 gradient-text">{arbiterInfo ? formatUSDC(arbiterInfo.rewardsEarned) + ' USDC' : '0'}</div>
              </div>
            </div>
          </div>

          {/* Join/Leave */}
          {address && target.toLowerCase() === address.toLowerCase() && (
            <div className="flex gap-3">
              {!isArbiter ? (
                <button
                  onClick={() =>
                    joinPool({
                      address: ESCROW_PROOF_ADDRESS,
                      abi: ESCROW_PROOF_ABI,
                      functionName: 'joinArbiterPool',
                    })
                  }
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold py-3 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition"
                >
                  Join Arbiter Pool
                </button>
              ) : (
                <button
                  onClick={() =>
                    leavePool({
                      address: ESCROW_PROOF_ADDRESS,
                      abi: ESCROW_PROOF_ABI,
                      functionName: 'leaveArbiterPool',
                    })
                  }
                  className="flex-1 border border-red-500/30 text-red-400 py-3 rounded-xl hover:bg-red-500/10 transition"
                >
                  Leave Pool
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
