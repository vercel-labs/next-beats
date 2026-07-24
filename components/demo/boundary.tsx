'use client';

import { cloneElement, createContext, isValidElement, useContext, useEffect, useState } from 'react';

export type BoundaryMode = 'off' | 'on';

type BoundaryContextType = {
  mode: BoundaryMode;
  toggleMode: () => void;
};

const BoundaryContext = createContext<BoundaryContextType | null>(null);

export function BoundaryProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<BoundaryMode>('off');
  const toggleMode = () => setMode(prev => (prev === 'off' ? 'on' : 'off'));

  useEffect(() => {
    document.documentElement.classList.toggle('boundary-mode', mode === 'on');
  }, [mode]);

  return <BoundaryContext.Provider value={{ mode, toggleMode }}>{children}</BoundaryContext.Provider>;
}

export function useBoundaryMode() {
  const ctx = useContext(BoundaryContext);
  if (!ctx) throw new Error('useBoundaryMode must be used within BoundaryProvider');
  return ctx;
}

type Props = {
  children: React.ReactNode;
  label?: string;
  asChild?: boolean;
};

// Tags the child's own DOM node so CSS outlines it — no wrapper, so layout is untouched.
// `asChild`: the single child is a component that forwards unknown props to its host
// node (Ariakit Dialog/Menu, next/link), including portaled ones.
export function Boundary({ children, label, asChild }: Props) {
  const { mode } = useBoundaryMode();
  const name = label ?? 'Client';

  if (isValidElement(children) && (asChild || typeof children.type === 'string')) {
    return cloneElement(children as React.ReactElement<{ 'data-component'?: string }>, { 'data-component': name });
  }

  // No host node to tag (Suspense/portal/conditional): wrap, and only in boundary mode.
  if (mode === 'off') {
    return <>{children}</>;
  }

  return <div data-component={name}>{children}</div>;
}
