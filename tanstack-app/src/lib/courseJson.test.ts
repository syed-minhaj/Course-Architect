import { describe, expect, it } from "vitest";
import { filterValidSelections, selectionsSchema } from "./courseJson";

const course = {
    chapters: [
        {
            modules: [
                {
                    external_resources: [
                        { type: "youtube video" },
                        { type: "article" },
                        { type: "youtube video" },
                    ],
                },
                {
                    external_resources: [{ type: "youtube video" }],
                },
            ],
        },
        { modules: [] },
    ],
};

describe("filterValidSelections", () => {
    it("keeps selections pointing at existing youtube video resources", () => {
        const kept = filterValidSelections(course, [
            { chapterIdx: 0, moduleIdx: 0, resIdx: 0, id: "vid1", title: "T1" },
        ]);
        expect(kept).toEqual([{ chapterIdx: 0, moduleIdx: 0, resIdx: 0, id: "vid1", title: "T1" }]);
    });

    it("drops out-of-bounds chapter/module/resource indexes instead of crashing", () => {
        const kept = filterValidSelections(course, [
            { chapterIdx: 9, moduleIdx: 0, resIdx: 0, id: "a", title: "x" },
            { chapterIdx: 0, moduleIdx: 9, resIdx: 0, id: "a", title: "x" },
            { chapterIdx: 0, moduleIdx: 0, resIdx: 9, id: "a", title: "x" },
        ]);
        expect(kept).toEqual([]);
    });

    it("drops non-youtube resources and empty ids/titles", () => {
        const kept = filterValidSelections(course, [
            { chapterIdx: 0, moduleIdx: 0, resIdx: 1, id: "valid", title: "T" },
            { chapterIdx: 0, moduleIdx: 0, resIdx: 0, id: "", title: "T" },
            { chapterIdx: 0, moduleIdx: 0, resIdx: 2, id: "vid", title: "" },
        ]);
        expect(kept).toEqual([]);
    });

    it("keeps only the valid selections in a mixed batch", () => {
        const kept = filterValidSelections(course, [
            { chapterIdx: 0, moduleIdx: 0, resIdx: 0, id: "v1", title: "T1" },
            { chapterIdx: 0, moduleIdx: 0, resIdx: 1, id: "v2", title: "T2" },
            { chapterIdx: 1, moduleIdx: 3, resIdx: 0, id: "v3", title: "T3" },
        ]);
        expect(kept).toEqual([{ chapterIdx: 0, moduleIdx: 0, resIdx: 0, id: "v1", title: "T1" }]);
    });
});

describe("selectionsSchema", () => {
    it("parses an envelope with selections", () => {
        const parsed = selectionsSchema.safeParse({
            selections: [{ chapterIdx: 0, moduleIdx: 0, resIdx: 0, id: "v", title: "T" }],
        });
        expect(parsed.success).toBe(true);
    });

    it("accepts an empty selections array", () => {
        const parsed = selectionsSchema.safeParse({ selections: [] });
        expect(parsed.success).toBe(true);
        if (parsed.success) expect(parsed.data.selections).toEqual([]);
    });

    it("tolerates a missing selections key (defaulting to empty)", () => {
        const parsed = selectionsSchema.safeParse({});
        expect(parsed.success).toBe(true);
        if (parsed.success) expect(parsed.data.selections).toEqual([]);
    });
});
