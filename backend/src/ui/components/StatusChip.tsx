import { PRIORITY_LABEL, STATUS_LABEL } from "@/ui/lib/format";
import type { DateTone } from "@/ui/lib/format";
import type { OpportunityStatus, Priority } from "@/ui/lib/types";

export function StatusChip({ status }: { status: OpportunityStatus }) {
  return (
    <span className="chip" data-status={status}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityChip({ priority }: { priority: Priority }) {
  return (
    <span className="chip" data-priority={priority}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function ToneChip({ tone, label }: { tone: DateTone; label: string }) {
  return (
    <span className="chip" data-tone={tone}>
      {label}
    </span>
  );
}
