import { getCategories } from "@/lib/api";

export async function SearchSection() {
  const categories = await getCategories();

  return (
    <section className="relative z-10 -mt-6 px-4 py-4 sm:-mt-8 sm:px-6 md:-mt-10 md:px-8 lg:-mt-12 lg:px-12">
      <div className="mx-auto max-w-5xl rounded-2xl border border-border/60 bg-white p-3 shadow-[0_20px_40px_rgba(15,23,42,0.15)] sm:p-4 md:p-5 lg:p-6">
        <form
          action="/search"
          method="get"
          className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4"
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Location
            </label>
            <input
              type="text"
              name="location"
              placeholder="Enter a location or postal code *"
              className="h-10 w-full rounded-md border border-input px-3 text-xs md:h-11 md:text-sm"
              required
            />
          </div>

          <div className="w-full md:w-56">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Category
            </label>
            <select
              name="category"
              className="h-10 w-full rounded-md border border-input px-3 text-xs md:h-11 md:text-sm"
              required
            >
              <option value="">Category *</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex w-full items-center justify-end gap-2 md:w-auto">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full border border-gray-300 bg-white px-3 text-[11px] font-medium text-gray-800 hover:bg-gray-50 md:h-11 md:px-4 md:text-xs"
            >
              Use Location
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#ff6b81] px-4 text-[11px] font-medium text-white shadow-sm hover:bg-[#ff4b6d] md:h-11 md:px-5 md:text-xs"
            >
              Search for Services
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}


