const FETCH_TIMEOUT_MS = 10_000;

export type YoutubeSearchItem = {
    id?: { videoId?: string };
    snippet?: { title?: string };
};

async function fetchJsonWithTimeout(url: string, init?: RequestInit): Promise<unknown> {
    try {
        const response = await fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

async function getYoutubeUrl({ title }: { title: string }) {
    const data = await fetchJsonWithTimeout(
        `https://www.googleapis.com/youtube/v3/search?${new URLSearchParams({
            part: "snippet",
            q: title,
            type: "video",
            order: "relevance",
            videoDefinition: "high",
            regionCode: "US",
            relevanceLanguage: "en",
            maxResults: "1",
            key: process.env.YOUTUBE_API_KEY ?? "",
        })}`,
    );
    const items = (data as { items?: Array<YoutubeSearchItem | null> } | null)?.items;
    const item = Array.isArray(items) ? items[0] : undefined;
    if (item == null) return null;
    const videoId = item.id?.videoId;
    if (!videoId) return null;
    return { id: videoId, title: item.snippet?.title ?? title };
}

type YoutubeSearchResponse = {
    items?: Array<YoutubeSearchItem | null>;
    error?: { message?: string };
};

async function getYoutubeTop10Result({ title }: { title: string }): Promise<Array<YoutubeSearchItem | null>> {
    const data = await fetchJsonWithTimeout(
        `https://www.googleapis.com/youtube/v3/search?${new URLSearchParams({
            part: "snippet",
            q: title,
            type: "video",
            order: "relevance",
            videoDefinition: "high",
            regionCode: "US",
            relevanceLanguage: "en",
            maxResults: "10",
            key: process.env.YOUTUBE_API_KEY ?? "",
        })}`,
    );
    const parsed = data as YoutubeSearchResponse | null;
    const items = parsed?.items;
    if (!Array.isArray(items)) {
        const apiMessage = parsed?.error?.message;
        console.warn(
            `[course-gen][YT_SEARCH] no results for "${title}"`,
            apiMessage ? `| YouTube API: ${apiMessage}` : "(network error, timeout, or non-ok response)",
        );
        return [];
    }
    return items;
}

async function getOtherUrl({ url }: { url: string }): Promise<string | null> {
    try {
        const response = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!response.ok) return null;
        const finalUrl = response.url;
        if (finalUrl.includes("vertexaisearch.cloud.google.com")) return null;
        return finalUrl;
    } catch {
        return null;
    }
}

export { getYoutubeUrl, getOtherUrl, getYoutubeTop10Result };
