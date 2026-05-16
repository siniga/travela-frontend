'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DestinationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/bundles?country=TZ&countryName=Tanzania');
  }, [router]);

  return null;
}
