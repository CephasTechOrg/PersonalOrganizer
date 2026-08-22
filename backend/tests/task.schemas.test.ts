import { describe, expect, it } from "vitest";
import { createTaskSchema } from "@/features/tasks/task.schemas";

describe("task schemas", () => {
  it("accepts a minimal task", () => {
    const result = createTaskSchema.parse({ title: "Finish application" });
    expect(result.status).toBe("todo");
    expect(result.priority).toBe("normal");
  });

  it("rejects an invalid opportunity id", () => {
    expect(() =>
      createTaskSchema.parse({ title: "Finish application", opportunityId: "bad-id" }),
    ).toThrow();
  });
});
