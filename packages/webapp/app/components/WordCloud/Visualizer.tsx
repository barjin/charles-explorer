import { BiNetworkChart } from "react-icons/bi";
import { MdCloudQueue } from "react-icons/md";
import { TbChartDonut } from "react-icons/tb";
import { Tooltip } from "react-tooltip";
import { useParams, useSearchParams } from "@remix-run/react"
import { useTranslation } from "react-i18next";

import { SunburstView } from "~/components/WordCloud/Sunburst";
import { WordCloud } from "~/components/WordCloud/WordCloud";
import { NetworkView } from "~/components/WordCloud/NetworkView"

export const viewTypes = [
    { name: 'cloud', icon: MdCloudQueue, component: WordCloud, tooltipLocalizationKey: 'views.wordcloud' },
    { name: 'network', icon: BiNetworkChart, component: NetworkView, tooltipLocalizationKey: 'views.network' },
    { name: 'sunburst', icon: TbChartDonut, component: SunburstView, tooltipLocalizationKey: 'views.sunburst' },
    // { name: 'chord', icon: TbChartArcs, component: ChordChart, tooltipLocalizationKey: 'views.chord' },
  ] as const;
  
function ViewmodeSwitch() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { category, id } = useParams();
    const { t } = useTranslation();
    const view: (typeof viewTypes)[number]['name'] = searchParams.get('view') as any ?? 'network';

    if(category !== 'person') return null;
  
    return (
          <div className="absolute top-1/3 hidden xl:block z-50">
            {
              viewTypes
              .filter(x => x.name !== 'cloud')
              .map((v, i, a) => (
                v.name === 'sunburst' && !id ? null :
                <div 
                  key={v.name}
                  onClick={() => {
                    setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set('view', v.name);
                        return next;
                    });
                  }}
                  data-tooltip-id="mode-switch-tooltip" data-tooltip-content={t(v.tooltipLocalizationKey)}
                  className={`w-8 h-9 p-1 ${i == 0 ? 'rounded-tr-md' : ''} ${i === a.length - 1 ? 'rounded-br-md': ''} shadow-md cursor-pointer flex items-center justify-center ${v.name === view ? 'bg-slate-100' : 'bg-white'}`}>
                  {typeof v.icon === 'function' ? v.icon({size: 30, color: v.name === view ? '#1F2937' : '#9CA3AF'}) : v.icon}
                </div>
              ))
            }
            <Tooltip id="mode-switch-tooltip" place="right-end"/>
          </div>
    )
}

export function Visualizer({ type, data, context }) {
  const { category } = useParams();
  let showSunburst = category === 'person' && type === 'sunburst' && context === 'entity';
  let showNetwork = category === 'person' && type === 'network';
  let showCloud = !showSunburst && !showNetwork;

  if (category === 'person' && showCloud) {
    showNetwork = true;
    showCloud = false;
  }

  return (
      <div className="w-full h-full relative">
          {
            <div className="absolute h-full -left-4">
                <ViewmodeSwitch />
            </div>
          }
          {
            showCloud && <WordCloud {...{data, context}}/>
          }
          {
            showSunburst && <SunburstView  {...{data, context}} />
          }
          {
            showNetwork && <NetworkView {...{data, context}} />
          }
      </div>
  )
}