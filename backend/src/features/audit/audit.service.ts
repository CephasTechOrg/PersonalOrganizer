import { getDb } from "@/lib/db";
import { auditLogs } from "@/db/schema";

type AuditInput = {
  entityType: "opportunity" | "task" | "auth";
  entityId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
};

export async function recordAudit(input: AuditInput) {
  const db = getDb();
  await db.insert(auditLogs).values({
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    action: input.action,
    metadata: input.metadata,
  });
}
