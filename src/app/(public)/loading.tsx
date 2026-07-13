export default function PublicRouteLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className="px-4 sm:px-6 lg:px-8 pt-32 min-h-screen"
    >
      <div className="flex flex-col gap-6 mx-auto w-full max-w-295 animate-pulse">
        <div className="bg-brand-soft/20 rounded-full w-28 h-4" />
        <div className="bg-surface/70 rounded-2xl w-full max-w-xl h-12" />
        <div className="bg-surface/50 rounded-full w-full max-w-2xl h-5" />
        <div className="bg-surface/45 mt-8 border border-border/40 rounded-3xl h-72" />
      </div>
    </main>
  );
}
