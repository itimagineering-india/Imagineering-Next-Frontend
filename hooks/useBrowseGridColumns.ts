import { useState, useEffect } from "react";

/** Browse grid: 1 col on mobile, matches grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4. */
export function useBrowseGridColumns(): number {
  const [cols, setCols] = useState(1);
  useEffect(() => {
    const q4 = window.matchMedia("(min-width: 1024px)");
    const q3 = window.matchMedia("(min-width: 768px)");
    const q2 = window.matchMedia("(min-width: 640px)");
    const update = () => {
      if (q4.matches) setCols(4);
      else if (q3.matches) setCols(3);
      else if (q2.matches) setCols(2);
      else setCols(1);
    };
    update();
    q4.addEventListener("change", update);
    q3.addEventListener("change", update);
    q2.addEventListener("change", update);
    return () => {
      q4.removeEventListener("change", update);
      q3.removeEventListener("change", update);
      q2.removeEventListener("change", update);
    };
  }, []);
  return cols;
}

/** Map sidebar: grid-cols-2 lg:grid-cols-5 */
export function useMapSidebarColumns(): number {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setCols(mq.matches ? 5 : 2);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return cols;
}
