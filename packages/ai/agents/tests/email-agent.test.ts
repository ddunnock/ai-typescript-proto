// packages/agents/tests/email-agent.test.ts
import { describe, it, expect, vi } from "vitest";
import { EmailAgent } from "../src/email-agent";

describe("EmailAgent", () => {
    it("should categorize emails correctly", async () => {
        const mockProvider = createMockProvider({
            response: "Category: Work",
        });

        const agent = new EmailAgent(mockProvider);
        const result = await agent.execute({
            id: "test_1",
            type: "categorize",
            data: { content: "Q3 report attached" },
            createdAt: new Date(),
        });

        expect(result.success).toBe(true);
        expect(result.data.response).toContain("Work");
    });
});