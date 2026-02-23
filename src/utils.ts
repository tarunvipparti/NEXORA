import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskColor(level: string) {
  switch (level) {
    case 'safe':
      return '#00C853';
    case 'suspicious':
      return '#FFD600';
    case 'high-risk':
      return '#D50000';
    default:
      return '#8E9299';
  }
}

export function getRiskLevel(score: number): 'safe' | 'suspicious' | 'high-risk' {
  if (score < 30) return 'safe';
  if (score < 70) return 'suspicious';
  return 'high-risk';
}
