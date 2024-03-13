import type { LoaderArgs } from "@remix-run/node";
import { useLoaderData, useLocation, useNavigate } from "@remix-run/react";
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

import { IoClose } from 'react-icons/io5';
import { t } from "i18next";

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

async function loadEntities(category, ids) {
  const [main, ...rest] = 
    await Promise.all(ids.map(async (id) => 
      db[category as 'class'].findUnique({
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
      })
    ));

    return { 
      ...main, 
      private_id: undefined,
      ...getJoinableEntities(category)?.reduce((p: Record<string, any>, x) => ({
        ...p,
        [x]: main[x]?.filter((item) => rest.every((r) => r[x]?.some((rItem) => rItem.id === item.id)))
      }), {}),
      filters: rest
        .filter(x => x)
        .map(x => ({
          ...x,
          private_id: undefined,
          ...getJoinableEntities(category)?.reduce((p: Record<string, any>, x) => ({
            ...p,
            [x]: undefined,
          }), {}),
        }))
    };
}

function parsePackedId(id: string) {
  if(id[0] === '[' && id[id.length - 1] === ']') {
    return id.slice(1, -1).split('|');
  }
  else {
    return [id]
  }
}

async function loadGroup(ids: string[]) {

  const peopleIds: string[][] = ids.map(parsePackedId);

  const people = await db.person.findMany({
    where: {
      id: {
        in: peopleIds.map(x => x[0])
      }
    },
    include: {
      faculties: {
        include: {
          abbreviations: true,
          names: true,
        }
      },
      departments: true,
      names: true,
    }
  });

  people.sort((a, b) => {
    return peopleIds.findIndex(x => x[0] === a.id) - peopleIds.findIndex(x => x[0] === b.id);
  });

  const [publications] = await Promise.all([
    db.publication.findMany({
      where: {
        AND: peopleIds.map(ids => ({
          people: {
            some: {
              id: {
                in: ids
              }
            }
          }
        }))
      },
      include: {
        faculties: {
          include: {
            abbreviations: true,
            names: true,
          },
        },
        names: true,
      }
    })
  ]);

  return {
    ...people[0],
    private_id: undefined,
    publications,
    classes: [],
    programmes: [],
    filters: people.slice(1).map(x => ({...x, private_id: undefined})),
  }
}

export const loader = async ({ request, params }: LoaderArgs) => {
  const { category, id } = params;
  const query = getQueryParam(request, 'query');
  const lang = await remixi18n.getLocale(request);
  const t = await remixi18n.getFixedT(request, 'common');
  const ids = id?.split(',').filter((x,i,a) => a.indexOf(x) === i);

  if (!isValidEntity(category) || !ids || ids.length === 0) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  let loaded;
  if (category === 'person' && ids.length > 1) {
    loaded = await loadGroup(ids);
  } else {
    loaded = await loadEntities(category, ids);
  }

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

function Filters({filters}: {filters: any[]}) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();


  return (
    <div className="pl-2">
      <div className="text-slate-600">
        {t('filterActive')}
      </div>
    {
      filters.map((x, i) => {
        const parsed = EntityParser.parse(x, 'person');
        return (
          <div 
            className="p-1 px-2 bg-slate-200 rounded-md shadow-sm mb-2 cursor-pointer flex flex-row items-center justify-between" 
            key={i}
            onClick={() => {
              const pathSegments = pathname.split('/');

              const lastPathPart = pathSegments.pop();
              const newPathname = lastPathPart.split(',').filter((y) => {
                if(y[0] === '[') {
                  return parsePackedId(y).every((z) => z !== encodeURIComponent(x.id));
                }
                return y !== encodeURIComponent(x.id)
              }).join(',');

              navigate([...pathSegments, newPathname].join('/') + search);
            }}
          >
            <span>
            {parsed?.getNames()[0].value} 
            </span> <IoClose className="text-slate-600 ml-2"/>
          </div>
        )
      })
    }
    </div>
  )
}
 
export default function Index() {
  const data = useLoaderData<Awaited<ReturnType<typeof loader>>>();
  const { textFields } = data;
  const { localize } = useLocalize();

  return (
    <>
      <ItemHeader data={data} />
      {
        data.filters.length > 0 &&
          <Filters filters={data.filters} />
      }
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
            {t('no_better_description', { thisTypeAccusative: t(`this_${data.category}_accusative`) })}
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
      {
        entities.map((category, i) => data[getPlural(category) as any]?.length > 0)
          .filter(x => x)
          .reduce((p, x) => p + x, 0) === 0 && (
            <p className="text-stone-600 font-sans font-normal text-1xl py-2">
              Pro tento dotaz bohužel nemáme k dispozici žádné další výsledky.
            </p>
          )
      }
    </>
  )
}