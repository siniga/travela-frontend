import type { Metadata } from 'next';
import LegalDocument from '@/components/legal/LegalDocument';
import { privacyPolicy } from '@/lib/legal/privacy';

export const metadata: Metadata = {
  title: 'Privacy Policy — Travela',
  description:
    'TheTravela Privacy Policy explaining how Onnela Limited collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
  return <LegalDocument doc={privacyPolicy} />;
}
