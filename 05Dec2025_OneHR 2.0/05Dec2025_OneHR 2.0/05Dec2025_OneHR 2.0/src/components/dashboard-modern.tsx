import { Dashboard as OriginalDashboard } from './dashboard';

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

export function DashboardModern({ onNavigate }: DashboardProps = {}) {
  // Render the redesigned version by wrapping the original
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <OriginalDashboard onNavigate={onNavigate} />
      </div>
    </div>
  );
}
