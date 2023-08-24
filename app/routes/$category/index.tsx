import { type LoaderArgs, redirect } from "@remix-run/node";
import { getRelevantEntities } from "~/connectors/solr";
import { type entityTypes, isValidEntity } from "~/utils/entityTypes";
import { getSearchUrl } from "~/utils/backend";
import { useLoaderData, useParams } from "@remix-run/react";
import { getLocalizedName } from "~/utils/lang";
import { RelatedItem } from "~/components/RelatedItem";
import { createMetaTitle } from "~/utils/meta";
import { useCallback } from "react";

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
    
        return getRelevantEntities(query, category);
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
      }, {});

    const groupedCollection = groupByName(records);

    return (
        <>
            {
                records.length === 0 && (
                    <div>
                        <span className="text-slate-600">No results found :(</span>
                    </div>
                )
            }
            {
                groupedCollection.map((x: any) => (
                    <RelatedItem
                        key={x.id}
                        items={x}
                        type={params.category!}
                    />
                ))
            }
        </>
    )

}