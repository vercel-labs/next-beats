import { MobileTabBar } from '@/components/mobile-nav';
import { NowPlayingBar } from '@/components/now-playing-bar';
import { SeedNavLinks } from '@/components/scripts/seed-nav-links';
import { Sidebar } from '@/components/sidebar';
import { PlayerProvider } from '@/providers/player-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-24 pl-[env(safe-area-inset-left)] sm:pb-0">
          {children}
        </main>
      </div>
      <NowPlayingBar />
      <MobileTabBar />
      <SeedNavLinks />
    </PlayerProvider>
  );
}
