import type { V2_MetaFunction } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { db } from '~/connectors/prisma';
import { BsPerson } from "react-icons/bs";
import { FaRegBookmark } from 'react-icons/fa';
import { createMetaTitle } from "~/utils/meta";
import { capitalize, getLocalizedName } from "~/utils/lang";
import { getNames , getJoinableEntities, getTextFields } from "~/utils/retrievers";
import { isValidEntity, entities, getPlural, type entityTypes }  from "~/utils/entityTypes";
import { RelatedItem } from "~/components/RelatedItem";
import Category from ".";
import { CategoryIcons } from "~/utils/icons";

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

  return { category, ...loaded };
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
    { name: "description", content: `${getLocalizedName(data)} is a researcher on the Charles University in Prague.` },
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

export default function Index() {
  const data = useLoaderData<Awaited<ReturnType<typeof loader>>>();
  const { category } = useParams<{ category: entityTypes }>();

  return (
    <>
      <div className="flex justify-center items-center flex-row">
        <IconWithBackground
          icon={CategoryIcons[category!]({ className: "text-2xl text-white" })}
          background="#F87171"
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
        entities.map((category) => {
          const relatedCollection = data[getPlural(category) as any];
          if(relatedCollection && relatedCollection.length > 0) {
            return (
            <>
              <h2 id={getPlural(category)} className="text-stone-800 font-sans font-semibold text-1xl py-4">
                {capitalize(getPlural(category))}
              </h2>
              {
                relatedCollection.map((item, i) => (
                  <RelatedItem 
                    key={i}
                    name={getLocalizedName(item)!}
                    description={getLocalizedName(item.faculties?.[0]) ?? ''}
                    link={`/${category}/${item.id}`}
                    type={category}
                  />
                ))
              }
            </>
            );
          }
        })
      }
    </>
  )
}