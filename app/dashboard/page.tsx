import type { Metadata } from 'next';
import OverviewView from './OverviewView';

export const metadata: Metadata = {
  title: 'Overview',
  description: 'Your location, your crop, and the live season context around them.',
};

export default function DashboardPage() {
  return <OverviewView />;
}
