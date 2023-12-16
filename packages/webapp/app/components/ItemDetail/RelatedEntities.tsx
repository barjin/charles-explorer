import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { capitalize } from "~/utils/lang";
import { getPlural, type entityTypes }  from "~/utils/entityTypes";
import { RelatedItem } from "~/components/RelatedItem";
import { useCallback, useEffect, useState } from "react";
import { groupBy } from "~/utils/groupBy";
import { useLocalize } from "~/utils/providers/LangContext";
import { useTranslation } from "react-i18next";

const MAX_ITEMS = 10;

/**
 * Renders a list of entities related to the current item
 * @param category The category of the entities
 * @param collection The collection of the entities itself
 * @param matching IDs of the entities that match the current query
 */
export default function RelatedEntities({ category, collection, matching }: { category: entityTypes, collection: any[], matching: any[] }){
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const { localize } = useLocalize();
    const { t } = useTranslation();

    const [limit, setLimit] = useState<number>(MAX_ITEMS);
  
    const groupByName = useCallback((collection: any[]) => groupBy(collection, x => `${x.faculties.length}-${x.faculties?.[0]?.id ?? ''}-${localize(x.names)}` ?? ''), [localize]);
    const loadMore = useCallback(() => {
      if(limit >= collection.length) return;
      setLimit(limit + MAX_ITEMS);
    }, [limit, collection]);
  
    const collapse = useCallback(() => {  
      setCollapsed(!collapsed);
    }, [collapsed]);
  
    collection.sort((a, b) => {
      return b.faculties.length - a.faculties.length;
    });

    useEffect(() => {
      setLimit(MAX_ITEMS);
    }, [collection]);
  
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
        {capitalize(t(category, {count: Math.min(groupedCollection.length, 2)}))} { collapsed ? <FaChevronRight className="inline" /> : <FaChevronDown className="inline" /> }
      </h3>
      <div className={`${collapsed ? 'hidden' : ''}`}>
      <ul 
        className='w-full flex flex-col pl-2'
      >
      {
        groupedCollection
        .sort((a, b) => (b[0].year - a[0].year) ?? 0)
        .sort((a, b) => {
          return (b.some(
            x => matching.map(x => x.id).includes(x.id)
          ) ? 1 : 0) - (a.some(
            x => matching.map(x => x.id).includes(x.id)
          ) ? 1 : 0);
        })
        .slice(0, limit)
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
      </ul>
        {
          limit < collection.length && 
            <button className="text-blue-500 font-sans font-semibold text-1xl py-2 hover:cursor-pointer select-none text-center w-full" onClick={loadMore}>
              {
                t('loadMore') + ' ' + t(category, {count: 2})
              } ({collection.length - limit})
            </button>
        }
      </div>
    </div>);
  }