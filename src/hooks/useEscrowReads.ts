'use client';

import { useReadContract, useReadContracts } from 'wagmi';
import { ESCROW_PROOF_ADDRESS, ESCROW_PROOF_ABI } from '@/config/contracts';

export function useNextEscrowId() {
  return useReadContract({
    address: ESCROW_PROOF_ADDRESS,
    abi: ESCROW_PROOF_ABI,
    functionName: 'nextEscrowId',
  });
}

export function useEscrow(id: bigint) {
  return useReadContract({
    address: ESCROW_PROOF_ADDRESS,
    abi: ESCROW_PROOF_ABI,
    functionName: 'escrows',
    args: [id],
  });
}

export function useMilestone(escrowId: bigint, idx: number) {
  return useReadContract({
    address: ESCROW_PROOF_ADDRESS,
    abi: ESCROW_PROOF_ABI,
    functionName: 'getMilestone',
    args: [escrowId, idx],
  });
}

export function useSelectedArbiters(escrowId: bigint) {
  return useReadContract({
    address: ESCROW_PROOF_ADDRESS,
    abi: ESCROW_PROOF_ABI,
    functionName: 'getSelectedArbiters',
    args: [escrowId],
  });
}

export function useReputation(address: `0x${string}` | undefined) {
  return useReadContract({
    address: ESCROW_PROOF_ADDRESS,
    abi: ESCROW_PROOF_ABI,
    functionName: 'getReputation',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useTrustScore(address: `0x${string}` | undefined) {
  return useReadContract({
    address: ESCROW_PROOF_ADDRESS,
    abi: ESCROW_PROOF_ABI,
    functionName: 'trustScore',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useArbiterInfo(address: `0x${string}` | undefined) {
  return useReadContract({
    address: ESCROW_PROOF_ADDRESS,
    abi: ESCROW_PROOF_ABI,
    functionName: 'getArbiterInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useArbiterScore(address: `0x${string}` | undefined) {
  return useReadContract({
    address: ESCROW_PROOF_ADDRESS,
    abi: ESCROW_PROOF_ABI,
    functionName: 'arbiterScore',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function usePoolSize() {
  return useReadContract({
    address: ESCROW_PROOF_ADDRESS,
    abi: ESCROW_PROOF_ABI,
    functionName: 'getPoolSize',
  });
}

export function usePoolThresholds() {
  return useReadContracts({
    contracts: [
      {
        address: ESCROW_PROOF_ADDRESS,
        abi: ESCROW_PROOF_ABI,
        functionName: 'minTrustScore',
      },
      {
        address: ESCROW_PROOF_ADDRESS,
        abi: ESCROW_PROOF_ABI,
        functionName: 'minCompletedEscrows',
      },
    ],
  });
}

export function useVoteCounts(escrowId: bigint, milestoneIdx: number) {
  return useReadContracts({
    contracts: [
      {
        address: ESCROW_PROOF_ADDRESS,
        abi: ESCROW_PROOF_ABI,
        functionName: 'releaseVotes',
        args: [escrowId, milestoneIdx],
      },
      {
        address: ESCROW_PROOF_ADDRESS,
        abi: ESCROW_PROOF_ABI,
        functionName: 'refundVotes',
        args: [escrowId, milestoneIdx],
      },
    ],
  });
}
