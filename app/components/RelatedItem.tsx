import { Link, useLocation } from "@remix-run/react";
import { CategoryIcons } from "~/utils/icons";
import { type entityTypes } from "~/utils/entityTypes";
import { getFacultyColor } from "~/utils/colors";
import { capitalize, getLocalizedName } from "~/utils/lang";

export function getSteppedGradientCSS(colors: string[] | null) {
    return `linear-gradient(135deg, ${[...colors.map((color, i) => `${color} ${i * 100 / (colors.length)}%, ${color} ${(i+1) * 100 / (colors.length)-0.01}%`), `${colors[colors.length - 1]} 100%`].join(', ')})`;
}

function Linkv2(props: Parameters<typeof Link>[0] & { disabled?: boolean}) {
  if (props.disabled) {
    return <div {...props as any} />
  }

  return <Link {...props} />
}

export function RelatedItem({ items, type }: { items: any, type: entityTypes | 'skeleton' }) {
    const { search } = useLocation();

    const name = getLocalizedName(items[0]) ?? '';
    const link = `/${type}/${items[0].id}`;

    const skeleton = type === 'skeleton';

    return (
      <Linkv2
        title={name} 
        disabled={skeleton}
        to={{ pathname: link, search: search }} 
        className="border border-slate-300 shadow rounded-md mb-4 w-full hover:bg-slate-50 hover:cursor-pointer"
        aria-label={`${name} from ${items[0].faculties?.map(x => getLocalizedName(x)).join(', ') ?? 'CUNI'}`}
        role="listitem"
        >
        <div aria-hidden={true} className={`flex space-x-4 ${skeleton ? 'animate-pulse motion-reduce:animate-none' : ''}` }>
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
                skeleton ? <>&nbsp;</> : name
              }
              {
                items.length > 1 ? 
                <span className="text-xs text-slate-400 pb-3" title={
                  'Also includes: ' + items.slice(1).map(x => x.id).join(', ')
                }> +{items.length - 1}</span> : null
              }
              </div>
            <div className={
              `text-sm text-slate-600 overflow-hidden ${skeleton ? 'bg-slate-300 w-5/12 rounded-sm border-t-2 border-t-white' : ''} text-ellipsis whitespace-nowrap`}>
              {
                skeleton ? <>&nbsp;</> :
                items[0].faculties.length > 0 ? 
                  items[0].faculties.map(x => getLocalizedName(x)).join(', ') ?? '' :
                  `${capitalize(type)} at CUNI`
              }
            </div>
          </div>
        </div>
      </Linkv2>
    )
  }