export default function PageSkeleton() {
  return (
    <div className="admin-skeleton-screen min-h-screen bg-[#f7f6f2] p-5 text-brand-teal md:p-8" role="status" aria-label="Loading Daily Bread admin workspace">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1500px] gap-5 lg:grid-cols-[18rem_1fr]">
        <aside className="rounded-[1.75rem] bg-brand-teal p-5 shadow-xl shadow-brand-teal/10">
          <div className="admin-skeleton-block h-3 w-24 rounded-full bg-white/20" />
          <div className="admin-skeleton-block mt-4 h-7 w-40 rounded-lg bg-white/20" />
          <div className="mt-10 space-y-7">
            {["w-20", "w-28", "w-24", "w-32"].map((width, index) => (
              <div key={index} className="space-y-3">
                <div className={`admin-skeleton-block h-2 ${width} rounded-full bg-white/15`} />
                <div className="admin-skeleton-block h-10 w-full rounded-xl bg-white/10" />
                <div className="admin-skeleton-block h-10 w-11/12 rounded-xl bg-white/10" />
              </div>
            ))}
          </div>
        </aside>
        <main className="rounded-[1.75rem] border border-black/5 bg-[#fbfaf7] p-5 shadow-sm md:p-8 lg:p-10">
          <div className="flex items-end justify-between gap-5">
            <div className="space-y-3">
              <div className="admin-skeleton-block h-3 w-32 rounded-full" />
              <div className="admin-skeleton-block h-10 w-64 rounded-xl" />
            </div>
            <div className="hidden space-y-2 text-right sm:block">
              <div className="admin-skeleton-block ml-auto h-3 w-36 rounded-full" />
              <div className="admin-skeleton-block ml-auto h-2 w-24 rounded-full" />
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="admin-skeleton-block h-32 rounded-2xl" />)}
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <div className="admin-skeleton-block h-72 rounded-2xl" />
            <div className="admin-skeleton-block h-72 rounded-2xl" />
          </div>
        </main>
      </div>
      <span className="sr-only">Loading admin workspace…</span>
    </div>
  );
}
