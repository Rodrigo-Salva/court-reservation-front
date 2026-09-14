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
    <div className="flex items-center gap-6 text-sm">
      <div className="flex flex-col gap-1 w-40">
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
            className="bg-transparent outline-none w-full [color-scheme:light] dark:[color-scheme:dark]"
          />
        </label>
      </div>

      <div className="flex-1 flex flex-col gap-1">
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
            onMouseUp={(e) =>
              updateParam("maxPrice", (e.target as HTMLInputElement).value)
            }
            onTouchEnd={(e) =>
              updateParam("maxPrice", (e.target as HTMLInputElement).value)
            }
            className="w-full accent-[#22c55e]"
          />
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={() => router.push("/explorar")}
          className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl font-semibold hover:bg-secondary/80 transition-colors whitespace-nowrap"
        >
          <SlidersHorizontal size={16} />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
