import { type LoaderArgs, redirect } from "@remix-run/node";
import { searchClient } from "~/connectors/solr";
import { type entityTypes, isValidEntity } from "~/utils/entityTypes";
import { getSearchUrl } from "~/utils/backend";
import { useLoaderData, useNavigation, useParams } from "@remix-run/react";
import { getLocalizedName } from "~/utils/lang";
import { RelatedItem } from "~/components/RelatedItem";
import { createMetaTitle } from "~/utils/meta";
import { useCallback } from "react";
import icon404 from "./../../img/404.svg";

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
    
        return searchClient.search(category, query);
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

function SearchResults({ groupedRecords, category }: { groupedRecords: any[], category: entityTypes }) {
    return (
        groupedRecords.length > 0 ? 
        <div role="list" className="w-full flex flex-col">
        {groupedRecords.map((items, i) => (
            <RelatedItem key={i} items={items} type={category} />
        ))}
        </div> :
        <div>
            <span className="text-slate-600">No results found :(</span>
        </div>
    )
}

function SkeletonLoading() {
    return <SearchResults groupedRecords={Array(10).fill(0).map(x => [{}])} category={"skeleton" as any} />
}

export default function Category() {
    const records = useLoaderData();
    const params = useParams<{ category: entityTypes }>();

    const groupByName = useCallback((collection: any[]) => {
        return Object.values(collection.reduce((p: Record<string, any>, x) => {
          const name = getLocalizedName(x) as string;
          if (!p[name]) {
            p[name] = [];
          }
          p[name].push(x);
          return p;
        }, []));
      }, []);

    const groupedCollection = groupByName(records);
    const { state } = useNavigation();

    return (
        state === 'loading' ? 
        <SkeletonLoading /> :
        <SearchResults groupedRecords={groupedCollection} category={params.category!} />
    )

}