import { useTranslation } from "react-i18next";
import { EntityParser, entities, getPlural } from "~/utils/entityTypes";
import { CategoryIcons } from "~/utils/icons";
import { useLocalize } from "~/utils/providers/LangContext";
import { getSteppedGradientCSS } from "../RelatedItem";
import { getFacultyColor } from "~/utils/colors";
import { RiExternalLinkLine } from "react-icons/ri";
import { FaRegBookmark } from "react-icons/fa";
import { capitalize } from "~/utils/lang";

import Twemoji from 'react-twemoji';

/**
 * Renders a circular icon with a background color
 */
function IconWithBackground({ icon, background, size, className }: { icon: React.ReactNode, background: string, size?: number, className?: string }) {
    if(!size) size = 12
  
    return (
      <span className={`rounded-full w-${size} h-${size} justify-center items-center p-2 ${className}`} style={{ background }}>
        {icon}
      </span>
    )
}

/**
 * Renders a header for an item with the name, category, faculties and external links
 * 
 * Used in the item detail page.
 */
export default function ItemHeader({ data } : { data: any }) {
    const { t } = useTranslation()
    const { localize } = useLocalize();

    const { category } = data;
  
    const item = EntityParser.parse(data, data.category as any)!;
  
    return (
  <div className="flex items-center flex-row w-full">
    <IconWithBackground
      icon={CategoryIcons[category]({ className: "text-2xl text-white" })}
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
            icon={CategoryIcons[category]({ className: "text-sm text-white" })}
            className='inline-block xl:hidden mr-2'
            background={getSteppedGradientCSS(
              data.faculties.length > 0 ?
                data.faculties.map(x => getFacultyColor(x.id)): ['rgb(255, 153, 0)']
            )
            }
          />  
          {
            capitalize(localize(category))} {localize('at')} {
            data.faculties.length > 0 ?
              data.faculties.map(x => localize(x.names)).join(', ')
              : 'CUNI'
          }
          {
            item.getDetail() && (
              <span className="text-stone-600 flex flex-row items-center text-sm">
                <span className="mx-2"> | </span>
                  <Twemoji options={{ className: 'twemoji' }}>
                    {item.getDetail()}
                  </Twemoji>
              </span>
            )
          }
        </span>
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
                        data[getPlural(x)].length
                      }
                      &nbsp;
                      {
                        t(`${x}`, { count: data[getPlural(x)].length })
                      }
                  </a>
                </span>);
              }
              return null;
            })
          }
        </span>
      </div>
    </div>
  </div>
    )
  }