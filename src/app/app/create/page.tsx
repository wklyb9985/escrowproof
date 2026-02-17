'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { ESCROW_PROOF_ADDRESS, ESCROW_PROOF_ABI, USDC_ADDRESS, USDC_ABI } from '@/config/contracts';
import { formatUSDC } from '@/lib/utils';
import Link from 'next/link';

export default function CreateEscrow() {
  const { address, isConnected } = useAccount();
  const [beneficiary, setBeneficiary] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [challengeWindow, setChallengeWindow] = useState('3600');
  const [voteDeadline, setVoteDeadline] = useState('86400');
  const [quorum, setQuorum] = useState('3');
  const [milestones, setMilestones] = useState([{ amount: '' }]);
  const [step, setStep] = useState('form');
  const [approving, setApproving] = useState(false);
  const [creating, setCreating] = useState(false);

  const { writeContract: approve, data: approveTx } = useWriteContract();
  const { writeContract: create, data: createTx } = useWriteContract();
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveTx });
  const { isSuccess: createConfirmed } = useWaitForTransactionReceipt({ hash: createTx });

  const totalParsed = totalAmount ? parseUnits(totalAmount, 6) : 0n;
  const milestoneAmounts = milestones.map((m) => (m.amount ? parseUnits(m.amount, 6) : 0n));
  const milestoneSum = milestoneAmounts.reduce((a, b) => a + b, 0n);
  const isValid =
    beneficiary.startsWith('0x') &&
    beneficiary.length === 42 &&
    totalParsed > 0n &&
    milestoneSum === totalParsed &&
    milestones.every((m) => m.amount && parseFloat(m.amount) > 0);

  const addMilestone = () => setMilestones([...milestones, { amount: '' }]);
  const removeMilestone = (i: number) => setMilestones(milestones.filter((_, j) => j !== i));
  const updateMilestone = (i: number, amount: string) => {
    const updated = [...milestones];
    updated[i] = { amount };
    setMilestones(updated);
  };

  const handleApprove = () => {
    setApproving(true);
    approve({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [ESCROW_PROOF_ADDRESS, totalParsed],
    });
  };

  const handleCreate = () => {
    setCreating(true);
    create({
      address: ESCROW_PROOF_ADDRESS,
      abi: ESCROW_PROOF_ABI,
      functionName: 'createEscrow',
      args: [
        USDC_ADDRESS,
        beneficiary as `0x${string}`,
        totalParsed,
        BigInt(challengeWindow),
        BigInt(voteDeadline),
        milestoneAmounts,
        parseInt(quorum),
      ],
    });
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🔗</div>
        <h1 className="text-2xl font-bold">Connect wallet to create escrow</h1>
      </div>
    );
  }

  if (createConfirmed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-2xl font-bold mb-3">Escrow Created!</h1>
        <p className="text-gray-400 mb-6">Your escrow has been created successfully.</p>
        <Link href="/app" className="text-cyan-400 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold mb-2">Create Escrow</h1>
      <p className="text-gray-500 text-sm mb-8">Set up a new milestone-based escrow with USDC</p>

      {step === 'preview' ? (
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold gradient-text">Review Escrow</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Beneficiary</span>
                <div className="font-mono text-xs mt-1 break-all">{beneficiary}</div>
              </div>
              <div>
                <span className="text-gray-500">Total Amount</span>
                <div className="mt-1 font-semibold">{totalAmount} USDC</div>
              </div>
              <div>
                <span className="text-gray-500">Challenge Window</span>
                <div className="mt-1">{parseInt(challengeWindow) / 3600}h</div>
              </div>
              <div>
                <span className="text-gray-500">Vote Deadline</span>
                <div className="mt-1">{parseInt(voteDeadline) / 3600}h</div>
              </div>
              <div>
                <span className="text-gray-500">Quorum</span>
                <div className="mt-1">{quorum} arbiters</div>
              </div>
              <div>
                <span className="text-gray-500">Milestones</span>
                <div className="mt-1">{milestones.length}</div>
              </div>
            </div>
            <div className="border-t border-white/5 pt-4">
              <span className="text-sm text-gray-500">Milestone Breakdown</span>
              <div className="space-y-2 mt-2">
                {milestones.map((m, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-400">Milestone {i + 1}</span>
                    <span className="font-semibold">{m.amount} USDC</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep('form')}
              className="flex-1 border border-gray-700 text-gray-300 py-3 rounded-xl hover:bg-white/5 transition"
            >
              ← Edit
            </button>
            {!approveConfirmed ? (
              <button
                onClick={handleApprove}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold py-3 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition"
              >
                {approving ? 'Approving…' : 'Approve USDC'}
              </button>
            ) : (
              <button
                onClick={handleCreate}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold py-3 rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition"
              >
                {creating ? 'Creating…' : 'Create Escrow'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Beneficiary */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Beneficiary Address</label>
            <input
              type="text"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              placeholder="0x..."
              className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-cyan-500/50 focus:outline-none transition"
            />
          </div>

          {/* Total Amount */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Total Amount (USDC)</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="100.00"
              className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:outline-none transition"
            />
          </div>

          {/* Timing */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Challenge (seconds)</label>
              <input
                type="number"
                value={challengeWindow}
                onChange={(e) => setChallengeWindow(e.target.value)}
                className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Vote Deadline (s)</label>
              <input
                type="number"
                value={voteDeadline}
                onChange={(e) => setVoteDeadline(e.target.value)}
                className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Quorum</label>
              <input
                type="number"
                value={quorum}
                onChange={(e) => setQuorum(e.target.value)}
                min="1"
                max="10"
                className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-gray-400">Milestones</label>
              <button onClick={addMilestone} className="text-xs text-cyan-400 hover:underline">
                + Add Milestone
              </button>
            </div>
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <span className="text-xs text-gray-500 w-6">#{i + 1}</span>
                  <input
                    type="number"
                    value={m.amount}
                    onChange={(e) => updateMilestone(i, e.target.value)}
                    placeholder="Amount (USDC)"
                    className="flex-1 bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:outline-none transition"
                  />
                  {milestones.length > 1 && (
                    <button
                      onClick={() => removeMilestone(i)}
                      className="text-red-400/60 hover:text-red-400 text-sm transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {totalParsed > 0n && (
              <div className={`text-xs mt-2 ${milestoneSum === totalParsed ? 'text-emerald-400' : 'text-red-400'}`}>
                Sum: {formatUSDC(milestoneSum)} / {totalAmount} USDC
                {milestoneSum === totalParsed ? ' ✓' : ' (must equal total)'}
              </div>
            )}
          </div>

          <button
            onClick={() => setStep('preview')}
            disabled={!isValid}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold py-3.5 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Preview Escrow →
          </button>
        </div>
      )}
    </div>
  );
}
