import { useState, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { useNavigate, useLocation } from '@remix-run/react';
import { getFacultyColor } from '~/utils/colors';
import { ResponsiveSunburst } from '@nivo/sunburst';
import { stripTitles } from '~/utils/people';
import { WithLegend } from './Legends/WithLegend';
import { FacultiesLegend } from './Legends/FacultiesLegend';

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

                setStats({
                    name: me.title,
                    color: getFacultyColor(me.faculty?.id ?? 10000, 40, 70),
                    children: entities
                        .filter(x => x.id !== me.id)
                        .sort((a, b) => (a.faculty.id ?? 10000) - (b.faculty.id ?? 10000))
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
        <ResponsiveSunburst data={stats}
            margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
            id="name"
            value="angle"
            theme={{
                labels: {
                    text: {
                        fontSize: 18,
                    }
                }
            }}
            cornerRadius={10}
            colors={(e: any) => e.data.color}
            enableArcLabels={true}
            arcLabel="id"
            arcLabelsSkipAngle={1}
            arcLabelsTextColor={{
                from: 'color',
                modifiers: [
                    [
                        'darker',
                        1.4
                    ]
                ]
            }}
            onClick={(e: any) => {
                navigate({ pathname: `/person/${e.data.id}`, search });
            }}
            arcLabelsRadiusOffset={0.5}
            layers={['arcs', 'arcLabels', (props: any) =>
                <text x="47%" y="47%" fontSize={30} fontWeight={700} textAnchor="middle" alignmentBaseline="central" dominantBaseline={'center'}>
                    {stats.name}
                </text>
            ]}
            tooltip={(e: any) => {
                const tooltipWidth = 150;
                const tooltipHeight = 50;
                return (
                    <rect width={tooltipWidth} height={tooltipHeight} fill="#ffffff" opacity={1} rx={5} style={{backgroundColor: 'white', padding: '5px'}}>
                        <text x={tooltipWidth / 2} y={tooltipHeight / 2} fill="#333" textAnchor="middle" alignmentBaseline="central">
                            {e.data.name} - {e.data.score} mutual publication{e.data.score > 1 ? 's' : ''}
                        </text>
                    </rect>
                );
            }}
        />
        </WithLegend>
}