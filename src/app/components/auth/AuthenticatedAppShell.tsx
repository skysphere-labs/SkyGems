import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';

import { RootLayout } from '../../layouts/RootLayout';
import { restoreAuthSession } from '../../services/skygemsApi';

export function AuthenticatedAppShell() {
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let cancelled = false;

    restoreAuthSession()
      .then(() => {
        if (!cancelled) {
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('unauthenticated');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-semibold"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
          >
            G
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium text-foreground">Restoring your workspace</p>
            <p className="text-xs text-muted-foreground">Checking session and loading your designs.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    const target = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from: target }} />;
  }

  return <RootLayout />;
}
