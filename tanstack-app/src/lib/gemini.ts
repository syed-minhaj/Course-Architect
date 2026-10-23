"use server";
import { ApiError, GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { getOtherUrl, getYoutubeTop10Result } from "./resourseURL";
import { parseJsonFromLlm, stripMarkdownFences, textFromCandidate } from "./llmJson";
import { filterValidSelections, selectionsSchema } from "./courseJson";
import type { YoutubeSearchItem } from "./resourseURL";
import type { GenerateContentResponse } from "@google/genai";
import type { courseType } from "@/types";

export const chapterSchema = z.object({
    "title": z.string(),
    "modules": z.array(z.object({
        "title": z.string(),
        "conceptual_deep_dive": z.string(),
        "external_resources": z.array(z.object({
            "type": z.enum(["article", "youtube video", "podcast"]),
            "title": z.string(),
            "url": z.string()
        })).default([]),
        "assessment": z.object({
            "primary_mission": z.object({
                "title": z.string(),
                "instructions": z.string(),
                "rubric": z.array(z.string()).default([])
            }),
            "quick_quiz": z.array(z.object({
                "question": z.string(),
                "options": z.array(z.string()),
                "answer": z.string()
            })).default([])
        })
    }))
})

export const courseSchema = z.object({
    "course_title": z.string(),
    "intro_summary": z.string(),
    "chapters": z.array(chapterSchema),
})

export const STAGES = [
    "GEMINI_COURSE_REQUEST",
    "JSON_PARSE_COURSE",
    "ZOD_COURSE",
    "YT_SEARCH",
    "GEMINI_SELECTION_REQUEST",
    "JSON_PARSE_SELECTION",
    "ZOD_SELECTION",
    "URL_VALIDATE",
    "UNEXPECTED",
] as const;

export type Stage = typeof STAGES[number];

export class StageError extends Error {
    public readonly stage: Stage;

    constructor(stage: Stage, message: string) {
        super(message);
        this.name = "StageError";
        this.stage = stage;
    }
}

type CourseParams = {
    topic: string;
    userContext: string;
    depthLevel: string;
};

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const TYPE_VALUES = ["article", "youtube video", "podcast"] as const;

const resourceSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: [...TYPE_VALUES] },
        title: { type: Type.STRING },
        url: { type: Type.STRING },
    },
    required: ["type", "title", "url"],
} as const;

const courseResponseSchema = {
    type: Type.OBJECT,
    properties: {
        course_title: { type: Type.STRING },
        intro_summary: { type: Type.STRING },
        chapters: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    modules: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                conceptual_deep_dive: { type: Type.STRING },
                                external_resources: { type: Type.ARRAY, items: resourceSchema },
                                assessment: {
                                    type: Type.OBJECT,
                                    properties: {
                                        primary_mission: {
                                            type: Type.OBJECT,
                                            properties: {
                                                title: { type: Type.STRING },
                                                instructions: { type: Type.STRING },
                                                rubric: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            },
                                            required: ["title", "instructions", "rubric"],
                                        },
                                        quick_quiz: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    question: { type: Type.STRING },
                                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                                    answer: { type: Type.STRING },
                                                },
                                                required: ["question", "options", "answer"],
                                            },
                                        },
                                    },
                                    required: ["primary_mission", "quick_quiz"],
                                },
                            },
                            required: ["title", "conceptual_deep_dive", "external_resources", "assessment"],
                        },
                    },
                },
                required: ["title", "modules"],
            },
        },
    },
    required: ["course_title", "intro_summary", "chapters"],
} as const;

const selectionResponseSchema = {
    type: Type.OBJECT,
    properties: {
        selections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    chapterIdx: { type: Type.INTEGER },
                    moduleIdx: { type: Type.INTEGER },
                    resIdx: { type: Type.INTEGER },
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                },
                required: ["chapterIdx", "moduleIdx", "resIdx", "id", "title"],
            },
        },
    },
    required: ["selections"],
} as const;

const GENERATION_MODEL = "gemini-2.5-flash-lite";
const SELECTION_MODEL = "gemini-2.5-flash-lite";

