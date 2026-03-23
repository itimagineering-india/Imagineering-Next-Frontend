import { LocationSearchBar } from "./LocationSearchBar";

export function SearchBarSection() {
  return (
    <section className="relative px-4 sm:px-6 md:px-6 lg:px-8 py-3.5 -mt-6 sm:-mt-8 md:-mt-10 lg:-mt-12 z-20">
      <div className="max-w-7xl mx-auto">
        <LocationSearchBar />
      </div>
    </section>
  );
}
