import type { ReactNode } from 'react';

export function PageWrapper({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto overscroll-y-contain px-6 py-6 sm:px-8">
      {title && <h1 className="mb-6 text-3xl font-bold">{title}</h1>}
      {children}
    </div>
  );
}
