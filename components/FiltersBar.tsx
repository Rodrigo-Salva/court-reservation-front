"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Calendar, SlidersHorizontal, DollarSign } from "lucide-react";

const MAX_PRICE_CEILING = 200;

export function FiltersBar({
  date,
  maxPrice,
}: {
  date: string;
  maxPrice: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [price, setPrice] = useState(maxPrice);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/explorar?${params.toString()}`);
  }

  const hasFilters = searchParams.has("sport") || searchParams.has("maxPrice");

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-2xl border border-border bg-card p-4 text-sm shadow-sm">
      <div className="flex w-full flex-col gap-1 sm:w-44">
        <span className="text-[10px] text-muted-foreground font-bold uppercase">
          Fecha
        </span>
        <label className="flex items-center gap-2 font-semibold text-foreground cursor-pointer">
          <Calendar size={16} className="text-muted-foreground shrink-0" />
          <input
            type="date"
            defaultValue={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => updateParam("date", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 outline-none focus:border-primary [color-scheme:light] dark:[color-scheme:dark]"
          />
        </label>
      </div>

      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <span className="text-[10px] text-muted-foreground font-bold uppercase">
          Hasta S/ {price}
        </span>
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-muted-foreground shrink-0" />
          <input
            type="range"
            min={10}
            max={MAX_PRICE_CEILING}
            step={10}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            onPointerUp={(e) =>
              updateParam("maxPrice", (e.target as HTMLInputElement).value)
            }
            onKeyUp={(e) =>
              updateParam("maxPrice", (e.target as HTMLInputElement).value)
            }
            onTouchEnd={(e) =>
              updateParam("maxPrice", (e.target as HTMLInputElement).value)
            }
            className="w-full accent-primary"
          />
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={() => router.push("/explorar")}
          className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-border bg-card px-4 py-2 font-semibold transition-colors hover:bg-secondary"
        >
          <SlidersHorizontal size={16} />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
