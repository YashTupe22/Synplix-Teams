"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateRangePreset } from "@/types/analytics";

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

interface DateRangePickerProps {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
  disabled?: boolean;
}

export function DateRangePicker({ value, onChange, disabled }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const handleCustomApply = useCallback(() => {
    if (customFrom && customTo) {
      onChange("custom");
    }
  }, [customFrom, customTo, onChange]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
        {PRESETS.map((preset) => (
          <Button
            key={preset.value}
            variant={value === preset.value ? "default" : "ghost"}
            size="xs"
            onClick={() => {
              onChange(preset.value);
              setShowCustom(false);
            }}
            disabled={disabled}
            className="h-7 text-xs"
          >
            {preset.label}
          </Button>
        ))}
        <Button
          variant={value === "custom" ? "default" : "ghost"}
          size="xs"
          onClick={() => setShowCustom(!showCustom)}
          disabled={disabled}
          className="h-7 text-xs"
        >
          Custom
        </Button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs"
          />
          <Button
            size="xs"
            onClick={handleCustomApply}
            disabled={!customFrom || !customTo}
            className="h-7 text-xs"
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
