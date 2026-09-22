'use client';

import { useEffect, useState } from 'react';

const sizes = ['default', 'large', 'xlarge'] as const;

type TextSize = (typeof sizes)[number];

export function AccessibilityControls() {
  const [size, setSize] = useState<TextSize>(() => {
    if (typeof window === 'undefined') return 'default';
    const saved = window.localStorage.getItem('nn-text-size') as TextSize | null;
    return saved && sizes.includes(saved) ? saved : 'default';
  });
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('nn-reduced-motion') === 'true');
  const [highContrast, setHighContrast] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('nn-high-contrast') === 'true');

  useEffect(() => {
    document.documentElement.dataset.textSize = size;
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
    document.documentElement.dataset.highContrast = String(highContrast);
    window.localStorage.setItem('nn-text-size', size);
    window.localStorage.setItem('nn-reduced-motion', String(reducedMotion));
    window.localStorage.setItem('nn-high-contrast', String(highContrast));
  }, [highContrast, reducedMotion, size]);

  return (
    <section className="bg-card dark:bg-card-dark rounded-2xl p-5" aria-labelledby="accessibility-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-accent text-xs font-bold uppercase tracking-[0.18em]">Make it yours</p>
          <h2 id="accessibility-heading" className="mt-1 text-lg font-bold">Listening preferences</h2>
          <p className="text-muted mt-1 text-sm">Adjust reading comfort without leaving the show.</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Text size">
          {sizes.map(option => <button key={option} type="button" onClick={() => setSize(option)} aria-pressed={size === option} className={`rounded-full border px-3 py-2 text-xs font-semibold capitalize transition-colors ${size === option ? 'border-accent bg-accent text-black' : 'border-divider dark:border-divider-dark text-muted'}`}>{option === 'xlarge' ? 'Extra large' : option}</button>)}
          <button type="button" onClick={() => setReducedMotion(value => !value)} aria-pressed={reducedMotion} className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${reducedMotion ? 'border-accent bg-accent text-black' : 'border-divider dark:border-divider-dark text-muted'}`}>Reduce motion</button>
          <button type="button" onClick={() => setHighContrast(value => !value)} aria-pressed={highContrast} className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${highContrast ? 'border-accent bg-accent text-black' : 'border-divider dark:border-divider-dark text-muted'}`}>High contrast</button>
        </div>
      </div>
    </section>
  );
}
