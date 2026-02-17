'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { usePublicClient } from 'wagmi';
import { useEffect } from 'react';
import { keccak256, encodePacked, toHex, parseUnits } from 'viem';
import {
  ESCROW_PROOF_ADDRESS,
  ESCROW_PROOF_ABI,
  USDC_ADDRESS,
  USDC_ABI,
} from '@/config/contracts';
import { useEscrow, useSelectedArbiters, useVoteCounts } from '@/hooks/useEscrowReads';
import { formatUSDC, shortenAddress, getMilestoneStatus, STATUS_COLORS, formatDuration } from '@/lib/utils';

interface MilestoneData {
  amount: bigint;
  proofHash: `0x${string}`;
  proofBundleHash: `0x${string}`;
  proofAt: bigint;
  disputedAt: bigint;
  challenger: string;
  released: boolean;
  refunded: boolean;
}

function MilestoneCard({
  m,
  idx,
  escrowId,
  isPayer,
  isBeneficiary,
  challengeWindow,
  disputed,
}: {
  m: MilestoneData;
  idx: number;
  escrowId: bigint;
  isPayer: boolean;
  isBeneficiary: boolean;
  challengeWindow: bigint;
  disputed: boolean;
}) {
  const status = getMilestoneStatus(m);
  const [proofText, setProofText] = useState('');
  const [bundleText, setBundleText] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [commitDecision, setCommitDecision] = useState(true);
  const [commitSalt, setCommitSalt] = useState('');
  const [revealDecision, setRevealDecision] = useState(true);
  const [revealSalt, setRevealSalt] = useState('');
  const { writeContract } = useWriteContract();
  const { data: voteData } = useVoteCounts(escrowId, idx);
  const now = BigInt(Math.floor(Date.now() / 1000));
  const windowEnd = m.proofAt > 0n ? m.proofAt + challengeWindow : 0n;
  const canChallenge = m.proofAt > 0n && now <= windowEnd && !disputed;
  const canRelease = m.proofAt > 0n && now > windowEnd && !disputed;

  const releaseVotes = voteData?.[0]?.result as number | undefined;
  const refundVotes = voteData?.[1]?.result as number | undefined;

  const submitProof = () => {
    const hash = keccak256(encodePacked(['string'], [proofText]));
    writeContract({
      address: ESCROW_PROOF_ADDRESS,
      abi: ESCROW_PROOF_ABI,
      functionName: 'submitProof',
      args: [escrowId, idx, hash],
    });
  };

  const anchorBundle = () => {
    const hash = keccak256(encodePacked(['string'], [bundleText]));
    writeContract({
      address: ESCROW_PROOF_ADDRESS,
      abi: ESCROW_PROOF_ABI,
      functionName: 'anchorProofBundle',
      args: [escrowId, idx, hash],
    });
  };

  const challenge = () => {
    // First approve bond
    const bondAmount = (m.amount * 300n) / 10000n || 1n;
    writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [ESCROW_PROOF_ADDRESS, bondAmount],
    });
    setTimeout(() => {
      const hash = keccak256(encodePacked(['string'], [reasonText]));
      writeContract({
        address: ESCROW_PROOF_ADDRESS,
        abi: ESCROW_PROOF_ABI,
        functionName: 'challenge',
        args: [escrowId, idx, hash],
      });
    }, 2000);
  };

  const release = () => {
    writeContract({
      address: ESCROW_PROOF_ADDRESS,
      abi: ESCROW_PROOF_ABI,
      functionName: 'release',
      args: [escrowId, idx],
    });
  };

  const refund = () => {
    writeContract({
      address: ESCROW_PROOF_ADDRESS,
      abi: ESCROW_PROOF_ABI,
      functionName: 'refund',
      args: [escrowId, idx],
    });
  };

  const commitVote = () => {
    const hash = keccak256(
      encodePacked(
        ['uint256', 'uint8', 'bool', 'bytes32'],
        [escrowId, idx, commitDecision, keccak256(encodePacked(['string'], [commitSalt]))]
      )
    );
    writeContract({
      address: ESCROW_PROOF_ADDRESS,
      abi: ESCROW_PROOF_ABI,
      functionName: 'commitVote',
      args: [escrowId, idx, hash],
    });
  };

  const revealVote = () => {
    const salt = keccak256(encodePacked(['string'], [revealSalt]));
    writeContract({
      address: ESCROW_PROOF_ADDRESS,
      abi: ESCROW_PROOF_ABI,
      functionName: 'revealVote',
      args: [escrowId, idx, revealDecision, salt],
    });
  };

  const resolveByVote = () => {
    writeContract({
      address: ESCROW_PROOF_ADDRESS,
      abi: ESCROW_PROOF_ABI,
      functionName: 'resolveByVote',
      args: [escrowId, idx],
    });
  };

  const resolveByTimeout = () => {
    writeContract({
      address: ESCROW_PROOF_ADDRESS,
      abi: ESCROW_PROOF_ABI,
      functionName: 'resolveByTimeout',
      args: [escrowId, idx],
    });
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Milestone {idx + 1}</h3>
        <div className="flex items-center gap-3">
          <span className="font-semibold">{formatUSDC(m.amount)} USDC</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[status]}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex gap-2">
        {['pending', 'proven', 'challenged', 'resolved'].map((s, i) => {
          const active =
            (s === 'pending') ||
            (s === 'proven' && m.proofAt > 0n) ||
            (s === 'challenged' && m.disputedAt > 0n) ||
            (s === 'resolved' && (m.released || m.refunded));
          return (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${active ? 'bg-cyan-500' : 'bg-gray-800'}`} />
          );
        })}
      </div>

      {/* Details */}
      <div className="text-xs space-y-1 text-gray-500">
        {m.proofHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
          <div>Proof: <span className="font-mono text-gray-400">{m.proofHash.slice(0, 18)}…</span></div>
        )}
        {m.proofBundleHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
          <div>Bundle: <span className="font-mono text-gray-400">{m.proofBundleHash.slice(0, 18)}…</span></div>
        )}
        {m.proofAt > 0n && <div>Proof at: {new Date(Number(m.proofAt) * 1000).toLocaleString()}</div>}
        {m.disputedAt > 0n && <div>Disputed at: {new Date(Number(m.disputedAt) * 1000).toLocaleString()}</div>}
        {m.challenger !== '0x0000000000000000000000000000000000000000' && (
          <div>Challenger: <span className="font-mono">{shortenAddress(m.challenger)}</span></div>
        )}
      </div>

      {/* Vote counts */}
      {disputed && (
        <div className="flex gap-4 text-sm">
          <span className="text-emerald-400">Release: {releaseVotes ?? 0}</span>
          <span className="text-red-400">Refund: {refundVotes ?? 0}</span>
        </div>
      )}

      {/* Actions */}
      {!m.released && !m.refunded && (
        <div className="space-y-3 pt-2 border-t border-white/5">
          {/* Beneficiary: submit proof */}
          {isBeneficiary && m.proofAt === 0n && (
            <div className="space-y-2">
              <input
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="Proof text (will be hashed)"
                className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-cyan-500/50 focus:outline-none"
              />
              <button onClick={submitProof} disabled={!proofText} className="w-full bg-cyan-500/10 text-cyan-400 py-2 rounded-lg text-xs font-medium hover:bg-cyan-500/20 transition disabled:opacity-30">
                Submit Proof
              </button>
            </div>
          )}

          {/* Anchor bundle */}
          {(isBeneficiary || isPayer) && m.proofAt > 0n && !disputed && (
            <div className="space-y-2">
              <input
                value={bundleText}
                onChange={(e) => setBundleText(e.target.value)}
                placeholder="Proof bundle JSON (will be hashed)"
                className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-cyan-500/50 focus:outline-none"
              />
              <button onClick={anchorBundle} disabled={!bundleText} className="w-full bg-blue-500/10 text-blue-400 py-2 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition disabled:opacity-30">
                Anchor Proof Bundle
              </button>
            </div>
          )}

          {/* Payer: challenge */}
          {isPayer && canChallenge && (
            <div className="space-y-2">
              <input
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Challenge reason"
                className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-cyan-500/50 focus:outline-none"
              />
              <button onClick={challenge} disabled={!reasonText} className="w-full bg-red-500/10 text-red-400 py-2 rounded-lg text-xs font-medium hover:bg-red-500/20 transition disabled:opacity-30">
                Challenge (3% bond)
              </button>
            </div>
          )}

          {/* Release */}
          {canRelease && (
            <button onClick={release} className="w-full bg-emerald-500/10 text-emerald-400 py-2 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition">
              Release Funds
            </button>
          )}

          {/* Refund (pre-proof) */}
          {isPayer && m.proofAt === 0n && (
            <button onClick={refund} className="w-full bg-amber-500/10 text-amber-400 py-2 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition">
              Refund
            </button>
          )}

          {/* Arbiter: commit vote */}
          {disputed && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="text-xs text-gray-500 font-medium">Arbiter Actions</div>
              <div className="flex gap-2">
                <select
                  value={commitDecision ? 'release' : 'refund'}
                  onChange={(e) => setCommitDecision(e.target.value === 'release')}
                  className="flex-1 bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="release">Release</option>
                  <option value="refund">Refund</option>
                </select>
                <input
                  value={commitSalt}
                  onChange={(e) => setCommitSalt(e.target.value)}
                  placeholder="Secret salt"
                  className="flex-1 bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <button onClick={commitVote} disabled={!commitSalt} className="w-full bg-purple-500/10 text-purple-400 py-2 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition disabled:opacity-30">
                Commit Vote
              </button>

              <div className="flex gap-2">
                <select
                  value={revealDecision ? 'release' : 'refund'}
                  onChange={(e) => setRevealDecision(e.target.value === 'release')}
                  className="flex-1 bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="release">Release</option>
                  <option value="refund">Refund</option>
                </select>
                <input
                  value={revealSalt}
                  onChange={(e) => setRevealSalt(e.target.value)}
                  placeholder="Same salt used in commit"
                  className="flex-1 bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <button onClick={revealVote} disabled={!revealSalt} className="w-full bg-purple-500/10 text-purple-400 py-2 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition disabled:opacity-30">
                Reveal Vote
              </button>

              <div className="flex gap-2">
                <button onClick={resolveByVote} className="flex-1 bg-cyan-500/10 text-cyan-400 py-2 rounded-lg text-xs font-medium hover:bg-cyan-500/20 transition">
                  Resolve by Vote
                </button>
                <button onClick={resolveByTimeout} className="flex-1 bg-amber-500/10 text-amber-400 py-2 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition">
                  Resolve by Timeout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EscrowDetail() {
  const params = useParams();
  const escrowId = BigInt(params.id as string);
  const { address } = useAccount();
  const { data: escrow, isLoading } = useEscrow(escrowId);
  const { data: selectedArbiters } = useSelectedArbiters(escrowId);
  const publicClient = usePublicClient();
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);

  const e = escrow as
    | [string, string, string, bigint, bigint, bigint, number, boolean, boolean, number, number, bigint]
    | undefined;

  useEffect(() => {
    if (!e || !publicClient) return;
    const count = e[6];
    const load = async () => {
      const ms: MilestoneData[] = [];
      for (let i = 0; i < count; i++) {
        try {
          const data = await publicClient.readContract({
            address: ESCROW_PROOF_ADDRESS,
            abi: ESCROW_PROOF_ABI,
            functionName: 'getMilestone',
            args: [escrowId, i],
          });
          ms.push(data as unknown as MilestoneData);
        } catch {}
      }
      setMilestones(ms);
    };
    load();
  }, [e, publicClient, escrowId]);

  if (isLoading) {
    return <div className="text-center py-20 text-gray-500">Loading…</div>;
  }

  if (!e || e[1] === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-gray-400">Escrow not found</p>
      </div>
    );
  }

  const [token, payer, beneficiary, totalAmount, challengeWindow, voteDeadline, milestoneCount, disputed, closed] = e;
  const isPayer = address?.toLowerCase() === payer.toLowerCase();
  const isBeneficiary = address?.toLowerCase() === beneficiary.toLowerCase();
  const status = closed ? 'Closed' : disputed ? 'Disputed' : 'Active';
  const statusColor = closed
    ? 'text-gray-400 bg-gray-400/10'
    : disputed
    ? 'text-red-400 bg-red-400/10'
    : 'text-emerald-400 bg-emerald-400/10';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Escrow #{escrowId.toString()}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor}`}>{status}</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold gradient-text">{formatUSDC(totalAmount)} USDC</div>
          <div className="text-xs text-gray-500">{milestoneCount} milestones</div>
        </div>
      </div>

      {/* Info */}
      <div className="glass-card rounded-xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Payer</span>
            <div className="font-mono text-xs mt-1">{shortenAddress(payer)}</div>
            {isPayer && <span className="text-xs text-cyan-400">(you)</span>}
          </div>
          <div>
            <span className="text-gray-500">Beneficiary</span>
            <div className="font-mono text-xs mt-1">{shortenAddress(beneficiary)}</div>
            {isBeneficiary && <span className="text-xs text-cyan-400">(you)</span>}
          </div>
          <div>
            <span className="text-gray-500">Token</span>
            <div className="font-mono text-xs mt-1">{shortenAddress(token)}</div>
          </div>
          <div>
            <span className="text-gray-500">Challenge Window</span>
            <div className="mt-1">{formatDuration(Number(challengeWindow))}</div>
          </div>
          <div>
            <span className="text-gray-500">Vote Deadline</span>
            <div className="mt-1">{formatDuration(Number(voteDeadline))}</div>
          </div>
          <div>
            <span className="text-gray-500">Dispute Bond</span>
            <div className="mt-1">{e[11] > 0n ? formatUSDC(e[11]) + ' USDC' : '—'}</div>
          </div>
        </div>
      </div>

      {/* Selected Arbiters */}
      {selectedArbiters && (selectedArbiters as string[]).length > 0 && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-400">Selected Arbiters</h3>
          <div className="flex flex-wrap gap-2">
            {(selectedArbiters as string[]).map((a) => (
              <span key={a} className="text-xs font-mono bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full">
                {shortenAddress(a)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Milestones</h2>
        {milestones.map((m, i) => (
          <MilestoneCard
            key={i}
            m={m}
            idx={i}
            escrowId={escrowId}
            isPayer={isPayer}
            isBeneficiary={isBeneficiary}
            challengeWindow={challengeWindow}
            disputed={disputed}
          />
        ))}
      </div>
    </div>
  );
}
