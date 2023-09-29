import { type entityTypes } from "~/utils/entityTypes";

/**
 * Get the search url for a given category and a query.
 * @param category Category to search in (`person`, `class`, ...)
 * @param query Query to search for
 * @param otherParams Other URL query parameters to add 
 * @returns The search URL (e.g. `/person?query=John%20Doe`)
 */
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