import type { Metadata } from 'next';
import SettingsView from './SettingsView';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Saved context, appearance, and real integration status.',
};

export default function SettingsPage() {
  return <SettingsView />;
}
