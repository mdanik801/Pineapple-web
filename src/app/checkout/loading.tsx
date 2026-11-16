export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-line bg-white py-3 sm:py-4">
        <div className="skeleton mx-auto h-10 w-32 rounded" />
      </div>
      <div className="grid lg:grid-cols-2">
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:flex lg:justify-end lg:pr-14 lg:pt-10">
          <div className="w-full max-w-[520px] space-y-6">
            <div className="skeleton h-7 w-28 rounded" />
            <div className="skeleton h-12 w-full rounded" />
            <div className="skeleton h-12 w-full rounded" />
            <div className="skeleton h-7 w-28 rounded pt-2" />
            <div className="grid grid-cols-2 gap-3">
              <div className="skeleton h-12 w-full rounded" />
              <div className="skeleton h-12 w-full rounded" />
            </div>
            <div className="skeleton h-12 w-full rounded" />
            <div className="grid grid-cols-2 gap-3">
              <div className="skeleton h-12 w-full rounded" />
              <div className="skeleton h-12 w-full rounded" />
            </div>
            <div className="skeleton h-14 w-full rounded" />
          </div>
        </div>
        <aside className="hidden border-l border-line bg-[#f8faf9] px-8 py-10 lg:block xl:px-14">
          <div className="max-w-[460px] space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-16 w-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
            <div className="skeleton h-24 w-full rounded" />
          </div>
        </aside>
      </div>
    </div>
  );
}
