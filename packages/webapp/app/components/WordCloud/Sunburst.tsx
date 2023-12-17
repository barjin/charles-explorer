import { useState, useEffect } from 'react';
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
    const { id } = data;
    const [stats, setStats] = useState<any>(null);
    
    useEffect(() => {
        fetch(`/person/network?ids=${id}`)
            .then(x => x.json())
            .then(network => {
                const { entities, relations } = network;

                if(entities.length === 0) return;

                const me = entities.find((x: any) => x.id === id);

                const scores = Object.fromEntries(relations
                    .filter((x: any) => x.source === id || x.target === id)
                    .map((x: any) => [x.source === id ? x.target : x.source, x.score]));

                const faculties = Object.entries(groupBy(entities, (x: any) => x.faculty?.id ?? 10000)).map(([id, entities]) => (
                    {
                        id,
                        total: entities.reduce((acc: number, x: any) => acc + (scores[x.id] ?? 0), 0)
                    }
                )).sort((a, b) => b.total - a.total).map(x => x.id);

                setStats({
                    name: me.title,
                    color: getFacultyColor(me.faculty?.id ?? 10000, 40, 70),
                    children: entities
                        .filter(x => x.id !== me.id)
                        .sort((a, b) => scores[b.id] - scores[a.id])
                        .sort((a, b) => (faculties.indexOf(a.faculty?.id ?? 10000) - faculties.indexOf(b.faculty?.id ?? 10000)))
                        .map((friend: any) => ({
                            id: friend.id,
                            name: stripTitles(friend.title),
                            angle: Math.log2(scores[friend.id] + 1),
                            score: scores[friend.id],
                            faculty: friend.faculty,
                            color: getFacultyColor(friend.faculty?.id ?? 10000, 40, 70),
                    }))
                })
            });
    }, [id]);

    const navigate = useNavigate();
    const { search } = useLocation();

    return stats &&
        <WithLegend
            legend={<FacultiesLegend faculties={stats.children.map((x: any) => x.faculty).filter((x,i,a) => a.findIndex(z => z.id === x.id) === i)} />}
            className={'w-full h-full'}
        >
            <ResponsivePie 
                data={stats.children.map((x: any) => ({ id: x.id, label: x.name, angle: x.angle, score: x.score, color: x.color, faculty: x.faculty }))}
                margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
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
                    navigate({ pathname: `/person/${e.data.id}`, search });
                }}
                margin={{ top: 100, right: 100, bottom: 100, left: 100 }}
                layers={['arcs', 'arcLinkLabels', 'arcLabels', 'legends', (props: any) =>
                    <text x="45%" y="43%" fontSize={30} fontWeight={700} textAnchor="middle" alignmentBaseline="central" dominantBaseline={'center'}>
                        {stats.name}
                    </text>
                ]}
                tooltip={(e: any) => {
                    e = e.datum;
                    return (
                        <GraphTooltip
                            name={e.label}
                            color={getFacultyColor(e.data?.faculty?.id ?? 10000)}
                            faculty={e.data?.faculty}
                            publications={e.data?.score}
                            />
                    );
                }}
            />
        </WithLegend>
}