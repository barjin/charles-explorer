import { type LoaderArgs, redirect } from "@remix-run/node";
import { searchClient } from "~/connectors/solr.server";
import { type entityTypes, isValidEntity } from "~/utils/entityTypes";
import { getSearchUrl } from "~/utils/backend";
import { useLoaderData, useLocation, useNavigation, useParams } from "@remix-run/react";
import { getLocalized } from "~/utils/lang";
import { RelatedItem } from "~/components/RelatedItem";
import { createMetaTitle } from "~/utils/meta";
import { useCallback } from "react";
import icon404 from "./../../img/404.svg";
import { groupBy } from "~/utils/groupBy";
import { getTextFields } from "~/utils/retrievers";
import { useLocalize } from "~/providers/LangContext";
import { useTranslation } from "react-i18next";
import remixi18n from '~/i18next.server';

function parseSearchParam(request: Request, key: string) {
    const url = new URL(request.url);
    return url.searchParams.get(key);
}

export async function loader({ params, request }: LoaderArgs) {
    const lang = await remixi18n.getLocale(request);
    const t = await remixi18n.getFixedT(request, 'common');

    const query = parseSearchParam(request, 'query');
    const { category } = params;

    if(isValidEntity(category)) {
        if(!query) {
            return redirect(getSearchUrl(category, 'Machine Learning'));
        }

        const searchResults = await searchClient.search(category, query, { includeTextFields: true });
        const textFieldNames = [...getTextFields(category)!, 'text'];

        const searchResultsPerFaculty = Object.entries(groupBy(searchResults, x => x.faculties[0]?.id));

        let keywords = Object.fromEntries(
            await Promise.all(
                searchResultsPerFaculty.map(async ([facultyId, results]) => {
                    const content = results.map(x => {
                        return (textFieldNames.map(name => getLocalized(x[name], { fallback: false, lang })) ?? []).join(' ');
                    }).join(' ');

                    const keywords = await searchClient.getKeywords(content, { lang });

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
            query,
            title: t('search.search'),
        };
    }

    return redirect('/');
}

export function meta({ data }) {
    return [
        {
            title: createMetaTitle(data?.title),
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

function SearchResults({ records, skeleton = false } : { records: any[], skeleton?: boolean }) {
    let { category } = useParams<{ category: entityTypes }>();
    const { search } = useLocation();
    const { localize } = useLocalize();

    const query = new URLSearchParams(search).get('query');
    const { t } = useTranslation();

    const groupByName = useCallback((collection: any[]) => groupBy(collection, x => localize(x.names) ?? ''), []);

    let groupedRecords = Object.values(groupByName(records ?? []));

    if(skeleton) {
        groupedRecords = Array(10).fill([{}]) as any;
        category = 'skeleton' as any;
    }

    return (
        (groupedRecords.length > 0) ? 
        <ul className="w-full flex flex-col">
        {groupedRecords.map((items, i) => (
            <RelatedItem key={i} items={items} type={category!} />
        ))}
        </ul> :
        <div>
            <span className="text-slate-600">{t('noResults', { query, mode: t(category!, { count: 2 }) })}</span>
        </div>
    )
}

function SkeletonLoading() {
    return <SearchResults records={[]} skeleton />
}

export default function Category() {
    const records = useLoaderData();
    const { state } = useNavigation();



    return (
        state === 'loading' ? 
        <SkeletonLoading /> :
        <SearchResults {...{ records: records.searchResults }} />
    )
}