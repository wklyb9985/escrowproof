import { formatUnits } from 'viem';

export function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatUSDC(amount: bigint) {
  return parseFloat(formatUnits(amount, 6)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDuration(seconds: number) {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function getMilestoneStatus(m: {
  released: boolean;
  refunded: boolean;
  disputedAt: bigint;
  proofAt: bigint;
}) {
  if (m.released) return 'released';
  if (m.refunded) return 'refunded';
  if (m.disputedAt > 0n) return 'disputed';
  if (m.proofAt > 0n) return 'proven';
  return 'pending';
}

export const STATUS_COLORS: Record<string, string> = {
  pending: 'text-gray-400 bg-gray-400/10',
  proven: 'text-cyan-400 bg-cyan-400/10',
  disputed: 'text-red-400 bg-red-400/10',
  released: 'text-emerald-400 bg-emerald-400/10',
  refunded: 'text-amber-400 bg-amber-400/10',
};
