export default function PublicRouteLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className="min-h-screen px-4 pt-32 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex w-full max-w-295 animate-pulse flex-col gap-6">
        <div className="h-4 w-28 rounded-full bg-brand-soft/20" />
        <div className="h-12 w-full max-w-xl rounded-2xl bg-surface/70" />
        <div className="h-5 w-full max-w-2xl rounded-full bg-surface/50" />
        <div className="mt-8 h-72 rounded-3xl border border-border/40 bg-surface/45" />
      </div>
    </main>
  );
}
