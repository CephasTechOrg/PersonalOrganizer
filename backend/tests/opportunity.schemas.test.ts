import { describe, expect, it } from "vitest";
import {
  createOpportunitySchema,
  opportunityListQuerySchema,
} from "@/features/opportunities/opportunity.schemas";

describe("opportunity schemas", () => {
  it("accepts a minimal opportunity", () => {
    const result = createOpportunitySchema.parse({ title: "Example Program" });
    expect(result.status).toBe("saved");
    expect(result.type).toBe("program");
  });

  it("rejects malformed URLs", () => {
    expect(() =>
      createOpportunitySchema.parse({ title: "Example", applicationUrl: "not-a-url" }),
    ).toThrow();
  });

  it("applies list defaults", () => {
    const result = opportunityListQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
    expect(result.sort).toBe("deadline");
  });
});