function buildPrompt({ topic, userContext, depthLevel }: CourseParams): string {
    return `
You are a Universal Course Architect. Design a detailed learning path for the following request.
User Request:
- Topic: ${topic}
- Context/Goal: ${userContext}
- Detail Level: ${depthLevel}

Directives:
1. Variable Structure: Decide the number of chapters based on the topic.
   Each chapter should group 2-4 related modules around a common theme.
   Course should be large and detailed enough to cover user's goal.
2. Detailed Content: Provide deep explanations, not just headings.
3. Use Google Search grounding to identify trustworthy article and podcast sources when possible.
4. For "youtube video" resources, set "title" to a realistic, searchable video title for the module topic
   and set "url" to "pending-search". The pipeline will resolve the actual video afterwards.
   Suggest real videos only: never channels, playlists, live streams, or YouTube Shorts.
5. Include good mix of articles and youtube videos.
6. Conceptual deep dives must be detailed (10 words).
7. Chapters should be named as "Chapter [no]: [Chapter Title]".
8. Modules should be named as "Module [no]: [module Title]" within each chapter.
   Reset module numbering per chapter.
9. Hybrid Assessment (90/10 Split):
   - PRIMARY: Practical Mission
   - SECONDARY: Quick Check (1 MCQs)

Output Format: Return valid JSON only matching the enforced schema:
{
    "course_title": "string",
    "intro_summary": "string",
    "chapters": [
        {
            "title": "Chapter 1: [Chapter Title]",
            "modules": [
                {
                    "title": "Module 1: [Module Title]",
                    "conceptual_deep_dive": "10 words explaining the core theory of this module in detail.",
                    "external_resources": [ { "type": "article", "title": "string", "url": "string" } ],
                    "assessment": {
                        "primary_mission": {
                            "title": "The main task",
                            "instructions": "Step-by-step instructions.",
                            "rubric": ["Criteria 1", "Criteria 2", "Criteria 3"]
                        },
                        "quick_quiz": [
                            { "question": "string", "options": ["A", "B", "C"], "answer": "A" }
                        ]
                    }
                }
            ]
        }
    ]
}

Return only the JSON. No extra commentary.
`;
}

function requireUsableText(response: GenerateContentResponse, stage: Stage): string {
    const candidate = response.candidates?.[0];
    const text = textFromCandidate(candidate);
    if (!text) {
        const blockReason = response.promptFeedback?.blockReason;
        throw new StageError(
            stage,
            blockReason ? `Model output blocked: ${blockReason}` : "Empty model output",
        );
    }
    if (candidate?.finishReason && candidate.finishReason !== "STOP") {
        throw new StageError(stage, `Incomplete model output (finishReason=${candidate.finishReason})`);
    }
    return text;
}

function zIssuesToMessage(error: z.ZodError): string {
    return error.issues
        .slice(0, 5)
        .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
        .join("; ");
}

type VideoRef = {
    chapterIdx: number;
    moduleIdx: number;
    resIdx: number;
    title: string;
    results: Array<{ videoId: string; title: string }>;
};

function collectVideoSearchPromises(course: courseType): Array<Promise<VideoRef>> {
    const searchPromises: Array<Promise<VideoRef>> = [];
    for (let chapterIdx = 0; chapterIdx < course.chapters.length; chapterIdx++) {
        const chapter = course.chapters[chapterIdx];
        for (let moduleIdx = 0; moduleIdx < chapter.modules.length; moduleIdx++) {
            const module = chapter.modules[moduleIdx];
            for (let resIdx = 0; resIdx < module.external_resources.length; resIdx++) {
                const res = module.external_resources[resIdx];
                if (res.type !== "youtube video") continue;
                searchPromises.push(
                    getYoutubeTop10Result({ title: res.title }).then((results) => ({
                        chapterIdx,
                        moduleIdx,
                        resIdx,
                        title: res.title,
                        results: results
                            .filter((item): item is YoutubeSearchItem => item !== null)
                            .map((item) => ({
                                videoId: item.id?.videoId ?? "",
                                title: item.snippet?.title ?? "",
                            }))
                            .filter((video) => video.videoId !== ""),
                    })),
                );
            }
        }
    }
    return searchPromises;
}

function buildSelectionPrompt(course: courseType, searchResults: Array<VideoRef>): string {
    return `
You previously generated this course:
${JSON.stringify(course, null, 2)}

For every YouTube video resource, I searched YouTube and got these results:
${JSON.stringify(
    searchResults.map((s) => ({
        chapterIdx: s.chapterIdx,
        moduleIdx: s.moduleIdx,
        resIdx: s.resIdx,
        originalTitle: s.title,
        results: s.results,
    })),
    null,
    2,
)}

Pick the single best video for each resource based on relevance to the resource title and module topic.
For each resource return one selection with its chapterIdx, moduleIdx, resIdx and the video details.
Set "id" to "" and "title" to the resource's original title if none of the results is a suitable public video.
Return only JSON matching the enforced schema. No extra commentary.
`.trim();
}

