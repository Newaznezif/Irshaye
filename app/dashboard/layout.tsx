import { AppShell } from '@/components/AppShell';
import { WorkbenchProvider } from '@/context/WorkbenchContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {/* WorkbenchProvider is a client island; pages stay server components with metadata. */}
      <WorkbenchProvider>{children}</WorkbenchProvider>
    </AppShell>
  );
}
