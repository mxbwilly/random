"use client";

import { useRef, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PickerOption = { id: string; label: string; sub?: string; count?: number };
export type PickerValue = { id: string; label: string } | { create: string } | null;

/**
 * Search-as-you-type picker: choose an existing record from the school's
 * catalog or create a new one. `search` is a server action.
 */
export function EntityPicker({
  value,
  onChange,
  search,
  placeholder,
  createLabel,
  minChars = 2,
}: {
  value: PickerValue;
  onChange: (v: PickerValue) => void;
  search: (q: string) => Promise<PickerOption[]>;
  placeholder: string;
  createLabel: (q: string) => string;
  minChars?: number;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<PickerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  function onQueryChange(next: string) {
    setQuery(next);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    const q = next.trim();
    const mine = ++seq.current;
    if (q.length < minChars) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const hits = await search(q);
        if (mine === seq.current) setOptions(hits);
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 250);
  }

  if (value) {
    const label = "create" in value ? value.create : value.label;
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
        {"create" in value ? <Plus className="size-4 text-muted-foreground" /> : <Check className="size-4 text-green-600" />}
        <span className="flex-1 truncate">
          {label}
          {"create" in value && <span className="ml-2 text-xs text-muted-foreground">(new)</span>}
        </span>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Clear" onClick={() => { onChange(null); setQuery(""); setOptions([]); }}>
          <X />
        </Button>
      </div>
    );
  }

  const q = query.trim();
  const exact = options.some((o) => o.label.toLowerCase() === q.toLowerCase());
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="pl-9"
        autoComplete="off"
      />
      {open && q.length >= minChars && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover p-1 text-sm shadow-md">
          {options.map((o) => (
            <li key={o.id}>
              <button type="button" className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent"
                onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange({ id: o.id, label: o.label }); setOpen(false); }}>
                <span className="flex-1 truncate">
                  {o.label}
                  {o.sub && <span className="ml-2 text-muted-foreground">{o.sub}</span>}
                </span>
                {o.count !== undefined && <span className="text-xs text-muted-foreground">{o.count} exam{o.count === 1 ? "" : "s"}</span>}
              </button>
            </li>
          ))}
          {!exact && !loading && (
            <li>
              <button type="button" className={cn("flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent", options.length > 0 && "border-t mt-1 pt-2")}
                onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange({ create: q }); setOpen(false); }}>
                <Plus className="size-4" />{createLabel(q)}
              </button>
            </li>
          )}
          {loading && <li className="px-2 py-1.5 text-muted-foreground">Searching…</li>}
        </ul>
      )}
    </div>
  );
}
