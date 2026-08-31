import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';

const url = process.env.DATABASE_URL!.replace(/^file:/, '');
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

type SeedTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre: string;
  coverColor: string;
  playCount: number;
  createdAt: Date;
};

const now = Date.now();
const day = 86_400_000;

const TRACKS: SeedTrack[] = [
  // Electronic
  {
    album: 'Event Loop',
    artist: 'Neon Pulse',
    coverColor: 'from-blue-500 to-indigo-600',
    createdAt: new Date(now - 2 * day),
    duration: 234,
    genre: 'electronic',
    id: 't1',
    playCount: 1842,
    title: 'Async Await',
  },
  {
    album: 'Event Loop',
    artist: 'Neon Pulse',
    coverColor: 'from-sky-400 to-blue-500',
    createdAt: new Date(now - 2 * day),
    duration: 198,
    genre: 'electronic',
    id: 't2',
    playCount: 923,
    title: 'WebSocket Sunset',
  },
  {
    album: 'Streaming',
    artist: 'Chrome Echo',
    coverColor: 'from-blue-400 to-cyan-500',
    createdAt: new Date(now - 5 * day),
    duration: 267,
    genre: 'electronic',
    id: 't3',
    playCount: 2105,
    title: 'Server Sent Vibes',
  },
  {
    album: 'Streaming',
    artist: 'Chrome Echo',
    coverColor: 'from-indigo-400 to-blue-500',
    createdAt: new Date(now - 5 * day),
    duration: 312,
    genre: 'electronic',
    id: 't4',
    playCount: 1567,
    title: 'Hydration',
  },
  {
    album: 'Dev Mode',
    artist: 'Axiom',
    coverColor: 'from-sky-500 to-indigo-600',
    createdAt: new Date(now - 1 * day),
    duration: 245,
    genre: 'electronic',
    id: 't5',
    playCount: 3201,
    title: 'Hot Module Reload',
  },
  // Indie
  {
    album: 'Soft Deploy',
    artist: 'Paper Lanterns',
    coverColor: 'from-blue-300 to-sky-500',
    createdAt: new Date(now - 3 * day),
    duration: 213,
    genre: 'indie',
    id: 't6',
    playCount: 876,
    title: 'Localhost Morning',
  },
  {
    album: 'Soft Deploy',
    artist: 'Paper Lanterns',
    coverColor: 'from-cyan-400 to-sky-500',
    createdAt: new Date(now - 3 * day),
    duration: 189,
    genre: 'indie',
    id: 't7',
    playCount: 654,
    title: 'README Love Letter',
  },
  {
    album: 'Pull Request',
    artist: 'Velvet Morning',
    coverColor: 'from-indigo-500 to-blue-600',
    createdAt: new Date(now - 7 * day),
    duration: 227,
    genre: 'indie',
    id: 't8',
    playCount: 1432,
    title: 'Open Source Crush',
  },
  {
    album: 'Pull Request',
    artist: 'Velvet Morning',
    coverColor: 'from-sky-300 to-blue-400',
    createdAt: new Date(now - 7 * day),
    duration: 256,
    genre: 'indie',
    id: 't9',
    playCount: 987,
    title: 'Sunday Deploy',
  },
  {
    album: 'Dependencies',
    artist: 'Fern & Ivy',
    coverColor: 'from-blue-600 to-indigo-700',
    createdAt: new Date(now - 10 * day),
    duration: 201,
    genre: 'indie',
    id: 't10',
    playCount: 1123,
    title: 'npm install feelings',
  },
  // Hip-Hop
  {
    album: 'Production Ready',
    artist: 'BLKSMTH',
    coverColor: 'from-slate-500 to-blue-700',
    createdAt: new Date(now - 1 * day),
    duration: 194,
    genre: 'hip-hop',
    id: 't11',
    playCount: 4521,
    title: 'Ship It',
  },
  {
    album: 'Production Ready',
    artist: 'BLKSMTH',
    coverColor: 'from-indigo-600 to-blue-800',
    createdAt: new Date(now - 1 * day),
    duration: 218,
    genre: 'hip-hop',
    id: 't12',
    playCount: 3876,
    title: 'Stack Overflow Flow',
  },
  {
    album: 'Debug Mode',
    artist: 'SyntaxErr',
    coverColor: 'from-blue-500 to-sky-600',
    createdAt: new Date(now - 4 * day),
    duration: 242,
    genre: 'hip-hop',
    id: 't13',
    playCount: 2987,
    title: '3 AM Push',
  },
  {
    album: 'Debug Mode',
    artist: 'SyntaxErr',
    coverColor: 'from-cyan-500 to-blue-600',
    createdAt: new Date(now - 4 * day),
    duration: 176,
    genre: 'hip-hop',
    id: 't14',
    playCount: 2145,
    title: 'Merge Conflict',
  },
  {
    album: 'No Regrets',
    artist: 'Null Pointer',
    coverColor: 'from-sky-500 to-blue-600',
    createdAt: new Date(now - 6 * day),
    duration: 208,
    genre: 'hip-hop',
    id: 't15',
    playCount: 1654,
    title: 'git push --force',
  },
  // Pop
  {
    album: 'Responsive',
    artist: 'Luna Park',
    coverColor: 'from-blue-400 to-indigo-500',
    createdAt: new Date(now - 0.5 * day),
    duration: 195,
    genre: 'pop',
    id: 't16',
    playCount: 5432,
    title: 'Pixel Perfect',
  },
  {
    album: 'Responsive',
    artist: 'Luna Park',
    coverColor: 'from-indigo-400 to-sky-500',
    createdAt: new Date(now - 0.5 * day),
    duration: 221,
    genre: 'pop',
    id: 't17',
    playCount: 4321,
    title: 'Tailwind Hearts',
  },
  {
    album: 'Render Cycle',
    artist: 'Prism',
    coverColor: 'from-sky-400 to-cyan-500',
    createdAt: new Date(now - 2 * day),
    duration: 237,
    genre: 'pop',
    id: 't18',
    playCount: 3654,
    title: 'Component Chemistry',
  },
  {
    album: 'Render Cycle',
    artist: 'Prism',
    coverColor: 'from-blue-300 to-indigo-400',
    createdAt: new Date(now - 2 * day),
    duration: 189,
    genre: 'pop',
    id: 't19',
    playCount: 2876,
    title: 'Type Safe Love',
  },
  {
    album: 'Core Web Vitals',
    artist: 'Morning Glow',
    coverColor: 'from-indigo-500 to-blue-700',
    createdAt: new Date(now - 8 * day),
    duration: 214,
    genre: 'pop',
    id: 't20',
    playCount: 1987,
    title: 'First Contentful Paint',
  },
  // Lo-fi
  {
    album: 'Sunday Deploys',
    artist: 'Rainfall',
    coverColor: 'from-blue-500 to-slate-600',
    createdAt: new Date(now - 3 * day),
    duration: 278,
    genre: 'lo-fi',
    id: 't21',
    playCount: 2543,
    title: 'Slow Build',
  },
  {
    album: 'Sunday Deploys',
    artist: 'Rainfall',
    coverColor: 'from-sky-600 to-blue-700',
    createdAt: new Date(now - 3 * day),
    duration: 302,
    genre: 'lo-fi',
    id: 't22',
    playCount: 1876,
    title: 'Console Calm',
  },
  {
    album: 'Dev Diary',
    artist: 'Tape Hiss',
    coverColor: 'from-cyan-400 to-blue-500',
    createdAt: new Date(now - 12 * day),
    duration: 264,
    genre: 'lo-fi',
    id: 't23',
    playCount: 1234,
    title: 'Soft Reset',
  },
  {
    album: 'Dev Diary',
    artist: 'Tape Hiss',
    coverColor: 'from-blue-400 to-sky-500',
    createdAt: new Date(now - 12 * day),
    duration: 231,
    genre: 'lo-fi',
    id: 't24',
    playCount: 1567,
    title: 'Idle Thread',
  },
  {
    album: 'Downtime',
    artist: 'Dusty Vinyl',
    coverColor: 'from-indigo-300 to-blue-400',
    createdAt: new Date(now - 15 * day),
    duration: 198,
    genre: 'lo-fi',
    id: 't25',
    playCount: 987,
    title: 'npm install sleep',
  },
  // Synthwave
  {
    album: 'After Dark',
    artist: 'Grid Runner',
    coverColor: 'from-blue-600 to-indigo-800',
    createdAt: new Date(now - 6 * day),
    duration: 345,
    genre: 'synthwave',
    id: 't26',
    playCount: 876,
    title: 'Neon Terminal',
  },
  {
    album: 'After Dark',
    artist: 'Grid Runner',
    coverColor: 'from-sky-500 to-indigo-600',
    createdAt: new Date(now - 6 * day),
    duration: 298,
    genre: 'synthwave',
    id: 't27',
    playCount: 654,
    title: 'Retro Compiler',
  },
  {
    album: 'Digital Sunset',
    artist: 'LaserType',
    coverColor: 'from-blue-500 to-cyan-600',
    createdAt: new Date(now - 9 * day),
    duration: 276,
    genre: 'synthwave',
    id: 't28',
    playCount: 543,
    title: 'Cyber Monday',
  },
  {
    album: 'Digital Sunset',
    artist: 'LaserType',
    coverColor: 'from-indigo-400 to-blue-600',
    createdAt: new Date(now - 9 * day),
    duration: 312,
    genre: 'synthwave',
    id: 't29',
    playCount: 432,
    title: 'Chrome Dreams',
  },
  {
    album: 'Production Mode',
    artist: 'Scanline',
    coverColor: 'from-cyan-500 to-indigo-600',
    createdAt: new Date(now - 14 * day),
    duration: 287,
    genre: 'synthwave',
    id: 't30',
    playCount: 765,
    title: 'Midnight Deploy',
  },
  // Extra electronic
  {
    album: 'Event Loop',
    artist: 'Neon Pulse',
    coverColor: 'from-cyan-500 to-blue-600',
    createdAt: new Date(now - 16 * day),
    duration: 224,
    genre: 'electronic',
    id: 't31',
    playCount: 612,
    title: 'Race Condition',
  },
  {
    album: 'Concurrency',
    artist: 'Chrome Echo',
    coverColor: 'from-blue-500 to-indigo-600',
    createdAt: new Date(now - 17 * day),
    duration: 256,
    genre: 'electronic',
    id: 't32',
    playCount: 489,
    title: 'Deadlock',
  },
  {
    album: 'Streams',
    artist: 'Subroutine',
    coverColor: 'from-sky-500 to-cyan-600',
    createdAt: new Date(now - 18 * day),
    duration: 301,
    genre: 'electronic',
    id: 't33',
    playCount: 412,
    title: 'Backpressure',
  },
  // Extra indie
  {
    album: 'Pull Request',
    artist: 'Margin Notes',
    coverColor: 'from-sky-400 to-blue-500',
    createdAt: new Date(now - 19 * day),
    duration: 198,
    genre: 'indie',
    id: 't34',
    playCount: 587,
    title: 'Commit Message',
  },
  {
    album: 'Lost Commits',
    artist: 'Reflog',
    coverColor: 'from-blue-400 to-indigo-500',
    createdAt: new Date(now - 21 * day),
    duration: 267,
    genre: 'indie',
    id: 't36',
    playCount: 432,
    title: 'Force Push',
  },
  // Extra hip-hop
  {
    album: 'Memoize',
    artist: 'BLKSMTH',
    coverColor: 'from-indigo-500 to-blue-600',
    createdAt: new Date(now - 22 * day),
    duration: 187,
    genre: 'hip-hop',
    id: 't37',
    playCount: 891,
    title: 'Cache Hit',
  },
  {
    album: 'Segfault',
    artist: 'Null Pointer',
    coverColor: 'from-blue-600 to-indigo-700',
    createdAt: new Date(now - 24 * day),
    duration: 245,
    genre: 'hip-hop',
    id: 't39',
    playCount: 654,
    title: 'Null Pointer',
  },
  // Extra pop
  {
    album: 'Velocity',
    artist: 'Sprint Velocity',
    coverColor: 'from-sky-400 to-cyan-500',
    createdAt: new Date(now - 25 * day),
    duration: 189,
    genre: 'pop',
    id: 't40',
    playCount: 1203,
    title: 'Vibe Coding',
  },
  {
    album: 'LGTM',
    artist: 'Code Review',
    coverColor: 'from-blue-300 to-sky-400',
    createdAt: new Date(now - 27 * day),
    duration: 195,
    genre: 'pop',
    id: 't42',
    playCount: 843,
    title: 'PR Approved',
  },
  // Extra lo-fi
  {
    album: 'Dev Server',
    artist: 'Port 3000',
    coverColor: 'from-cyan-400 to-sky-500',
    createdAt: new Date(now - 28 * day),
    duration: 278,
    genre: 'lo-fi',
    id: 't43',
    playCount: 562,
    title: 'Localhost Lullaby',
  },
  {
    album: 'Postmortem',
    artist: 'Heap Dump',
    coverColor: 'from-blue-500 to-sky-600',
    createdAt: new Date(now - 29 * day),
    duration: 312,
    genre: 'lo-fi',
    id: 't44',
    playCount: 478,
    title: 'Stack Trace',
  },
  // Extra synthwave
  {
    album: 'Retro Mode',
    artist: 'VHS Stack',
    coverColor: 'from-indigo-500 to-blue-700',
    createdAt: new Date(now - 31 * day),
    duration: 298,
    genre: 'synthwave',
    id: 't46',
    playCount: 689,
    title: 'CRT Glow',
  },
  {
    album: '56k',
    artist: 'Dial-Up',
    coverColor: 'from-blue-600 to-indigo-800',
    createdAt: new Date(now - 32 * day),
    duration: 245,
    genre: 'synthwave',
    id: 't47',
    playCount: 534,
    title: 'Modem Handshake',
  },
  {
    album: 'POST',
    artist: 'Kernel Panic',
    coverColor: 'from-slate-500 to-blue-700',
    createdAt: new Date(now - 33 * day),
    duration: 271,
    genre: 'synthwave',
    id: 't48',
    playCount: 467,
    title: 'BIOS Boot',
  },
];

