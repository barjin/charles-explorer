import { useState, useEffect, useRef } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { useNavigate, useLocation } from '@remix-run/react';
import { getFacultyColor } from '~/utils/colors';
import { ResponsivePie } from '@nivo/pie';
import { stripTitles } from '~/utils/people';
import { WithLegend } from './Legends/WithLegend';
import { FacultiesLegend } from './Legends/FacultiesLegend';
import { groupBy } from '~/utils/groupBy';
import { GraphTooltip } from './GraphTooltip';

export function SunburstView({
        data, context
    }: {
        data: any,
        context: 'search' | 'entity',
    }
) {
    const { id, filters } = data;
    const [stats, setStats] = useState<any>(null);

    const [tooltipData, setTooltipData] = useState<any>({
        id: '',
        name: '',
        color: '',
        faculty: {
            abbreviations: [
                { value: '' }
            ]
        },
        visible: false,
        position: [0, 0]
    });

    const seeds = [id, ...(filters?.map(x => x.id).filter(x => x) ?? [])];
    
    useEffect(() => {
        fetch(`/person/network?mode=all&ids=${seeds.join(',')}`)
            .then(x => x.json())
            .then(network => {
                const { entities, relations } = network;

                if(entities.length === 0) return;

                const me = entities.find((x: any) => x.id === id);

                const scores = relations
                    .filter((x: any) => seeds.includes(x.source) || seeds.includes(x.target))
                    .map((x: any) => [seeds.includes(x.source) ? x.target : x.source, x.score])
                    .reduce((acc: any, [key, value]: any) => {
                        acc[key] = Math.min((acc[key] ?? Infinity), value);
                        return acc;
                    }, {});

                const faculties = Object.entries(groupBy(entities, (x: any) => x.faculty?.id ?? 10000)).map(([id, entities]) => (
                    {
                        id,
                        total: entities.reduce((acc: number, x: any) => acc + (scores[x.id] ?? 0), 0)
                    }
                )).sort((a, b) => b.total - a.total).map(x => x.id);

                const maxScore = Math.max(...Object.values(scores));

                const children = entities
                    .filter(x => !seeds.includes(x.id))
                    .filter((x,i,a) => a.length < 30 || scores[x.id] > maxScore * 0.1)
                    .sort((a, b) => scores[b.id] - scores[a.id])
                    .sort((a, b) => (faculties.indexOf(a.faculty?.id ?? 10000) - faculties.indexOf(b.faculty?.id ?? 10000)))
                    .map((friend: any) => ({
                        id: friend.id,
                        name: stripTitles(friend.title),
                        angle: Math.log2(scores[friend.id] + 1),
                        score: scores[friend.id],
                        faculty: friend.faculty,
                        color: getFacultyColor(friend.faculty?.id ?? 10000, 40, 70),
                    }));

                    const others = (entities.length - seeds.length > children.length ? 
                        [entities
                        .filter(x => !seeds.includes(x.id))
                        .filter((x,i,a) => a.length >= 30 && scores[x.id] <= maxScore * 0.1)
                        .map((friend: any) => ({
                            id: friend.id,
                            name: stripTitles(friend.title),
                            angle: Math.log2(scores[friend.id] + 1),
                            score: scores[friend.id],
                            faculty: friend.faculty,
                            color: getFacultyColor(friend.faculty?.id ?? 10000, 40, 70),
                        })).reduce((p,x) => {
                            return {
                                ...p,
                                score: p.score + x.score,
                                // angle: p.angle + x.angle,
                            }
                        }, {
                            id: 'others',
                            name: 'Ostatní',
                            angle: 10,
                            score: 0,
                            faculty: {
                                abbreviations: [
                                    { value: '' }
                                ]
                            },
                            color: '#d1d5db',
                        })] : []);

                setStats({
                    name: me.title,
                    color: getFacultyColor(me.faculty?.id ?? 10000, 40, 70),
                    children: [
                        ...children,
                        ...others,
                    ],
                    connections: [...children.flatMap((x: any) => {
                        const childRelations = relations.filter(
                            (r: any) => 
                                (seeds.includes(r.source) && r.target === x.id) || (r.source === x.id && seeds.includes(r.target)
                            )
                        );

                        return childRelations.map((relation: any) => {
                            return {
                                from: x.id,
                                to: entities.find(x => x.id === (seeds.includes(relation?.source) ? relation?.source : relation?.target)),
                                publications: relation?.score ?? 0,
                            }
                        });
                    }), others?.length > 0 ? {
                        from: 'others',
                        to: entities.find(x => x.id === id),
                        publications: others[0].score,
                    } : undefined].filter(x => x),
                })
            });
    }, [id, filters]);

    const navigate = useNavigate();
    const { search, pathname } = useLocation();

    const graphRef = useRef<HTMLDivElement>(null);

    return stats &&
        <WithLegend
            legend={<FacultiesLegend faculties={stats.children.map((x: any) => x.faculty).filter((x,i,a) => a.findIndex(z => z.id === x.id) === i)} />}
            className={'w-full h-full'}
            r={graphRef}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if(tooltipData.visible && tooltipData.id !== 'others') {
                    navigate({ pathname: pathname + ',' + tooltipData.id, search });
                }
            }}
        >
            <div
                className='w-full h-full relative'
            >
                {
                    tooltipData.visible &&
                    <GraphTooltip 
                        id={tooltipData.id}
                        name={tooltipData.name}
                        faculty={tooltipData.faculty}
                        publications={tooltipData.publications}
                        connections={stats.connections.filter((x: any) => x.from === tooltipData.id)}
                        followCursor={graphRef.current}
                    />
                }
                <ResponsivePie 
                    data={stats.children.map((x: any) => ({ id: x.id, label: x.name, angle: x.angle, score: x.score, color: x.color, faculty: x.faculty }))}
                    margin={{ top: 100, right: 100, bottom: 100, left: 100 }}
                    innerRadius={0.7}
                    cornerRadius={5}
                    colors={(e: any) => e.data.color}
                    borderWidth={1}
                    arcLinkLabel={'label'}
                    arcLabel={''}
                    value={'angle'}
                    borderColor={'#f1f5f9'}
                    borderWidth={5}
                    onClick={(e: any) => {
                        if(e.data.id !== 'others') navigate({ pathname: `/person/${e.data.id}`, search });
                    }}
                    onMouseEnter={(e: any) => {
                        setTooltipData({
                            id: e.data.id,
                            name: e.data.label,
                            color: e.data.color,
                            faculty: e.data.faculty,
                            publications: e.data.score,
                            visible: true,
                            position: [e.clientX, e.clientY]
                        });
                    }}
                    onMouseLeave={() => {
                        setTooltipData({
                            visible: false,
                        });
                    }}
                    layers={['arcs', 'arcLinkLabels', 'arcLabels', 'legends']}
                    tooltip={() => null}
                />
                <span
                    className='absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-3xl font-bold text-slate-900 -z-40'
                >
                    <span>
                        {stats.name}
                    </span>
                    {
                        filters?.length > 0 &&
                        filters.map((x: any) => 
                        (
                            <span className='text-xl text-slate-700 mt-2' key={x.id}>
                                + {x.names[0].value}
                            </span>
                        ))
                    }
                </span>
            </div>
        </WithLegend>
}