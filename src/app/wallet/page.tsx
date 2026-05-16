'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WalletPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/receipts');
  }, [router]);

  return null;
}
