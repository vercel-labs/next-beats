import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Suspense } from 'react';
import { BoundaryProvider } from '@/components/demo/boundary';
import { DemoToolbar } from '@/components/demo/demo-toolbar';
import { OfflineIndicator } from '@/components/offline-indicator';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/toaster';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: [
    { color: '#fafafa', media: '(prefers-color-scheme: light)' },
    { color: '#121212', media: '(prefers-color-scheme: dark)' },
  ],
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  applicationName: 'Neurodiversity Nation: Amplifying Voices',
  authors: [{ name: 'Neurodiversity Nation' }],
  creator: 'Neurodiversity Nation',
  description:
    'Neurodiversity Nation: Amplifying Voices — discover and listen to podcast episodes about lived experience, education, advocacy, and inclusive care.',
  keywords: ['neurodiversity podcast', 'autism podcast', 'neurodivergent voices', 'inclusive education', 'disability advocacy'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neurodiversitynation.com'),
  title: {
    default: 'Neurodiversity Nation: Amplifying Voices',
    template: '%s · Neurodiversity Nation: Amplifying Voices',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="bg-surface dark:bg-surface-dark flex h-[100dvh] flex-col text-black antialiased dark:text-white">
        <ThemeProvider>
          <BoundaryProvider>
            <OfflineIndicator />
            {children}
            <div className="demo-toggles fixed top-3 right-3 z-50 hidden items-end gap-2 sm:flex">
              <Suspense>
                <DemoToolbar />
              </Suspense>
            </div>
            <Toaster />
          </BoundaryProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
