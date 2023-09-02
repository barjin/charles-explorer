import { type LoaderArgs } from "@remix-run/node";
import { searchClient } from "~/connectors/solr.server";

function parseSearchParam(request: Request, key: string) {
    const url = new URL(request.url);
    return url.searchParams.get(key);
}

export async function loader({ params, request }: LoaderArgs) {
    const x = await searchClient.suggest(params.category as any, parseSearchParam(request, 'query') ?? '');
    return x;
}
