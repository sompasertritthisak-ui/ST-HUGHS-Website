import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-x flex min-h-dvh flex-col items-start justify-center py-24">
      <p className="eyebrow eyebrow-rule">404</p>
      <h1 className="font-display mt-6 text-[clamp(2.5rem,6vw,5rem)] text-fg">This route does not exist yet.</h1>
      <p className="mt-6 max-w-lg text-fg-muted">The page you were looking for has moved or was never published. Start again from the origin.</p>
      <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-[var(--radius-sm)] bg-brand px-6 text-ink">
        Back to home
      </Link>
    </main>
  );
}
