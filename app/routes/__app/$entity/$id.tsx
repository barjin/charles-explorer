import type { V2_MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import { BsPerson } from "react-icons/bs";
import { FaRegBookmark } from 'react-icons/fa';
import { createMetaTitle } from "~/utils/meta";
import { capitalize } from "~/utils/lang";
import { getNames , getJoinableEntities, getTextFields } from "~/utils/retrievers";
import { isValidEntity, entities, getPlural, type entityTypes }  from "~/utils/entityTypes";

interface URLParams {
  entity: entityTypes;
  id: string;
}

const currentLanguage = 'cs';

const getLocalizedName = (object: { names: { value: string; lang: string; }[] } | null) => {
  return object?.names.find(x => x.lang == currentLanguage)?.value ?? 
    object?.names.find(x => x.lang == 'en')?.value;
}

export const loader = async ({ params }: { params: URLParams }) => {
  const db = new PrismaClient();
  const { entity, id } = params;

  if (!isValidEntity(entity)) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  const loaded = await db[entity].findUnique({
    where: {
      id: id
    },
    include: {
      ...getNames().include,
      departments: getNames(),
      faculties: getNames(),
      ...getJoinableEntities(entity)?.filter(x => x != entity).reduce((p: Record<string, any>, x) => ({
        ...p,
        [x]: getNames()
      }), {}),
      ...getTextFields(entity)?.reduce((p: Record<string, any>, x) => ({
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

  return { entity, ...loaded };
}

export const meta: V2_MetaFunction = ({ data }: { data: Awaited<ReturnType<typeof loader>> }) => {
  if (!data) return [
    {
      title: createMetaTitle(`Missing ${data.entity}`)
    },
    {
        name: "description",
        content: `${capitalize(data.entity)} with this id does not exist.`
    }
  ];

  return [
    { title: createMetaTitle(getLocalizedName(data) ?? 'Unknown researcher') },
    { name: "description", content: `${getLocalizedName(data)} is a researcher on the Charles University in Prague.` },
  ];
};

function IconWithBackground({ icon, background, size }) {
  if(!size) size = "16"

  return (
    <div className={`rounded-full w-${size} h-${size} flex justify-center items-center`} style={{ background }}>
      {icon}
    </div>
  )
}

function RelatedItem(input: { name: string, description: string, link: string, type: entityTypes }) {
  const loading = !input;

  const { name, description, type, link } = input;

  return (
    <Link to={link} className="border border-slate-300 shadow rounded-md p-4 mb-4 w-full hover:bg-slate-50 hover:cursor-pointer">
      <div className={`${loading ? 'motion-safe:animate-pulse' : ''} flex space-x-4`}>
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-200 rounded">{name}</div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 rounded col-span-2">
                </div>
                <div className="h-2 bg-slate-200 rounded col-span-1">
                </div>
              </div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
    </Link>
  )
}

function Skeleton() {
  return (
    <div className="border border-slate-300 shadow rounded-md p-4 mb-4 w-full hover:bg-slate-50 hover:cursor-pointer">
      <div className='motion-safe:animate-pulse flex space-x-4'>
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 rounded col-span-2">
                </div>
                <div className="h-2 bg-slate-200 rounded col-span-1">
                </div>
              </div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
    </div>
  )
}

export default function Index() {
  const data = useLoaderData<Awaited<ReturnType<typeof loader>>>();

  return (
    <div className="h-screen flex justify-start items-start flex-col p-8 overflow-scroll">
      <div className="flex justify-center items-center flex-row">
        <IconWithBackground
          icon={<BsPerson className="text-4xl text-white" />}
          background="#F87171"
        />
        <div className="p-4">
          <h2 className="text-stone-800 font-sans font-semibold text-3xl">{getLocalizedName(data)}</h2>
          <span className="text-stone-600">{capitalize(data.entity)} at {getLocalizedName(data.faculties[0])}, CUNI</span>
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
        entities.map(x => {
          const relatedCollection = data[getPlural(x)];
          if(relatedCollection && relatedCollection.length > 0) {
            return (
            <>
              <h2 id={getPlural(x)} className="text-stone-800 font-sans font-semibold text-1xl py-4">
                {capitalize(getPlural(x))}
              </h2>
              {
                relatedCollection.map((item, i) => (
                  <RelatedItem 
                    key={i}
                    name={getLocalizedName(item)}
                    description={`${capitalize(x)}`}
                    link={`/${x}/${item.id}`}
                  />
                ))
              }
            </>
            );
          }
        })
      }
    </div>
  )
}