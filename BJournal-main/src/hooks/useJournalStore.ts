import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, SAMPLE_STRATEGIES, SAMPLE_TRADES } from '../data/sampleData';
import type { JournalSettings, Strategy, Trade } from '../types';
import { computeStats } from '../utils/stats';
import { loadVault, saveVault } from '../utils/authStore';
import { exportToExcel } from '../utils/excelExporter';

const FALLBACK_KEY = 'fhr-local-v3';

interface VaultData {
  trades: Trade[];
  strategies: Strategy[];
  settings: JournalSettings;
}

const DEFAULT_VAULT: VaultData = {
  trades: SAMPLE_TRADES,
  strategies: SAMPLE_STRATEGIES,
  settings: DEFAULT_SETTINGS,
};

function loadLocalFallback(): VaultData {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    if (raw) {
      const p = JSON.parse(raw) as VaultData;
      return {
        trades: p.trades?.length ? p.trades : SAMPLE_TRADES,
        strategies: p.strategies?.length ? p.strategies : SAMPLE_STRATEGIES,
        settings: { ...DEFAULT_SETTINGS, ...p.settings },
      };
    }
  } catch { /* ignore */ }
  return DEFAULT_VAULT;
}

export function useJournalStore(userId?: string, password?: string) {
  const [trades, setTrades]       = useState<Trade[]>(DEFAULT_VAULT.trades);
  const [strategies, setStrategies] = useState<Strategy[]>(DEFAULT_VAULT.strategies);
  const [settings, setSettings]   = useState<JournalSettings>(DEFAULT_VAULT.settings);
  const [vaultReady, setVaultReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (userId && password) {
        try {
          const v = await loadVault<VaultData>(userId, password, DEFAULT_VAULT);
          if (!cancelled) {
            setTrades(v.trades?.length ? v.trades : SAMPLE_TRADES);
            setStrategies(v.strategies?.length ? v.strategies : SAMPLE_STRATEGIES);
            setSettings({ ...DEFAULT_SETTINGS, ...v.settings });
          }
        } catch { /* empty vault → defaults */ }
      } else {
        const v = loadLocalFallback();
        if (!cancelled) {
          setTrades(v.trades); setStrategies(v.strategies); setSettings(v.settings);
        }
      }
      if (!cancelled) setVaultReady(true);
    }
    load();
    return () => { cancelled = true; };
  }, [userId, password]);

  useEffect(() => {
    if (!vaultReady) return;
    const data: VaultData = { trades, strategies, settings };
    if (userId && password) {
      saveVault(userId, password, data).catch(() => { /* silent */ });
    } else {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(data));
    }
  }, [trades, strategies, settings, vaultReady, userId, password]);

  const stats = useMemo(() => computeStats(trades), [trades]);

  const serializeVault = useCallback((): string => {
    return JSON.stringify({ trades, strategies, settings });
  }, [trades, strategies, settings]);

  /* ── Trades ── */
  const addTrade    = useCallback((t: Trade) => setTrades((p) => [t, ...p]), []);
  const addTrades   = useCallback((newTrades: Trade[]) => setTrades((p) => [...newTrades, ...p]), []);
  const updateTrade = useCallback((id: string, patch: Partial<Trade>) =>
    setTrades((p) => p.map((t) => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)), []);
  const deleteTrade = useCallback((id: string) => setTrades((p) => p.filter((t) => t.id !== id)), []);

  /* ── Strategies ── */
  const addStrategy    = useCallback((s: Strategy) => setStrategies((p) => [s, ...p]), []);
  const updateStrategy = useCallback((id: string, patch: Partial<Strategy>) =>
    setStrategies((p) => p.map((s) => s.id === id ? { ...s, ...patch } : s)), []);
  const deleteStrategy = useCallback((id: string) => setStrategies((p) => p.filter((s) => s.id !== id)), []);

  /* ── Settings ── */
  const updateSettings = useCallback((patch: Partial<JournalSettings>) =>
    setSettings((p) => ({ ...p, ...patch })), []);

  const clearAllData = useCallback(() => {
    setTrades([]); setStrategies([]); setSettings(DEFAULT_SETTINGS);
  }, []);

  /* Backward-compatible JSON export (still used as backup) */
  const exportJson = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ trades, strategies, settings, exportedAt: new Date().toISOString() }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fools-hunting-room-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }, [trades, strategies, settings]);

  /* New rich Excel export (8 sheets, formatted) */
  const exportExcel = useCallback(async (
    user: { username: string; displayName: string; email?: string },
    period: 'all' | 'week' | 'month' | 'year' = 'all'
  ) => {
    await exportToExcel({ user, trades, strategies, settings, period });
  }, [trades, strategies, settings]);

  const importJson = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const d = JSON.parse(String(reader.result)) as VaultData;
          if (Array.isArray(d.trades)) setTrades(d.trades);
          if (Array.isArray(d.strategies)) setStrategies(d.strategies);
          if (d.settings) setSettings({ ...DEFAULT_SETTINGS, ...d.settings });
          resolve();
        } catch (e) { reject(e); }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }, []);

  return {
    trades, strategies, settings, stats, vaultReady,
    addTrade, addTrades, updateTrade, deleteTrade,
    addStrategy, updateStrategy, deleteStrategy,
    updateSettings,
    clearAllData,
    exportJson, exportExcel, importJson,
    serializeVault,
  };
}

export type JournalStore = ReturnType<typeof useJournalStore>;
