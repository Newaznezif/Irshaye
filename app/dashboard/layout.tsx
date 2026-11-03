import { AppShell } from '@/components/AppShell';
import { WorkbenchProvider } from '@/context/WorkbenchContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // WorkbenchProvider wraps the shell so the sidebar can show the saved working
    // context; pages stay server components with their own metadata.
    <WorkbenchProvider>
      <AppShell>{children}</AppShell>
    </WorkbenchProvider>
  );
}
