import { type LoaderArgs, redirect } from "@remix-run/node";
import { searchClient } from "~/connectors/solr";
import { type entityTypes, isValidEntity } from "~/utils/entityTypes";
import { getSearchUrl } from "~/utils/backend";
import { useLoaderData, useNavigation, useParams } from "@remix-run/react";
import { getLocalized, getLocalizedName } from "~/utils/lang";
import { RelatedItem } from "~/components/RelatedItem";
import { createMetaTitle } from "~/utils/meta";
import { useCallback } from "react";
import { useSearchResults } from "~/providers/SearchResultsContext";
import icon404 from "./../../img/404.svg";
import { groupBy } from "~/utils/groupBy";
import { getTextFields } from "~/utils/retrievers";

function parseSearchParam(request: Request, key: string) {
    const url = new URL(request.url);
    return url.searchParams.get(key);
}

export async function loader({ params, request }: LoaderArgs) {
    const query = parseSearchParam(request, 'query');
    const { category } = params;

    if(isValidEntity(category)) {
        if(!query) {
            // todo - generate redirect randomly?
            return redirect(getSearchUrl(category, 'Machine Learning'));
        }

        const searchResults = await searchClient.search(category, query, { includeTextFields: true });
        const textFieldNames = getTextFields(category)!;

        const searchResultsPerFaculty = Object.entries(groupBy(searchResults, x => x.faculties[0]?.id));

        let keywords = Object.fromEntries(
            await Promise.all(
                searchResultsPerFaculty.map(async ([facultyId, results]) => {
                    const content = results.map(x => {
                        return textFieldNames.map(name => getLocalized(x[name])).join(' ');
                    }).join(' ');

                    const keywords = await searchClient.getKeywords(content, { lang: 'cs' });

                    return [
                        facultyId,
                        keywords
                    ]
                })
            )
        );

        return {
            searchResults,
            keywords,
            category,
            query
        };
    }

    return redirect('/');
}

export function meta() {
    return [
        {
            title: createMetaTitle('Search'),
        }
    ];
}

export const ErrorBoundary = (e) => {
    return (
      <div className="flex flex-col w-full justify-center items-center mt-5">
        <h1 className="text-3xl font-bold mb-4 pb-2 my-3">Oh no!</h1>
        <img src={icon404} className="w-1/3 mx-auto my-5" alt="Not found."/>
        <p>
          There was an error loading this page.
        </p>
      </div>
    )
  };  

function SearchResults({ skeleton = false } : { skeleton?: boolean }) {
    const records = useSearchResults();
    let { category } = useParams<{ category: entityTypes }>();

    const groupByName = useCallback((collection: any[]) => groupBy(collection, x => getLocalizedName(x) ?? ''), []);

    let groupedRecords = Object.values(groupByName(records.searchResults ?? []));

    if(skeleton) {
        groupedRecords = Array(10).fill([{}]) as any;
        category = 'skeleton' as any;
    }

    return (
        (groupedRecords.length > 0) ? 
        <div role="list" className="w-full flex flex-col">
        {groupedRecords.map((items, i) => (
            <RelatedItem key={i} items={items} type={category!} />
        ))}
        </div> :
        <div>
            <span className="text-slate-600">No results found :(</span>
        </div>
    )
}

function SkeletonLoading() {
    return <SearchResults skeleton />
}

export default function Category() {
    const records = useLoaderData();
    const { state } = useNavigation();
    const { setContext } = useSearchResults();

    setContext(records);

    return (
        state === 'loading' ? 
        <SkeletonLoading /> :
        <SearchResults />
    )

}