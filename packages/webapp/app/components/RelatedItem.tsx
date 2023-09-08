import { Link, useLocation } from "@remix-run/react";
import { CategoryIcons } from "~/utils/icons";
import { EntityParser, type entityTypes } from "~/utils/entityTypes";
import { getFacultyColor } from "~/utils/colors";
import { capitalize } from "~/utils/lang";
import { useLocalize } from "~/providers/LangContext";
import { useTranslation } from "react-i18next";

export function getSteppedGradientCSS(colors: string[] | null) {
    return `linear-gradient(135deg, ${[...colors.map((color, i) => `${color} ${i * 100 / (colors.length)}%, ${color} ${(i+1) * 100 / (colors.length)-0.01}%`), `${colors[colors.length - 1]} 100%`].join(', ')})`;
}

function Linkv2(props: Parameters<typeof Link>[0] & { disabled?: boolean}) {
  if (props.disabled) {
    return <div {...props as any} />
  }

  return <Link {...props} />
}

export function RelatedItem({ items, type, matching }: { items: any, type: entityTypes | 'skeleton', matching?: boolean }) {
    const { search } = useLocation();
    const { localize } = useLocalize();
    const { t } = useTranslation();

    const query = new URLSearchParams(search).get('query') ?? '';

    const item = EntityParser.parse(items[0], type as any);
    
    let name = '';
    let link = '';
    
    if (item) {
      name = localize(item.getNames()) ?? '';
      link = `/${type}/${items[0].id}`;
    }
    const skeleton = type === 'skeleton';

    return (
      <li className="border border-slate-300 shadow rounded-md mb-4 w-full hover:bg-slate-50 hover:cursor-pointer">
      <Linkv2
        title={name} 
        disabled={skeleton}
        to={{ pathname: link, search: search }} 
        aria-label={
          item ?
          `${name} from ${item.getFaculties().map(x => localize(x.names)).join(', ') ?? 'CUNI'}` :
          'Loading...'
        }
        role="listitem"
        >
        <div aria-hidden={true} className={`flex space-x-2 ${skeleton ? 'animate-pulse motion-reduce:animate-none' : ''}` }>
          <div 
            className={`p-1 ${skeleton ? 'bg-slate-400' : 'bg-orange-400'} text-white text-xl`}
            style={{
              background: !skeleton ? getSteppedGradientCSS(items[0].faculties?.map(x => getFacultyColor(x.id))) : undefined
            }}>
            {
              skeleton ?
              <>&nbsp;&nbsp;&nbsp;&nbsp;</> :
              CategoryIcons[type]({
                title: type,
              })
            }
          </div>
          <div className={`flex-1 w-full p-2`}>
            <div className={`h-6 font-medium ${skeleton ? 'bg-slate-300 rounded-sm border-b-2 border-b-white' : ''} text-ellipsis whitespace-nowrap overflow-x-hidden w-11/12 overflow-y-hidden`}>
              {
                skeleton ? <>&nbsp;</> : 
                <div className="flex flex-row items-center">
                  {matching && (
                    <span className="flex" title={capitalize(t('matches', { thisType: t(`this${capitalize(type)}`), query }))}>
                      <span className="flex w-3 h-3 bg-green-500 rounded-full mr-2" />
                    </span>)}
                  <span className="overflow-ellipsis overflow-x-hidden">{name}</span>
                  {
                    items.length > 1 ? 
                    <span className="text-xs text-slate-400 pb-3" title={
                      'Also includes: ' + items.slice(1).map(x => x.id).join(', ')
                    }> +{items.length - 1}</span> : null
                  }
                </div>
              }
              </div>
            <div className={
              `text-sm text-slate-600 overflow-hidden ${skeleton ? 'bg-slate-300 w-5/12 rounded-sm border-t-2 border-t-white' : 'w-10/12'} text-ellipsis whitespace-nowrap`}>
              {
                item?.getDetail() &&
                (
                  <span className="inline text-xs">
                    {item.getDetail()}&nbsp;|&nbsp; 
                  </span>
                )
              }
              {
                skeleton || !item ? <>&nbsp;</> :
                item.getFaculties().length > 0 ? 
                  item.getFaculties().map(x => localize(x.names)).join(', ') ?? '' :
                  `${capitalize(type)} at CUNI`
              }
            </div>
          </div>
        </div>
      </Linkv2>
      </li>
    )
  }