import React from "react";
import type { InsightRange } from "../../core/api/endpoints";
import { Segmented } from "../../ui/Segmented";

// Ported from web RangeFilter: 7d / 30d / 90d / All segmented control.
export function RangeFilter({ value, onChange }: { value: InsightRange; onChange: (v: InsightRange) => void }) {
  return (
    <Segmented<InsightRange>
      value={value}
      onChange={onChange}
      options={[
        { value: "7d", label: "7d" },
        { value: "30d", label: "30d" },
        { value: "90d", label: "90d" },
        { value: "all", label: "All" }
      ]}
    />
  );
}
