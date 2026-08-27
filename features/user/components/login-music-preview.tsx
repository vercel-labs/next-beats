import { Heart, Home, Library, Music, Pause, Play, Search, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { MusicNote } from '@/components/ui/music-note';
import { AlbumArt } from '@/features/artwork/components/album-art';

const recentTracks = [
  { title: 'Async Await', artist: 'Neon Pulse', tone: 'from-blue-500 to-indigo-600' },
  { title: 'WebSocket Sunset', artist: 'Neon Pulse', tone: 'from-sky-400 to-blue-500' },
  { title: 'Server Sent Vibes', artist: 'Chrome Echo', tone: 'from-blue-400 to-cyan-500' },
  { title: 'Hydration', artist: 'Chrome Echo', tone: 'from-indigo-400 to-blue-500' },
  { title: 'Hot Module Reload', artist: 'Axiom', tone: 'from-sky-500 to-indigo-600' },
  { title: 'Localhost Morning', artist: 'Paper Lanterns', tone: 'from-blue-300 to-sky-500' },
];

const mostPlayed = [
  { title: 'Pixel Perfect', artist: 'Luna Park', tone: 'from-blue-400 to-indigo-500' },
  { title: 'Ship It', artist: 'BLKSMTH', tone: 'from-slate-500 to-blue-700' },
  { title: 'Tailwind Hearts', artist: 'Luna Park', tone: 'from-indigo-400 to-sky-500' },
  { title: 'Stack Overflow Flow', artist: 'BLKSMTH', tone: 'from-indigo-600 to-blue-800' },
  { title: 'Component Chemistry', artist: 'Prism', tone: 'from-sky-400 to-cyan-500' },
  { title: 'Hot Module Reload', artist: 'Axiom', tone: 'from-sky-500 to-indigo-600' },
  { title: '3 AM Push', artist: 'SyntaxErr', tone: 'from-blue-500 to-sky-600' },
  { title: 'Type Safe Love', artist: 'Prism', tone: 'from-blue-300 to-indigo-400' },
];

export function LoginMusicPreview() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden select-none">
      <div className="flex h-[calc(100%-8rem)] min-h-0 opacity-75 saturate-75 sm:h-[calc(100%-4.5rem)]">
        <aside className="hidden w-[4.5rem] shrink-0 flex-col gap-2 p-2 sm:flex lg:w-[17.5rem]">
          <div className="bg-card dark:bg-card-dark rounded-lg p-3 lg:p-4">
            <div className="text-accent mb-4 hidden items-center gap-2 px-1 text-xl font-bold tracking-tight lg:flex">
              <MusicNote size={24} />
              <span>NextBeats</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-3 rounded-md bg-white/10 p-2 text-sm font-bold lg:justify-start lg:px-3">
                <Home className="size-5" />
                <span className="hidden lg:inline">Home</span>
              </div>
              <div className="text-muted flex items-center justify-center gap-3 p-2 text-sm lg:justify-start lg:px-3">
                <Search className="size-5" />
                <span className="hidden lg:inline">Search</span>
              </div>
              <div className="text-muted flex items-center justify-center gap-3 p-2 text-sm lg:justify-start lg:px-3">
                <Music className="size-5" />
                <span className="hidden lg:inline">Library</span>
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-card-dark flex min-h-0 flex-1 flex-col rounded-lg p-3 lg:p-4">
            <div className="text-muted mb-3 flex items-center justify-center gap-2 text-sm font-bold lg:justify-start">
              <Library className="size-5" />
              <span className="hidden lg:inline">Your Library</span>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-3 rounded-md p-2 text-sm font-medium lg:justify-start">
                <Heart className="size-4" />
                <span className="hidden lg:inline">Liked Tracks</span>
              </div>
              {[
                ['from-violet-500 to-purple-600', 'Late Night Coding'],
                ['from-purple-400 to-violet-500', 'Morning Vibes'],
                ['from-fuchsia-500 to-purple-600', 'High Energy'],
              ].map(([tone, title]) => (
                <div
                  className="text-muted flex items-center justify-center gap-3 rounded-md p-2 text-sm lg:justify-start lg:px-3"
                  key={title}
                >
                  <span className={`size-3 shrink-0 rounded-sm bg-gradient-to-br ${tone}`} />
                  <span className="hidden truncate lg:inline">{title}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="bg-surface dark:bg-surface-dark min-w-0 flex-1 overflow-hidden">
          <div className="px-6 py-6 sm:px-8">
            <div className="mb-6 flex items-center gap-3 sm:hidden">
              <MusicNote size={26} className="text-accent" />
              <span className="text-xl font-bold tracking-tight">NextBeats</span>
            </div>
            <h1 className="mb-6 text-3xl font-bold">Welcome back</h1>
            <h2 className="mb-4 text-xl font-bold">Recently Played</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {recentTracks.map((track, index) => (
                <div
                  className="bg-card/60 dark:bg-card-dark/60 flex min-w-0 items-center gap-3 rounded-md px-3 py-2"
                  key={track.title}
                >
                  <span className="text-muted w-5 text-center text-xs tabular-nums">{index + 1}</span>
                  <AlbumArt coverColor={track.tone} size="sm" className="!size-10 !rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{track.title}</span>
                    <span className="text-muted block truncate text-xs">{track.artist}</span>
                  </span>
                </div>
              ))}
            </div>

            <h2 className="mt-10 mb-4 text-xl font-bold">Most Played</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {mostPlayed.map(track => (
                <div
                  className="bg-card/50 dark:bg-card-dark/50 flex min-w-0 flex-col gap-3 rounded-lg p-3"
                  key={track.title}
                >
                  <div className="relative">
                    <div className={`aspect-square w-full rounded-md bg-gradient-to-br shadow-lg ${track.tone}`} />
                    <span className="absolute right-2 bottom-2 grid size-9 place-items-center rounded-full bg-black text-white shadow-lg dark:bg-white dark:text-black">
                      <Play className="size-4 translate-x-px fill-current" />
                    </span>
                  </div>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{track.title}</span>
                    <span className="text-muted block truncate text-xs">{track.artist}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <div className="border-divider dark:border-divider-dark absolute inset-x-0 bottom-0 hidden h-[4.5rem] items-center border-t bg-white px-4 opacity-85 sm:grid sm:grid-cols-[minmax(0,1fr)_2fr] sm:gap-4 lg:grid-cols-[minmax(0,1fr)_2fr_minmax(0,1fr)] dark:bg-[#181818]">
        <div className="flex min-w-0 items-center gap-3">
          <AlbumArt coverColor="from-blue-500 to-indigo-600" size="sm" className="!size-10 !rounded-sm lg:!size-14" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">Async Await</span>
            <span className="text-muted block truncate text-xs">Neon Pulse · Event Loop</span>
          </span>
        </div>
        <div className="flex w-full flex-col items-center gap-1">
          <div className="flex items-center gap-5">
            <SkipBack className="text-muted size-4" />
            <span className="grid size-8 place-items-center rounded-full bg-black text-white dark:bg-white dark:text-black">
              <Pause className="size-4 fill-current" />
            </span>
            <SkipForward className="text-muted size-4" />
          </div>
          <div className="flex w-full items-center gap-2">
            <span className="text-muted w-8 text-right text-[10px]">1:12</span>
            <span className="bg-divider dark:bg-divider-dark h-0.5 flex-1 rounded-full">
              <span className="block h-full w-1/3 rounded-full bg-black/60 dark:bg-white/60" />
            </span>
            <span className="text-muted w-8 text-[10px]">3:54</span>
          </div>
        </div>
        <div className="text-muted hidden items-center justify-end gap-2 lg:flex">
          <Volume2 className="size-3.5" />
          <span className="bg-divider dark:bg-divider-dark h-0.5 w-20 rounded-full">
            <span className="block h-full w-2/3 rounded-full bg-black/60 dark:bg-white/60" />
          </span>
        </div>
      </div>

      <div className="border-divider/70 dark:border-divider-dark/70 absolute inset-x-0 bottom-0 flex h-16 border-t bg-white sm:hidden dark:bg-[#181818]">
        {[
          [Home, 'Home'],
          [Search, 'Search'],
          [Library, 'Library'],
          [Heart, 'Liked'],
        ].map(([Icon, label], index) => (
          <span
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${index === 0 ? 'text-accent font-bold' : 'text-muted'}`}
            key={label as string}
          >
            <Icon className="size-5" />
            {label as string}
          </span>
        ))}
      </div>
    </div>
  );
}
