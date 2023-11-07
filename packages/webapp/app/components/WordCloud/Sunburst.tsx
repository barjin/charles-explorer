import { useRef, useEffect } from 'react';
import { GraphInternal, WordCloud } from './WordCloud';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { useLocation, useNavigate, useParams } from '@remix-run/react';
import { getFacultyColor } from '~/utils/colors';
import { groupBy } from '~/utils/groupBy';

async function SunburstChart(...props: any) {
    return import('sunburst-chart').then(x => x.default(...props));
}

export function Sunburst() {
    const graphRef = useRef<HTMLDivElement>(null);
    const sunburst = useRef<any>(null);

    const { category, id } = useParams();
    const navigate = useNavigate();
    const { search } = useLocation();
    
    useEffect(() => {
        if(graphRef.current && window.screen.width > 1280 && id && category === 'person') {
            (async () => {
                const s = await SunburstChart();
                if(!sunburst.current) {
                    sunburst.current = s;

                    sunburst.current.width(1280);
                    sunburst.current.height(720);
                    sunburst.current.onClick((d: any) => {
                        if(d.type === 'person') {
                            return navigate(`/person/${d.id}?` + search.substring(1));
                        } else {
                            return sunburst.current.focusOnNode(d);
                        }
                    });

                    sunburst.current.color((d: any) => {
                        return getFacultyColor(d.faculty);
                    });

                    sunburst.current(graphRef.current);
                }

                if (sunburst.current.data()?.id !== id) {
                    const networkData: any = await fetch(`/person/network?id=${id}`).then(x => x.json());

                    if(sunburst.current.data()) {
                        sunburst.current.focusOnNode(sunburst.current.data());
                    }

                    sunburst.current.data({
                        id: networkData.me.id,
                        name: networkData.me.names[0].value,
                        children: Object.values(groupBy(networkData.friends, x => x.faculties[0].id)).map((x: any) => ({
                            name: x[0].faculties[0].names[0].value,
                            children: x.map((y: any) => ({
                                name: `${y.names[0].value} (${y.score})`,
                                id: y.id,
                                value: y.score,
                                type: 'person',
                                faculty: y.faculties[0].id,
                            })),
                            value: 0,
                            type: 'faculty',
                            faculty: x[0].faculties[0].id,
                        })),
                        faculty: networkData.me.faculties[0].id,
                    });
                }
            })();

        }
    }, [graphRef, id, search, navigate, category]);

    if (category !== 'person' || !id) {
        return <WordCloud />;
    }

    return <GraphInternal className='flex flex-col justify-evenly'>
        <div className="w-full" ref={graphRef} />
    </GraphInternal>;
}