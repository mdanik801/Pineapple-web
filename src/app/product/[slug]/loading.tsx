export default function ProductLoading() {
  return (
    <div className="content-full py-6 sm:py-8 md:py-12">
      <div className="mb-6 flex gap-2 sm:mb-8">
        <div className="skeleton h-3 w-10 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 xl:gap-14">
        <div className="flex flex-col-reverse gap-2.5 sm:gap-3 md:flex-row min-w-0">
          <div className="hidden gap-2 md:flex md:flex-col">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[4/5] w-20 rounded-xs" />
            ))}
          </div>
          <div className="skeleton relative aspect-[4/5] w-full rounded-xs" />
        </div>
        <div className="min-w-0 space-y-4">
          <div className="skeleton h-8 w-3/4 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-10 w-44 rounded" />
          <div className="space-y-2 pt-4">
            <div className="skeleton h-10 w-full rounded" />
            <div className="skeleton h-10 w-full rounded" />
            <div className="skeleton h-12 w-full rounded" />
          </div>
          <div className="space-y-2 pt-4">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
