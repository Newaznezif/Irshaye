import type { Metadata } from 'next';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { AboutPageContent } from '@/components/landing/AboutPageContent';

export const metadata: Metadata = {
  title: 'About the Founder',
  description:
    'Meet the founder and developer behind IRSHAYE, an AI-assisted digital platform for climate-smart agriculture in Ethiopia.',
};

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <LandingHeader />
      <AboutPageContent />
      <LandingFooter />
    </div>
  );
}
