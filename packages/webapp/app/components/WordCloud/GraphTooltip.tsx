import { useMatches } from "@remix-run/react";
import { useEffect, useState, memo } from "react";
import { getFacultyColor } from "~/utils/colors";
import { IconWithBackground } from "../ItemDetail/ItemHeader";
import { CategoryIcons } from "~/utils/icons";
import { RightClick } from "~/assets/RightClick";

function IGraphTooltip({ 
    id,
    name, 
    faculty, 
    publications, 
    style,
    connections,
    followCursor = null,
} : { id?: string, name: string, faculty: any, publications?: number, style ?: any, followCursor?: any, connections?: any }) {
    const [position, setPosition] = useState([0, 0]);

    const matches = useMatches();  
    const context = matches[2]?.id === 'routes/$category/index' ? 'search' : 'entity';

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            setPosition([e.clientX, e.clientY]);
        };

        followCursor?.addEventListener?.('mousemove', handler);

        return () => {
            followCursor?.removeEventListener?.('mousemove', handler);
        }
    }, [followCursor]);

    return (
      <div className={`w-80 flex flex-col fixed bg-gray-100 shadow-lg z-50 ${position[0] === 0 && position[1] === 0 ? 'hidden' : ''}`} style={
        {
          top: position[1] + 10,
          left: position[0] + 10,
          ...style,
        }
      }>
        <div className="flex flex-row bg-white shadow-md p-3">
          <div className="flex flex-col">
            <IconWithBackground background={getFacultyColor(faculty?.id)} icon={CategoryIcons['person']({})} className="text-white"  />
              <div className="flex-1"></div>
          </div>
            <div className="flex flex-col ml-3">
              <div className="text-lg font-semibold text-gray-900 text-ellipsis overflow-hidden whitespace-nowrap">{name}</div>
              <div className="text-sm text-gray-500">Osoba na {faculty?.abbreviations?.[0]?.value ?? 'neznámá fakulta'} UK</div>
          </div>
        </div>
        {
            (context === 'entity' && connections?.length > 0 &&
            <div className="flex flex-col p-4 pb-1 ml-5 items-end">
              {
                connections?.sort((a,b) => b.publications - a.publications)?.map?.((connection: any,i: number) => (
                  <div className="mb-3" key={i}>
                    <div className="text-sm font-semibold text-gray-700 flex flex-row items-center">
                      <div className="w-3 h-3 rounded-full mr-2 text-right" style={{backgroundColor: getFacultyColor(connection?.to?.faculty?.id)}}></div>
                      {connection.to?.title}
                    </div>
                    <div className="text-xs text-right text-gray-500">
                      {CategoryIcons['publication']({className: 'inline'})} 
                      {connection?.publications} společných publikací
                    </div>
                  </div>
                ))
              }
            </div>)
        }
        {
          id !== 'others' &&
          <div className="text-xs text-gray-500 bg-white px-3 py-1 flex flex-row">
            <div className="flex flex-row items-center">
              <RightClick width="1em" height="1em" className="mr-1 -scale-x-100" />
              <span>
                Zobrazit
              </span>
            </div>
            {
              context === 'entity' && (
                <div className="flex flex-row items-center ml-4">
                  <RightClick width="1em" height="1em" className="mr-1" />
                  <span>
                    Přidat jako filtr
                  </span>
                </div>
              )
            }
          </div>

        }
      </div>
    )
}

export const GraphTooltip = memo(IGraphTooltip, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id
});