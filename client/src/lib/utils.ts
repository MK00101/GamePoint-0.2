import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(d)} • ${formatTime(d)}`;
}

export function calculatePrizePool(entryFee: number, maxPlayers: number): number {
  return entryFee * maxPlayers;
}

export function calculatePrizeDistribution(prizePool: number) {
  const platformFee = prizePool * 0.1; // 10%
  const gameMasterFee = prizePool * 0.05; // 5%
  const promotersFee = prizePool * 0.1; // 10%
  const winnersPrize = prizePool * 0.75; // 75%
  
  return {
    platformFee,
    gameMasterFee,
    promotersFee,
    winnersPrize,
    total: prizePool
  };
}

export function generateReferralLink(username: string): string {
  return `${window.location.origin}/ref/${username}`;
}

export const gameStatusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'postponed', label: 'Postponed' }
];

export const payoutStructureOptions = [
  { value: '1st:100', label: '1st Place: 100%' },
  { value: '1st:70,2nd:30', label: '1st: 70%, 2nd: 30%' },
  { value: '1st:50,2nd:30,3rd:20', label: '1st: 50%, 2nd: 30%, 3rd: 20%' }
];

export function parsePayoutStructure(structure: string): { position: string; percentage: number }[] {
  return structure.split(',').map(item => {
    const [position, percentage] = item.split(':');
    return {
      position,
      percentage: parseInt(percentage)
    };
  });
}
