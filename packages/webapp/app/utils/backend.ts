import { type entityTypes } from "~/utils/entityTypes";

export function getSearchUrl(category: entityTypes, query: string, otherParams?: any) {
    const url = new URL(`/${category}`, 'http://mock.com');
    if (otherParams) {
        if (typeof otherParams === 'string') {
            otherParams = new URLSearchParams(otherParams);
        }

        Array.from(otherParams.entries?.() ?? []).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
    }
    url.searchParams.set('query', query);
    return url.href.replace('http://mock.com', '');
}