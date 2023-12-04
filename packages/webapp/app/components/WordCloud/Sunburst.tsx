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
    const { category, id } = data;
    const [stats, setStats] = useState<any>(null);
    
    useEffect(() => {
        fetch(`/person/network?id=${id}`)
            .then(x => x.json())
            .then(network => {
                if(!network || network.length < 0 || !network.me) return;
                setStats({
                    name: network.me.names[0].value,
                    color: getFacultyColor(network.me.faculties[0]?.id ?? 10000, 40, 70),
                    children: network.friends
                        .sort((a, b) => (a.faculties[0]?.id ?? 10000) - (b.faculties[0]?.id ?? 10000))
                        .map((friend: any) => ({
                            id: friend.id,
                            name: stripTitles(friend.names[0].value),
                            angle: Math.log2(friend.score + 1),
                            score: friend.score,
                            faculty: friend.faculties[0],
                            color: getFacultyColor(friend.faculties[0]?.id ?? 10000, 40, 70),
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