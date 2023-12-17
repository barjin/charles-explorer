import type { LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from '~/connectors/prisma';
import { createMetaTitle } from "~/utils/meta";
import { getLocalized } from "~/utils/lang";
import { getNames , getJoinableEntities, getTextFields } from "~/utils/retrievers";
import { isValidEntity, entities, getPlural, EntityParser }  from "~/utils/entityTypes";
import { LinkedDataProcessor } from "~/utils/linkedData";
import icon404 from "~/assets/404.svg";
import { useLocalize } from "~/utils/providers/LangContext";
import { useTranslation } from "react-i18next";

import remixi18n from '~/i18next.server';
import ItemHeader from "~/components/ItemDetail/ItemHeader";
import TextField from "~/components/ItemDetail/TextField";
import RelatedEntities from "~/components/ItemDetail/RelatedEntities";

function getQueryParam(request, key){
  const url = new URL(request.url);
  return url.searchParams.get(key);
}

function createSubtitle(data) {
  const parsed = EntityParser.parse(data, data.category);

  if (data.category === 'class') return `${data.id}${data.faculties[0]?.abbreviations[0].value ? ` | Class at ${data.faculties[0]?.abbreviations[0].value}, CUNI` : '| Class at CUNI'}`;
  if (data.category === 'person') return `${data.faculties[0]?.abbreviations[0].value ? `Researcher at ${data.faculties[0]?.abbreviations[0].value}, CUNI` : 'Researcher at CUNI'}`;
  if (data.category === 'publication') return `${data.year}${data.faculties[0]?.abbreviations[0].value ? ` | Publication at ${data.faculties[0]?.abbreviations[0].value}, CUNI` : 'Publication at CUNI'}`;
  if (data.category === 'programme') return `${parsed?.getDegree()}${data.faculties[0]?.abbreviations[0].value ? ` | Study programme at ${data.faculties[0]?.abbreviations[0].value}, CUNI` : '| Study programme at CUNI'}`;
}

export const loader = async ({ request, params }: LoaderArgs) => {
  const { category, id } = params;
  const query = getQueryParam(request, 'query');
  const lang = await remixi18n.getLocale(request);

  const t = await remixi18n.getFixedT(request, 'common');

  if (!isValidEntity(category)) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  const loaded = await db[category as 'class'].findUnique({
    where: {
      id: id
    },
    include: {
      ...getNames().include,
      departments: getNames(),
      faculties: {
        include: {
          ...getNames().include,
          abbreviations: true,
        }
      },
      ...getJoinableEntities(category)
        ?.filter(x => x != category)
        .reduce((p: Record<string, any>, x) => ({
          ...p,
          [x]: {
            include: {
              ...getNames().include,
              faculties: getNames(),
              departments: getNames(),
            },
          }
        })
      , {}),
      ...getTextFields(category)?.reduce((p: Record<string, any>, x) => ({
        ...p,
        [x]: true
      }), {}),
    },
  });

  if (!loaded) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  const entity = EntityParser.parse(loaded, category as any);
  const relatedMatching = query ? await entity?.getRelevantRelatedEntities(query) : {};

  const data = { 
    title: !loaded ? t('notFound') : getLocalized(loaded.names, { lang }),
    description: !loaded ? t('notFoundDesc') : t('entityDescription', { name: getLocalized(loaded.names, { lang }), mode: t(category, { count: 1 }) }),
    baseUrl: request.url,
    category, 
    textFields: getTextFields(category)?.filter(x => x !== 'names'), 
    relatedMatching,
    ...loaded 
  };

  const imageURL = new URL(request.url);
  imageURL.search = '';
  imageURL.pathname = `/resources/ogimage`;
  imageURL.searchParams.set('data', Buffer.from(JSON.stringify({
    title: data.title,
    subtitle: createSubtitle(data),
    faculty: data.faculties[0],
    category: data.category,
    entities: getJoinableEntities(category)?.reduce((p,x) => ({...p, [x]: data[x]?.length}), {}),
  })).toString('base64'));

  data.imageURL = imageURL.toString();

  return data;
}

export function meta({ data }: { data: Awaited<ReturnType<typeof loader>> }) {
  if (!data) {
    return [
      {
        title: createMetaTitle('404')
      }
    ]
  }

  return [
    { title: createMetaTitle(data?.title) },
    { name: "description", content: data.description },
    {
      "script:ld+json": new LinkedDataProcessor((new URL(data.baseUrl)).origin).getTransformer(data.category)?.transform(data as any),
    },
    {
      property: "og:image",
      content: data.imageURL,
    },
    {
      property: "twitter:image",
      content: data.imageURL,
    }
  ];
}

export const ErrorBoundary = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col w-full justify-center items-center mt-5">
      <img src={icon404} className="w-1/3 mx-auto" alt="Not found."/>
      <h1 className="text-3xl font-bold mb-4 border-b-2 border-b-slate-300 pb-2 mt-5">{t('ohno')}</h1>
      <p>
          {t('notFoundDesc')}
      </p>
    </div>
  )
};
 
export default function Index() {
  const data = useLoaderData<Awaited<ReturnType<typeof loader>>>();
  const { textFields } = data;
  const { localize } = useLocalize();

  return (
    <>
      <ItemHeader data={data} />
      {
        textFields?.filter((x) => {
          return (localize(data[x as keyof typeof data] as any)?.trim()?.length ?? -1) > 0
        }).map((field: any, i: number) => (
          <TextField key={i} field={field} data={data} />
        ))
      }
      {
        textFields?.length > 0 && textFields?.filter((x) => {
          return (localize(data[x as keyof typeof data] as any)?.trim()?.length ?? -1) > 0
        }).length === 0 && (
          <p className="text-stone-600 font-sans font-normal text-1xl py-2">
            Pro {
              `${data.category === 'person' ? 'tuto osobu' : data.category === 'publication' ? 'tuto publikaci' : data.category === 'class' ? 'tento předmět' : 'tento program'}`
            } bohužel nemáme k dispozici žádný popis.
          </p>
        )
      }
      {
        entities
          .sort((a, b) => {
            return (data[getPlural(a)]?.length ?? 0) - (data[getPlural(b)]?.length ?? 0);
          })
          .map((category, i) => {
          const relatedCollection = data[getPlural(category) as any];
          if(relatedCollection && relatedCollection.length > 0) {
            return (
              <RelatedEntities key={i} category={category} collection={relatedCollection} matching={data.relatedMatching?.[category] ?? []} />
            );
          }
          return null;
        })
      }
    </>
  )
}