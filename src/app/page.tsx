'use client';

import { ArrowRight, Wifi, Zap, Shield } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const typingPhrases = [
  'Zanzibar and Africa.',
  'the coast.',
  'your next trip.',
  'Tanzania.',
  'wherever you roam.',
];

function useTypewriter(phrases: string[], typingSpeed = 80, erasingSpeed = 45, pauseMs = 1800) {
  const [displayed, setDisplayed] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!erasing) {
      if (charIdx < current.length) {
        timeout = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        }, typingSpeed);
      } else {
        timeout = setTimeout(() => setErasing(true), pauseMs);
      }
    } else {
      if (charIdx > 0) {
        timeout = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx - 1));
          setCharIdx((c) => c - 1);
        }, erasingSpeed);
      } else {
        setErasing(false);
        setPhraseIdx((i) => (i + 1) % phrases.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [charIdx, erasing, phraseIdx, phrases, typingSpeed, erasingSpeed, pauseMs]);

  return displayed;
}

const popularPlans = [
  {
    tier: 'Basic',
    dataLabel: '10 GB',
    priceLabel: '$20 USD',
    tagline: 'Maps, chat & light streaming',
    bg: '/backgrounds/3.jpg',
  },
  {
    tier: 'Standard',
    dataLabel: '30 GB',
    priceLabel: '$35 USD',
    tagline: 'Share stories & video calls',
    bg: '/backgrounds/1.jpg',
  },
  {
    tier: 'Premium',
    dataLabel: '50 GB',
    priceLabel: '$50 USD',
    tagline: 'Work remotely & heavy usage',
    bg: '/backgrounds/5.jpg',
  },
];

const howItWorks = [
  {
    icon: <Wifi size={28} />,
    num: '1',
    title: 'Choose Your Plan',
    desc: 'Travela is your eSIM & SIM card solution for seamless connectivity in Tanzania.',
  },
  {
    icon: <Zap size={28} />,
    num: '2',
    title: 'Quick Activation',
    desc: 'Tell us your arrival date — we schedule your eSIM so it is ready when you land.',
  },
  {
    icon: <Shield size={28} />,
    num: '3',
    title: 'Roam with confidence',
    desc: '30 days of data, predictable pricing, and support when you need it.',
  },
];

export default function LandingPage() {
  const typedText = useTypewriter(typingPhrases);

  return (
    <div>
      {/* Hero — navbar floats over this section */}
      <section className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/backgrounds/7.jpg"
            alt="Zanzibar coast"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-snug mb-4">
              eSIM for Tanzania.
              <span className="block mt-1">Stay connected seamlessly</span>
              <span className="block mt-1">
                in{' '}
                <span style={{ color: '#17cf54' }}>
                  {typedText}
                </span>
                <span
                  className="inline-block w-0.5 h-[1em] align-middle ml-0.5 animate-pulse"
                  style={{ backgroundColor: '#17cf54' }}
                />
              </span>
            </h1>

            <p className="text-lg text-white/80 mb-10 max-w-lg">
              No roaming shock — 30-day plans with activation scheduled for your arrival date.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/bundles?country=TZ&countryName=Tanzania"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#112116', color: 'white' }}
              >
                Get Started <ArrowRight size={18} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white border border-white/40 hover:bg-white/10 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Plans */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8 text-center">
            Popular eSIM Plans for Zanzibar &amp; Tanzania
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {popularPlans.map((plan) => (
              <div
                key={plan.tier}
                className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Photo */}
                <div className="relative h-44">
                  <Image
                    src={plan.bg}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="p-5">
                  <p className="text-lg font-black text-slate-900 mb-0.5">{plan.tier}</p>
                  <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">{plan.dataLabel}</h3>
                  <p className="text-xs font-semibold text-slate-600 mb-1">{plan.tagline}</p>
                  <p className="text-sm text-slate-500 mb-3">30 days · {plan.priceLabel}</p>
                  <Link
                    href="/bundles?country=TZ&countryName=Tanzania"
                    className="block w-full text-center py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#112116' }}
                  >
                    Buy Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16" style={{ backgroundColor: '#f6f8f6' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-12 text-center">
            How It Works
          </h2>

          <div className="grid sm:grid-cols-3 gap-10">
            {howItWorks.map((step) => (
              <div key={step.num} className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: 'rgba(17,33,22,0.08)', color: '#112116' }}
                >
                  {step.icon}
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">
                  {step.num}. {step.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-white" style={{ backgroundColor: '#112116' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to travel{' '}
            <span style={{ color: '#17cf54' }}>connected</span>?
          </h2>
          <p className="text-base text-white/60 mb-8">
            Join thousands of travellers staying connected across Africa with Travela eSIMs and SIM cards.
          </p>
          <Link
            href="/bundles?country=TZ&countryName=Tanzania"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#17cf54', color: '#112116' }}
          >
            Get your SIM now <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
