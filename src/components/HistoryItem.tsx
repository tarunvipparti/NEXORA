import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion, Clock, ChevronRight } from 'lucide-react';
import { ScanResult } from '../types';
import { cn, getRiskColor } from '../utils';

interface HistoryItemProps {
  scan: ScanResult;
  onClick: () => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ scan, onClick }) => {
  const color = getRiskColor(scan.riskLevel);
  
  const Icon = scan.riskLevel === 'safe' 
    ? ShieldCheck 
    : scan.riskLevel === 'suspicious' 
      ? ShieldQuestion 
      : ShieldAlert;

  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-[0.98] group text-left"
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <Icon size={24} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono uppercase tracking-wider text-white/40">
            {new Date(scan.timestamp).toLocaleDateString()}
          </span>
          <span 
            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {scan.riskLevel.replace('-', ' ')}
          </span>
        </div>
        <h3 className="text-white font-medium truncate text-sm">
          {scan.url}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-white/40 text-[10px]">
          <Clock size={10} />
          <span>{new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <ChevronRight size={20} className="text-white/20 group-hover:text-white/40 transition-colors" />
    </button>
  );
};