async function generateGeneralCourse(params: CourseParams): Promise<courseType> {
    let courseResponse: GenerateContentResponse;
    try {
        courseResponse = await ai.models.generateContent({
            model: GENERATION_MODEL,
            contents: buildPrompt(params),
            config: {
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: courseResponseSchema,
            },
        });
    } catch (err: unknown) {
        if (err instanceof ApiError) {
            throw new StageError("GEMINI_COURSE_REQUEST", `${err.status} ${err.message}`);
        }
        throw new StageError("GEMINI_COURSE_REQUEST", err instanceof Error ? err.message : String(err));
    }

    const courseText = requireUsableText(courseResponse, "GEMINI_COURSE_REQUEST");

    let courseJson: unknown;
    try {
        courseJson = parseJsonFromLlm(courseText);
    } catch (err) {
        throw new StageError(
            "JSON_PARSE_COURSE",
            `${err instanceof Error ? err.message : String(err)} | head=${stripMarkdownFences(courseText).slice(0, 120)}`,
        );
    }

    const parsedCourse = courseSchema.safeParse(courseJson);
    if (!parsedCourse.success) {
        throw new StageError("ZOD_COURSE", zIssuesToMessage(parsedCourse.error));
    }
    const course: courseType = parsedCourse.data;

    let allSearchResults: Array<VideoRef>;
    try {
        allSearchResults = await Promise.all(collectVideoSearchPromises(course));
    } catch (err: unknown) {
        throw new StageError("YT_SEARCH", err instanceof Error ? err.message : String(err));
    }

    if (allSearchResults.length > 0) {
        let selectionResponse: GenerateContentResponse;
        try {
            selectionResponse = await ai.models.generateContent({
                model: SELECTION_MODEL,
                contents: buildSelectionPrompt(course, allSearchResults),
                config: {
                    temperature: 0.1,
                    responseMimeType: "application/json",
                    responseSchema: selectionResponseSchema,
                },
            });
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                throw new StageError("GEMINI_SELECTION_REQUEST", `${err.status} ${err.message}`);
            }
            throw new StageError("GEMINI_SELECTION_REQUEST", err instanceof Error ? err.message : String(err));
        }

        const selectionText = requireUsableText(selectionResponse, "GEMINI_SELECTION_REQUEST");

        let selectionJson: unknown;
        try {
            selectionJson = parseJsonFromLlm(selectionText);
        } catch (err) {
            throw new StageError(
                "JSON_PARSE_SELECTION",
                `${err instanceof Error ? err.message : String(err)} | head=${stripMarkdownFences(selectionText).slice(0, 120)}`,
            );
        }

        const parsedSelections = selectionsSchema.safeParse(selectionJson);
        if (!parsedSelections.success) {
            throw new StageError("ZOD_SELECTION", zIssuesToMessage(parsedSelections.error));
        }

        for (const sel of filterValidSelections(course, parsedSelections.data.selections)) {
            const res = course.chapters[sel.chapterIdx].modules[sel.moduleIdx].external_resources[sel.resIdx];
            res.title = sel.title;
            res.url = `https://www.youtube.com/embed/${sel.id}`;
        }
    }

    try {
        await Promise.all(
            course.chapters.flatMap((chapter) =>
                chapter.modules.map(async (module) => {
                    const validatedResources = [];
                    for (const res of module.external_resources) {
                        if (res.type === "youtube video") {
                            if (res.url.includes("/embed/")) validatedResources.push(res);
                            continue;
                        }
                        const otherRes = await getOtherUrl({ url: res.url });
                        if (!otherRes) continue;
                        res.url = otherRes;
                        validatedResources.push(res);
                    }
                    module.external_resources = validatedResources;
                }),
            ),
        );
    } catch (err: unknown) {
        throw new StageError("URL_VALIDATE", err instanceof Error ? err.message : String(err));
    }

    return course;
}

type GenerateCourseResult =
    | { success: true; course: courseType }
    | { success: false; stage: Stage; reason: string };

async function main({ course }: { course: CourseParams }): Promise<GenerateCourseResult> {
    try {
        const result = await generateGeneralCourse(course);
        return { success: true, course: result };
    } catch (e) {
        if (e instanceof StageError) {
            console.error(`[course-gen][${e.stage}]`, e.message);
            return { success: false, stage: e.stage, reason: e.message };
        }
        console.error("[course-gen][UNEXPECTED]", e);
        return {
            success: false,
            stage: "UNEXPECTED",
            reason: e instanceof Error ? e.message : String(e),
        };
    }
}

export { main as geminiGenerator };
export type { GenerateCourseResult };
