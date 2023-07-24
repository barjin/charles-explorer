import { type entityTypes } from "~/utils/entityTypes";

export function getSearchUrl(category: entityTypes, query: string) {
    const url = new URL(`/${category}`, 'http://mock.com');
    url.searchParams.set('query', query);
    return url.href.replace('http://mock.com', '');
}