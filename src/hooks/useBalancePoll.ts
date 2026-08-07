'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EsimsApi } from '@/lib/api';
import {
  clearBalancePoll,
  getBalancePollContext,
  initBalancePollFromUrl,
} from '@/lib/balance-poll';
import { dataMbFromBalanceStatusBody } from '@/lib/esim-balance';

const POLL_MS = 5000;
const MAX_POLL_MS = 10 * 60 * 1000;

type BalanceStatusResponse = {
  balance_ready?: boolean;
  poll_again?: boolean;
  data?: unknown;
};

export function useBalancePoll(options?: { onBalanceReady?: () => void }) {
  const onReadyRef = useRef(options?.onBalanceReady);
  onReadyRef.current = options?.onBalanceReady;

  const [context, setContext] = useState(() => {
    initBalancePollFromUrl();
    return getBalancePollContext();
  });
  const [confirmedDataMb, setConfirmedDataMb] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(Boolean(context));

  const pollEnabled = Boolean(context?.since) && confirmedDataMb == null;

  const pollOnce = useCallback(async () => {
    if (!context?.since) return true;

    const sinceMs = Date.parse(context.since);
    if (Number.isFinite(sinceMs) && Date.now() - sinceMs > MAX_POLL_MS) {
      setIsPolling(false);
      return true;
    }

    try {
      const res = await EsimsApi.balanceStatus({
        since: context.since,
        msisdn: context.msisdn,
      });

      if (!res.ok) return false;

      const body = res.body as BalanceStatusResponse;
      if (!body.balance_ready) return false;

      const dataMb = dataMbFromBalanceStatusBody(body);
      if (dataMb != null) {
        setConfirmedDataMb(dataMb);
      }

      clearBalancePoll();
      setContext(null);
      setIsPolling(false);
      onReadyRef.current?.();
      return true;
    } catch {
      return false;
    }
  }, [context]);

  useEffect(() => {
    if (!pollEnabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const run = async () => {
      const done = await pollOnce();
      if (done && timer) {
        clearInterval(timer);
      }
    };

    void run();
    timer = setInterval(() => {
      if (cancelled) return;
      void run();
    }, POLL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [pollEnabled, pollOnce]);

  const optimisticDataMb = context?.optimisticDataMb ?? null;

  return {
    isPolling,
    optimisticDataMb,
    confirmedDataMb,
  };
}
