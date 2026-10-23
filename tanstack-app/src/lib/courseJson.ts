import { z } from "zod";

export const selectionsSchema = z.object({
    selections: z
        .array(
            z.object({
                chapterIdx: z.number(),
                moduleIdx: z.number(),
                resIdx: z.number(),
                id: z.string(),
                title: z.string(),
            }),
        )
        .default([]),
});

export type VideoSelection = z.infer<typeof selectionsSchema>["selections"][number];

type ResourceLike = { type: string };

type ModuleLike = {
    external_resources: Array<ResourceLike | undefined>;
};

type ChapterLike = {
    modules: Array<ModuleLike | undefined>;
};

export type CourseWithResources = {
    chapters: Array<ChapterLike | undefined>;
};

export function filterValidSelections(
    course: CourseWithResources,
    selections: ReadonlyArray<VideoSelection>,
): Array<VideoSelection> {
    const valid: Array<VideoSelection> = [];
    for (const sel of selections) {
        const resource = course.chapters[sel.chapterIdx]?.modules[sel.moduleIdx]?.external_resources[sel.resIdx];
        if (!resource || resource.type !== "youtube video") continue;
        if (sel.id === "" || sel.title === "") continue;
        valid.push(sel);
    }
    return valid;
}
