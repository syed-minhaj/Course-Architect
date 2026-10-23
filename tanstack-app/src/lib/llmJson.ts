export class LlmJsonParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LlmJsonParseError";
    }
}

type CandidateLike = {
    content?: {
        parts?: Array<{ text?: string } | null | undefined> | null;
    } | null;
    finishReason?: string;
} | null | undefined;

export function textFromCandidate(candidate: CandidateLike): string {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) return "";
    return parts
        .map((p) => (typeof p?.text === "string" ? p.text : ""))
        .filter(Boolean)
        .join("");
}

export function stripMarkdownFences(text: string): string {
    const fenced = text.match(/```[a-z]*(?:\s|\n)([\s\S]*?)```/i);
    if (fenced?.[1]) return fenced[1].trim();
    const openFence = text.match(/```[a-z]*(?:\s|\n)([\s\S]*)/i);
    if (openFence?.[1]) return openFence[1].trim();
    return text.trim();
}

export function extractFirstJsonValue(text: string): string | null {
    const start = text.search(/[{[]/);
    if (start === -1) return null;
    const openChar = text[start];
    const closeChar = openChar === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
            if (escaped) escaped = false;
            else if (ch === "\\") escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') {
            inString = true;
            continue;
        }
        if (ch === openChar) depth++;
        else if (ch === closeChar) {
            depth--;
            if (depth === 0) return text.slice(start, i + 1);
        }
    }
    return null;
}

export function parseJsonFromLlm(text: string): unknown {
    const raw = text.trim();
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch {
            // fall through to fence stripping
        }
    }
    const stripped = stripMarkdownFences(text);
    if (stripped && stripped !== raw) {
        try {
            return JSON.parse(stripped);
        } catch {
            // fall through to balanced extraction
        }
    }
    const extracted = extractFirstJsonValue(stripped) ?? extractFirstJsonValue(raw);
    if (!extracted) {
        throw new LlmJsonParseError("No JSON value found in model output");
    }
    try {
        return JSON.parse(extracted);
    } catch (e) {
        throw new LlmJsonParseError(
            `Model JSON is malformed or truncated: ${e instanceof SyntaxError ? e.message : "parse error"}`,
        );
    }
}
