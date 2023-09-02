import type { LoaderArgs, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { db } from '~/connectors/prisma';
import { FaRegBookmark,  FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { createMetaTitle } from "~/utils/meta";
import { capitalize, getLocalized, getPluralLang } from "~/utils/lang";
import { getNames , getJoinableEntities, getTextFields } from "~/utils/retrievers";
import { isValidEntity, entities, getPlural, type entityTypes, EntityParser }  from "~/utils/entityTypes";
import { RelatedItem, getSteppedGradientCSS } from "~/components/RelatedItem";
import { CategoryIcons } from "~/utils/icons";
import { useCallback, useState } from "react";
import { getFacultyColor } from "~/utils/colors";
import { getLinkedData } from "~/utils/linkedData";
import icon404 from "./../../img/404.svg";
import { getSearchUrl } from "~/utils/backend";
import { groupBy } from "~/utils/groupBy";
import { RiExternalLinkLine } from "react-icons/ri";
import { useLocalize } from "~/providers/LangContext";
import { searchClient } from "~/connectors/solr";

function getQueryParam(request, key){
  const url = new URL(request.url);
  return url.searchParams.get(key);
}

export const loader = async ({ request, params }: LoaderArgs) => {
  const { category, id } = params;
  const query = getQueryParam(request, 'query');

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
      faculties: getNames(),
      ...getJoinableEntities(category)
        ?.filter(x => x != category)
        .reduce((p: Record<string, any>, x) => ({
          ...p,
          [x]: {
            include: {
              ...getNames().include,
              faculties: getNames(),
              departments: getNames(),
            }
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

  let relatedMatching = {};
  if (query && getJoinableEntities(category)?.includes('classes')) {
    relatedMatching = {
      class: await searchClient.searchIds('class', query, { rows: 256, ids: (loaded as any).classes.map(x => x.id) } )
    };
  }

  return { 
    category, 
    textFields: getTextFields(category)?.filter(x => x !== 'names'), 
    relatedMatching,
    ...loaded 
  };
}

function stripHTML(html: string) {
  return html?.replaceAll(/<.*?>/gi, '');
}

function isANumberedList(text: string) {
  const matches = Array.from(text?.matchAll(/\s?(\d+)(\.|\))\s/g)).map(x => x[1]);

  return matches.length > 3 && '123456789'.includes(matches.slice(0,5).join(''));
}
  

function formatText(text: string | null | undefined) {
  text = stripHTML(text ?? ''); 

  if(isANumberedList(text ?? '')) {
    return text?.split(/\s(?=\d+[.)])/g)
    .map(x => x.trim().length > 0 ? x.trim() + ' \n' : x.trim())
    .filter(x => x.length > 0) ?? [];
  }

  const base = text?.split('______')
    .flatMap(x => x.split('\n'))
    .reduce((p, x) => {
      if (/\w/.test(x.trim()[0]) && x.trim()[0]?.toLowerCase() === x.trim()?.[0]) {
        p[p.length - 1] += x;
      } else {
        p.push(x);
      }
      return p;
    }, [''])
    .filter(x => x.trim().length > 0) ?? [];

  if (base.length < 2) {
    return text?.split(/\.\s(?=[A-Z])/g)
    .map((x, i, a) => x.trim().length > 0 && i !== (a.length - 1) ? x.trim() + '. ' : x.trim())
    .reduce((p, x, i) => {
      if (i % 2 === 1) {
        p[p.length - 1] += x;
      } else {
        p.push(x);
      }
      return p;
    }, [''])
    .filter(x => x.length > 0) ?? [];
  }

  return base;
}

export const meta: V2_MetaFunction = ({ data }: { data: Awaited<ReturnType<typeof loader>> }) => {
  if (!data) return [
    {
      title: createMetaTitle('Not found')
    },
    {
        name: "description",
        content: `${capitalize(data?.category ?? 'entity') } with this id does not exist.`
    },
  ];

  return [
    { title: createMetaTitle(getLocalized(data.names, { lang: 'eng' })) ?? `Unknown ${data.category}` },
    { name: "description", content: `"${getLocalized(data.names, { lang: 'eng' })}" is a ${data.category} at the Charles University in Prague.` },
    {
        "script:ld+json": getLinkedData(data.category, data),
    }
  ];
};

export const ErrorBoundary = ({ error }) => {
  return (
    <div className="flex flex-col w-full justify-center items-center mt-5">
      <img src={icon404} className="w-1/3 mx-auto" alt="Not found."/>
      <h1 className="text-3xl font-bold mb-4 border-b-2 border-b-slate-300 pb-2 mt-5">Oh no!</h1>
      <p>
        The entity you are looking for does not exist.
      </p>
    </div>
  )
};

function IconWithBackground({ icon, background, size, className }) {
  if(!size) size = 12

  return (
    <span className={`rounded-full w-${size} h-${size} justify-center items-center p-2 ${className}`} style={{ background }}>
      {icon}
    </span>
  )
}

function TextField({field, data}: any) {
  const [collapsed, setCollapsed] = useState<Boolean>(false);
  const { localize } = useLocalize();
  const { search } = useLocation();

  const collapse = useCallback(() => {  
    setCollapsed(!collapsed);
  }, [collapsed]);

  return ((localize(data[field as keyof typeof data] as any))?.trim()?.length ?? -1) > 0 ?
      (<div key={field}>
        <h3 
          className="text-stone-800 font-sans font-semibold text-1xl py-2 hover:cursor-pointer select-none" 
          onClick={collapse}
          aria-label={`Toggle text field ${field}, currently ${collapsed ? 'collapsed' : 'expanded'}`}
          onKeyDown={(e) => {
            if(e.key === 'Enter') {
              collapse();
            }
          }} 
          tabIndex={0}
        >
          { capitalize(localize(field)) } { collapsed ? <FaChevronRight className="inline" /> : <FaChevronDown className="inline" /> }
        </h3>
        <div className={`text-stone-600 ${collapsed ? 'hidden' : ''} pt-2`}>
        { (() => {
            switch (field) {
              case 'keywords':
                return <div className="space-x-2">{
                    localize(data[field as keyof typeof data] as any)
                    ?.split(';')
                    .filter(x => x.trim().length > 0)
                    .map((x, i) => (
                      <Link 
                        key={i} 
                        to={getSearchUrl(data.category, x.trim(), new URLSearchParams(search))}
                        className={`
                          bg-orange-400
                          mb-2 
                          hover:cursor-pointer 
                          hover:bg-orange-300 
                          transition-colors select-none px-3 py-1 rounded-md inline-block  text-white w-fit`}
                        >
                          {x}
                      </Link>)
                    )
                  }</div>;
              default:
                return formatText(localize(data[field as keyof typeof data] as any))
                ?.map((x, i) => <p key={i} className="pb-2 px-3">{x}</p>)
            }
          })()
        }
        </div>
      </div>) : null
}

function RelatedEntities({ category, collection, matching }: { category: entityTypes, collection: any[], matching: any[] }){
  const [collapsed, setCollapsed] = useState<Boolean>(false);
  const { lang, localize } = useLocalize();

  const groupByName = useCallback((collection: any[]) => groupBy(collection, x => localize(x.names) ?? ''), []);

  const collapse = useCallback(() => {  
    setCollapsed(!collapsed);
  }, [collapsed]);

  collection.sort((a, b) => {
    return b.faculties.length - a.faculties.length;
  });

  const groupedCollection = Object.values(groupByName(collection));

  return (<div className="w-full">
    <h3 
      id={getPlural(category)} 
      className="text-stone-800 font-sans font-semibold text-1xl py-2 hover:cursor-pointer select-none" 
      onClick={collapse}
      aria-label={`Toggle related ${getPlural(category)} section, currently ${collapsed ? 'collapsed' : 'expanded'}`}
      onKeyDown={(e) => {
        if(e.key === 'Enter') {
          collapse();
        }
      }} 
      tabIndex={0}
    >
      {capitalize(getPluralLang(category, 2, {lang}))} { collapsed ? <FaChevronRight className="inline" /> : <FaChevronDown className="inline" /> }
    </h3>
    <div 
      className={`${collapsed ? 'hidden' : ''} w-full flex flex-col pl-2`}
      role="list"
    >
    {
      groupedCollection
      .sort((a, b) => {
        return b.some(
          x => matching.map(x => x.id).includes(x.id)
        ) && 1 - a.some(
          x => matching.map(x => x.id).includes(x.id)
        ) && 1;
      })
      .map((item, i) => (
        <RelatedItem 
          key={i}
          items={item}
          type={category}
          matching={item.some(
            x => matching.map(x => x.id).includes(x.id)
          )}
        />
      ))
    }
    </div>
  </div>);
}

export default function Index() {
  const data = useLoaderData<Awaited<ReturnType<typeof loader>>>();
  const { category } = useParams<{ category: entityTypes }>();
  const { textFields } = data;
  const { localize, lang } = useLocalize();

  const item = EntityParser.parse(data, category as any)!;

  return (
    <>
      <div className="flex items-center flex-row w-full">
        <IconWithBackground
          icon={CategoryIcons[category!]({ className: "text-2xl text-white" })}
          className='hidden xl:flex'
          background={getSteppedGradientCSS(
            item?.getFaculties().length > 0 ?
              item?.getFaculties().map(x => getFacultyColor(x.id)): ['rgb(255, 153, 0)']
          )
          }
        />
        <div className="p-0.5 xl:p-4 w-full">
          <div className="flex flex-col-reverse xl:flex-col">
            <div className='flex flex-row items-center justify-between w-full'>
            <h2 className="text-stone-800 font-sans font-semibold text-3xl my-2 xl:my-0">
              {localize(item.getNames())}               
            </h2>
            {
              item.getExternalLinks().length > 0 && (
                <div>
                  {
                    item.getExternalLinks().map((link, i) => (
                      <a 
                        key={i}
                        href={link} 
                        className="text-blue-400"
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        <RiExternalLinkLine size={24} />
                      </a>
                    ))
                  }
                </div>
              )
            }
            </div>
            <span className="text-stone-600 flex flex-row items-center my-2 xl:my-0">
            <IconWithBackground
              icon={CategoryIcons[category!]({ className: "text-sm text-white" })}
              className='inline-block xl:hidden mr-2'
              background={getSteppedGradientCSS(
                data.faculties.length > 0 ?
                  data.faculties.map(x => getFacultyColor(x.id)): ['rgb(255, 153, 0)']
              )
              }
            />  
            {capitalize(localize(category))} {localize('at')} {
              data.faculties.length > 0 ?
                data.faculties.map(x => localize(x.names)).join(', ')
                : 'CUNI'
            }</span>
          </div>
          <div className="text-sm mb-3 xl:m-0">
            <span className="text-stone-600">
              {
                entities.map(x => {
                  if(data[getPlural(x)] && data[getPlural(x)].length > 0) {
                    return (
                    <span className="pr-3" key={x}>
                      <a href={`#${getPlural(x)}`}>
                        <FaRegBookmark style={{display: 'inline', marginRight: '3px'}} fontSize={14}/> 
                          {
                            data[getPlural(x)].length} {data[getPlural(x)].length !== 1
                            ? getPluralLang(x, data[getPlural(x)].length, { lang })
                            : localize(x)
                          }
                      </a>
                    </span>);
                  }
                })
              }
            </span>
          </div>
        </div>
      </div>
      {
        textFields?.filter((x) => {
          return (localize(data[x as keyof typeof data] as any)?.trim()?.length ?? -1) > 0
        }).map((field: any, i: number) => (
          <TextField key={i} field={field} data={data} />
        ))
      }
      {
        entities
          .sort((a, b) => {
            return data.relatedMatching[b]?.length ?? 0 - data.relatedMatching[a]?.length ?? 0
          })
          .map((category, i) => {
          const relatedCollection = data[getPlural(category) as any];
          if(relatedCollection && relatedCollection.length > 0) {
            return (
              <RelatedEntities key={i} category={category} collection={relatedCollection} matching={data.relatedMatching?.[category] ?? []} />
            );
          }
        })
      }
    </>
  )
}