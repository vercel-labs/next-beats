<div align="center">

<img src="public/logo.svg" alt="NextBeats" width="72" height="72" />

# NextBeats

A [Next.js 16.3](https://nextjs.org/blog/next-16-3) music player demo showcasing [Instant Navigations](https://nextjs.org/docs/app/guides/instant-navigation).

[**Live demo →**](https://next-beats.dev)

</div>

---

## Features

- **[Cache Components](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)** cache each query with `'use cache'`, name the data with `cacheTag`, and set its lifetime with `cacheLife`, so repeated reads come from the cache until a tag is invalidated.
- **[Partial Prefetching](https://nextjs.org/docs/app/guides/adopting-partial-prefetching)** prefetches one shared App Shell per route. Links with `prefetch={true}` also resolve dynamic `params` and `searchParams`, including the cached content behind them while uncached data streams after navigation.
- **[Hover-triggered prefetch](https://nextjs.org/docs/app/guides/prefetching)** delays URL-specific prefetches in long track lists until the pointer or focus reaches a link, avoiding a separate prefetch for every destination in view.
- **[Server Functions](https://nextjs.org/docs/app/getting-started/mutating-data)** run mutations such as favoriting a track or creating a playlist on the server, and invalidate only the tags they change with [`updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag), which re-prefetches the affected routes so they stay instant and reflect the change.
- **[React Compiler](https://react.dev/learn/react-compiler)** memoizes components and hooks automatically, so the code needs no manual `useMemo` or `useCallback`.
- **[View Transitions](https://nextjs.org/docs/app/guides/view-transitions)** animate content updates and route changes as you move through the player.
- **[Async React](https://github.com/rickhanlonii/async-react)** keeps the UI interactive during server work with `Suspense`, `useOptimistic`, `useTransition`, `useActionState`, `useFormStatus`, and `use`.
- **[vGPU](https://github.com/vercel-labs/vgpu) cover art** renders theme-matched WebGPU shaders that animate live and react to the playing track's beat. Compact covers are pre-rendered as WebP images so lists and the player can display them immediately.

## Getting started

NextBeats runs on Postgres. Set `DATABASE_URL` in `.env.local`, then:

```bash
pnpm install
pnpm run prisma.push
pnpm run prisma.seed
pnpm run dev
```

To regenerate a compact track, playlist, and genre cover from the current database:

```bash
pnpm covers:icons
```

<details>
<summary>Run locally without Postgres</summary>

Drop this prompt into your agent to swap the datasource for SQLite:

> Set up NextBeats to run locally on SQLite instead of Postgres. Swap `provider = "postgresql"` to `provider = "sqlite"` in `prisma/schema.prisma`. Replace `@prisma/adapter-pg` with `@prisma/adapter-better-sqlite3` in `lib/db.ts` and `prisma/seed.ts`, using `new PrismaBetterSqlite3({ url })` where `url` is `process.env.DATABASE_URL` with the `file:` prefix stripped. Remove any `mode: 'insensitive'` Prisma filter options since SQLite doesn't support them. Install `@prisma/adapter-better-sqlite3` and `better-sqlite3`, uninstall `@prisma/adapter-pg`, `pg`, and `@types/pg`. Write `DATABASE_URL=file:./prisma/dev.db` to `.env.local`.

The schema is otherwise identical, so the rest of the app behaves the same as production.

</details>

## Testing

The end-to-end tests use [`@next/playwright`](https://nextjs.org/docs/app/guides/testing/playwright) with the [`instant()`](https://preview.nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant) API to assert that loading states appear and that navigations stay instant, and they run in CI.

```bash
pnpm test:e2e
```

## Stack

- **[Next.js 16.3](https://nextjs.org/)**: App Router, Cache Components, Server Functions
- **[React 19](https://react.dev/)** with React Compiler: Suspense, View Transitions, `useOptimistic`
- **[TypeScript](https://www.typescriptlang.org/)** and **[Tailwind CSS v4](https://tailwindcss.com/)**
- **[Prisma 7](https://www.prisma.io/)** on PostgreSQL
- **[vGPU](https://github.com/vercel-labs/vgpu)** for animated WebGPU cover art and pre-rendered thumbnails
- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** for procedural per-genre synthesis

## License

[MIT](LICENSE)
