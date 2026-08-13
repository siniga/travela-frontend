import type { Metadata } from 'next';
import LegalDocument from '@/components/legal/LegalDocument';
import { termsAndConditions } from '@/lib/legal/terms';

export const metadata: Metadata = {
  title: 'Terms and Conditions — Travela',
  description:
    'TheTravela Terms and Conditions for eSIM and physical SIM services operated by Onnela Limited.',
};

export default function TermsPage() {
  return <LegalDocument doc={termsAndConditions} />;
}
