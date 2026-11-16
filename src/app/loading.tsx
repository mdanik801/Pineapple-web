export default function RootLoading() {
  return (
    <div className="min-h-[50vh]">
      <div className="skeleton aspect-[4/5] w-full sm:aspect-[16/8] lg:aspect-[16/7]" />
      <div className="content-full py-10 space-y-8">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 lg:grid-cols-4 lg:gap-x-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="skeleton aspect-[3/4] w-full rounded-sm" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
