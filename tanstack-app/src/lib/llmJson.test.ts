import { describe, expect, it } from "vitest";
import {
    LlmJsonParseError,
    extractFirstJsonValue,
    parseJsonFromLlm,
    stripMarkdownFences,
    textFromCandidate,
} from "./llmJson";

describe("stripMarkdownFences", () => {
    it("removes a json code fence", () => {
        expect(stripMarkdownFences('```json\n{"a": 1}\n```')).toBe('{"a": 1}');
    });

    it("removes a fence without a language tag", () => {
        expect(stripMarkdownFences('```\n{"a": 1}\n```')).toBe('{"a": 1}');
    });

    it("returns the text untouched when there is no fence", () => {
        expect(stripMarkdownFences('  {"a": 1}  ')).toBe('{"a": 1}');
    });

    it("handles an unclosed fence", () => {
        expect(stripMarkdownFences('```json\n{"a": 1}')).toBe('{"a": 1}');
    });
});

describe("extractFirstJsonValue", () => {
    it("extracts a balanced object surrounded by prose", () => {
        expect(extractFirstJsonValue('Sure! Here you go: {"a": "}"} }} done')).toBe('{"a": "}"}');
    });

    it("extracts an array with nested braces", () => {
        expect(extractFirstJsonValue('noise [ {"x": 1}, {"x": 2} ] tail')).toBe('[ {"x": 1}, {"x": 2} ]');
    });

    it("returns null for truncated (unbalanced) json", () => {
        expect(extractFirstJsonValue('{"a": {"b": [1,2,3]}')).toBeNull();
    });

    it("returns null when no json starts", () => {
        expect(extractFirstJsonValue("no json here")).toBeNull();
    });
});

describe("parseJsonFromLlm", () => {
    it("parses a bare object", () => {
        expect(parseJsonFromLlm('{"a": 1}')).toEqual({ a: 1 });
    });

    it("parses a fenced object", () => {
        expect(parseJsonFromLlm('```json\n{"a": 1}\n```')).toEqual({ a: 1 });
    });

    it("parses a fenced ARRAY - previously broken by the object-only regex", () => {
        const fencedArray = '```json\n[\n{"chapterIdx": 0},\n{"chapterIdx": 1}\n]\n```';
        expect(parseJsonFromLlm(fencedArray)).toEqual([{ chapterIdx: 0 }, { chapterIdx: 1 }]);
    });

    it("parses an array preceded by commentary", () => {
        const noisy = 'Here are my picks:\n[{"id": "abc"}, {"id": "def"}]\nHope that helps!';
        expect(parseJsonFromLlm(noisy)).toEqual([{ id: "abc" }, { id: "def" }]);
    });

    it("parses a full course object embedded in prose", () => {
        const noisy = 'My course:\n{"course_title":"T","intro_summary":"s","chapters":[]} thank you';
        expect(parseJsonFromLlm(noisy)).toEqual({ course_title: "T", intro_summary: "s", chapters: [] });
    });

    it("throws LlmJsonParseError for nothing json-like", () => {
        expect(() => parseJsonFromLlm("no json")).toThrow(LlmJsonParseError);
    });

    it("throws LlmJsonParseError for truncated json", () => {
        expect(() => parseJsonFromLlm('{"a": {"b": [1,2')).toThrow(LlmJsonParseError);
    });
});

describe("textFromCandidate", () => {
    it("joins text parts", () => {
        expect(
            textFromCandidate({ content: { parts: [{ text: "abc" }, {}, { text: "def" }] } }),
        ).toBe("abcdef");
    });

    it("returns empty string for a missing candidate or parts", () => {
        expect(textFromCandidate(null)).toBe("");
        expect(textFromCandidate({ content: null })).toBe("");
        expect(textFromCandidate({ content: { parts: [] } })).toBe("");
    });
});
