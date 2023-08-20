import type { V2_MetaFunction } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { db } from '~/connectors/prisma';
import { FaRegBookmark,  FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { createMetaTitle } from "~/utils/meta";
import { capitalize, getLocalized, getLocalizedName } from "~/utils/lang";
import { getNames , getJoinableEntities, getTextFields } from "~/utils/retrievers";
import { isValidEntity, entities, getPlural, type entityTypes }  from "~/utils/entityTypes";
import { RelatedItem } from "~/components/RelatedItem";
import { CategoryIcons } from "~/utils/icons";
import { useCallback, useState } from "react";
import { getFacultyColor } from "~/utils/colors";

interface URLParams {
  category: entityTypes;
  id: string;
}

export const loader = async ({ params }: { params: URLParams }) => {
  const { category, id } = params;

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

  return { category, textFields: getTextFields(category)?.filter(x => x !== 'names'), ...loaded };
}

function formatText(text: string | null | undefined) {
  return text?.split('______').flatMap(x => x.split('\n').filter(x => x !== ''));
}

export const meta: V2_MetaFunction = ({ data }: { data: Awaited<ReturnType<typeof loader>> }) => {
  if (!data) return [
    {
      title: createMetaTitle(`Missing ${data.category}`)
    },
    {
        name: "description",
        content: `${capitalize(data.category)} with this id does not exist.`
    }
  ];

  return [
    { title: createMetaTitle(getLocalizedName(data) ?? 'Unknown researcher') },
    { name: "description", content: `${getLocalizedName(data)} is a researcher at the Charles University in Prague.` },
  ];
};

function IconWithBackground({ icon, background, size }) {
  if(!size) size = 12

  return (
    <div className={`rounded-full w-${size} h-${size} flex justify-center items-center p-2`} style={{ background }}>
      {icon}
    </div>
  )
}

function TextField({field, data}: any) {
  const [collapsed, setCollapsed] = useState<Boolean>(false);

  const collapse = useCallback(() => {  
    setCollapsed(!collapsed);
  }, [collapsed]);

  return (getLocalized(data[field as keyof typeof data] as any)?.trim()?.length ?? -1) > 0 ?
      (<div key={field}>
        <h3 className="text-stone-800 font-sans font-semibold text-1xl py-2 hover:cursor-pointer select-none" onClick={collapse}>
          { capitalize(field) } { collapsed ? <FaChevronRight className="inline" /> : <FaChevronDown className="inline" /> }
        </h3>
        <div className={`text-stone-600 ${collapsed ? 'hidden' : ''} pt-2`}>
        { 
          formatText(getLocalized(data[field as keyof typeof data] as any))
          ?.map((x, i) => <p key={i} className="pb-2 px-3">{x}</p>)
        }
        </div>
      </div>) : null
}

function RelatedEntities({ category, collection }: { category: entityTypes, collection: any[] }){
  const [collapsed, setCollapsed] = useState<Boolean>(false);

  const collapse = useCallback(() => {  
    setCollapsed(!collapsed);
  }, [collapsed]);

  return (<div className="w-full">
    <h3 id={getPlural(category)} className="text-stone-800 font-sans font-semibold text-1xl py-2 hover:cursor-pointer select-none" onClick={collapse}>
      {capitalize(getPlural(category))} { collapsed ? <FaChevronRight className="inline" /> : <FaChevronDown className="inline" /> }
    </h3>
    <div className={`${collapsed ? 'hidden' : ''} w-full flex flex-col pl-2`}>
    {
      collection.map((item, i) => (
        <RelatedItem 
          key={i}
          item={item}
          type={category}
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

  return (
    <>
      <div className="flex justify-center items-center flex-row">
        <IconWithBackground
          icon={CategoryIcons[category!]({ className: "text-2xl text-white" })}
          background={getFacultyColor(data.faculties[0]?.id)}
        />
        <div className="p-4">
          <h2 className="text-stone-800 font-sans font-semibold text-3xl">{getLocalizedName(data)}</h2>
          <span className="text-stone-600">{capitalize(data.category)} at {getLocalizedName(data.faculties[0])}, CUNI</span>
          <div className="text-sm">
            <span className="text-stone-600">
              {
                entities.map(x => {
                  if(data[getPlural(x)]) {
                    return (
                    <span className="pr-3" key={x}>
                      <a href={`#${getPlural(x)}`}>
                        <FaRegBookmark style={{display: 'inline'}} fontSize={14}/> {data[getPlural(x)].length} {getPlural(x)}
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
        textFields?.map((field: any) => (
          <TextField field={field} data={data} />
        ))
      }
      {
        entities.map((category) => {
          const relatedCollection = data[getPlural(category) as any];
          if(relatedCollection && relatedCollection.length > 0) {
            return (
              <RelatedEntities category={category} collection={relatedCollection} />
            );
          }
        })
      }
    </>
  )
}