<div align="center">

<img src="public/logo.svg" alt="NextBeats" width="72" height="72" />

# NextBeats

A [Next.js 16.3](https://nextjs.org/blog/next-16-3-instant-navigations) music player demonstrating [Instant Navigations](https://preview.nextjs.org/docs/app/guides/instant-navigation).

[**Live demo →**](https://next-beats.dev)

</div>

---

## Features

- **[Cache Components](https://preview.nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)** cache each query with `'use cache'`, name the data with `cacheTag`, and set its lifetime with `cacheLife`, so repeated reads come from the cache until a tag is invalidated.
- **[Partial Prefetching](https://preview.nextjs.org/docs/app/guides/adopting-partial-prefetching)** prefetches the shared App Shell of links as they enter the viewport, so navigation commits instantly and the data streams in behind it.
- **[Runtime prefetching](https://preview.nextjs.org/docs/app/guides/runtime-prefetching)** lets a link prefetch a route's per-request data with `<Link prefetch={true}>`, which resolves `searchParams` and dynamic `params` ahead of the click.
- **[Hover-triggered prefetch](https://preview.nextjs.org/docs/app/guides/prefetching#hover-triggered-prefetch)** defers a link's runtime prefetch until the pointer or focus reaches it, so a long list of tracks does not prefetch every destination on render.
- **[Server Functions](https://nextjs.org/docs/app/getting-started/mutating-data)** run mutations such as favoriting a track or creating a playlist on the server, and invalidate only the tags they change with [`updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag), which re-prefetches the affected routes so they stay instant and reflect the change.
- **[React Compiler](https://react.dev/learn/react-compiler)** memoizes components and hooks automatically, so the code needs no manual `useMemo` or `useCallback`.
- **[View Transitions](https://nextjs.org/docs/app/guides/view-transitions)** animate content updates and route changes as you move through the player.
- **[Async React](https://github.com/rickhanlonii/async-react)** keeps the UI interactive during server work with `Suspense`, `useOptimistic`, `useTransition`, `useActionState`, `useFormStatus`, and `use`.

## Getting started

NextBeats runs on Postgres. Set `DATABASE_URL` in `.env.local`, then:

```bash
pnpm install
pnpm run prisma.push
pnpm run prisma.seed
pnpm run dev
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

## Analyze

Inspect the client and server bundles with Next.js's [built-in Turbopack analyzer](https://nextjs.org/docs/app/guides/package-bundling):

```bash
pnpm analyze
```

## Stack

- **[Next.js 16.3](https://nextjs.org/)**: App Router, Cache Components, Server Functions
- **[React 19](https://react.dev/)** with React Compiler: Suspense, View Transitions, `useOptimistic`
- **[TypeScript](https://www.typescriptlang.org/)** and **[Tailwind CSS v4](https://tailwindcss.com/)**
- **[Prisma 7](https://www.prisma.io/)** on PostgreSQL
- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** for procedural per-genre synthesis

## License

[MIT](LICENSE)