type SeedPlaylist = {
  id: string;
  name: string;
  description: string;
  coverColor: string;
  trackIds: string[];
};

const PLAYLISTS: SeedPlaylist[] = [
  {
    coverColor: 'from-violet-500 to-purple-600',
    description: 'Beats for the midnight commit.',
    id: 'pl1',
    name: 'Late Night Coding',
    trackIds: ['t21', 't22', 't24', 't25', 't9'],
  },
  {
    coverColor: 'from-purple-400 to-violet-500',
    description: 'Start the day right.',
    id: 'pl2',
    name: 'Morning Vibes',
    trackIds: ['t6', 't7', 't16', 't17', 't23', 't20'],
  },
  {
    coverColor: 'from-fuchsia-500 to-purple-600',
    description: 'Turn it up to eleven.',
    id: 'pl3',
    name: 'High Energy',
    trackIds: ['t5', 't3', 't26', 't27', 't28', 't30', 't11', 't15'],
  },
];

async function main() {
  console.log('Seeding music player database...');

  await prisma.userTrackPlay.deleteMany();
  await prisma.userFavorite.deleteMany();
  await prisma.playlistTrack.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.track.deleteMany();
  await prisma.user.deleteMany();

  for (const t of TRACKS) {
    await prisma.track.create({ data: t });
  }
  console.log(`  ${TRACKS.length} tracks created`);

  for (const pl of PLAYLISTS) {
    await prisma.playlist.create({
      data: {
        coverColor: pl.coverColor,
        createdAt: new Date(),
        description: pl.description,
        id: pl.id,
        name: pl.name,
      },
    });
    for (let i = 0; i < pl.trackIds.length; i++) {
      await prisma.playlistTrack.create({
        data: {
          playlistId: pl.id,
          position: i,
          trackId: pl.trackIds[i],
        },
      });
    }
  }
  console.log(`  ${PLAYLISTS.length} playlists created`);

  await prisma.user.create({ data: { id: 'e2e', name: 'E2E Tester' } });
  console.log('  e2e test user created');

  console.log('Seed complete.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
