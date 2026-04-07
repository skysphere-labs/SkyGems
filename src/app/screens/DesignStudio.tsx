import React from 'react';
import { DesignGenerator } from './DesignGenerator';

export function DesignStudio() {
  return (
    <div className="h-full overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <DesignGenerator />
    </div>
  );
}
