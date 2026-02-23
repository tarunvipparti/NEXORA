export type RiskLevel = 'safe' | 'suspicious' | 'high-risk';

export interface ScanResult {
  id: string;
  url: string;
  timestamp: number;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  indicators: string[];
  recommendation: string;
  analysis: string;
}

export interface AppState {
  screen: 'home' | 'scanning' | 'result' | 'history';
  currentResult?: ScanResult;
  history: ScanResult[];
  blockedUrls: string[];
}
