export default function ShopLoading() {
  return (
    <div className="container-x py-6 sm:py-10">
      <div className="skeleton mb-6 h-9 w-44 rounded-md sm:mb-8 sm:h-10 sm:w-56" />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="skeleton h-5 w-32 rounded" />
        <div className="flex gap-2">
          <div className="skeleton h-9 w-24 rounded" />
          <div className="skeleton h-9 w-28 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-y-7 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="skeleton aspect-[5/6] w-full rounded-sm" />
            <div className="skeleton mx-auto h-4 w-3/4 rounded" />
            <div className="skeleton mx-auto h-4 w-1/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
