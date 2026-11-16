export default function SearchLoading() {
  return (
    <div className="content-full w-full min-w-0 py-6 sm:py-10">
      <div className="skeleton mx-auto mb-8 h-8 w-64 rounded" />
      <div className="grid w-full min-w-0 gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden space-y-4 lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 border-b border-line pb-4">
              <div className="skeleton h-4 w-28 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-5/6 rounded" />
              <div className="skeleton h-3 w-4/6 rounded" />
            </div>
          ))}
        </aside>
        <div className="min-w-0">
          <div className="mb-6 flex gap-6 border-b border-line pb-3">
            <div className="skeleton h-6 w-28 rounded" />
            <div className="skeleton h-6 w-28 rounded" />
          </div>
          <div className="mb-6 flex flex-wrap gap-2 border-b border-line pb-5">
            <div className="skeleton h-9 w-28 rounded" />
            <div className="skeleton h-9 w-24 rounded" />
            <div className="skeleton ml-auto h-9 w-40 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="skeleton aspect-[4/5] w-full rounded-sm" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/3 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
