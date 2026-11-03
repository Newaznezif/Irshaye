import type { Metadata } from 'next';
import { AdvisorSection } from '@/components/landing/AdvisorSection';
import { CallToAction } from '@/components/landing/CallToAction';
import { DataCredibility } from '@/components/landing/DataCredibility';
import { Features } from '@/components/landing/Features';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { IntegrityRules } from '@/components/landing/IntegrityRules';

export const metadata: Metadata = {
  title: 'IRSHAYE — Climate-Smart Agricultural Intelligence for Ethiopia',
  description:
    'An AI-assisted digital platform for climate-smart agriculture in Ethiopia: live climate intelligence, source-cited crop advisory, soil-management guidance and real market prices, with provenance on every number.',
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <LandingHeader />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Features />
        <AdvisorSection />
        <IntegrityRules />
        <DataCredibility />
        <CallToAction />
      </main>
      <LandingFooter />
    </div>
  );
}
