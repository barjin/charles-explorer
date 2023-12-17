import { useState, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { useNavigate, useLocation } from '@remix-run/react';
import { getFacultyColor } from '~/utils/colors';
import { ResponsivePie } from '@nivo/pie';
import { stripTitles } from '~/utils/people';
import { WithLegend } from './Legends/WithLegend';
import { FacultiesLegend } from './Legends/FacultiesLegend';
import { groupBy } from '~/utils/groupBy';

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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={352}
                            height={107}
                            fill="none"
                        >
                            <g filter="url(#a)">
                            <rect
                                width={342}
                                height={97.439}
                                x={5}
                                y={4.561}
                                fill="#fff"
                                rx={7.236}
                            />
                            </g>
                            <text
                            xmlSpace="preserve"
                            fill="#000"
                            fontFamily="Inter"
                            fontSize={23.154}
                            fontWeight={600}
                            letterSpacing="0em"
                            style={{
                                whiteSpace: "pre",
                            }}
                            >
                            <tspan x={55.166} y={40.487}>
                                {`${e.data?.label.slice(0, 20)}${e.data?.label.length > 20 ? '...' : ''}`}
                            </tspan>
                            </text>
                            <g filter="url(#b)">
                            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"></path>
                            <circle cx={32.495} cy={32.539} r={12.059} fill={e.data?.color} />
                            </g>
                            <text
                            xmlSpace="preserve"
                            fill="#767676"
                            fontFamily="Inter"
                            fontSize={15.436}
                            letterSpacing="0em"
                            style={{
                                whiteSpace: "pre",
                            }}
                            >
                            <tspan x={55.166} y={62.605}>
                                {`Osoba na ${e.data?.faculty?.abbreviations[0].value ?? 'neznámé fakultě'} UK`}
                            </tspan>
                            </text>
                            <text
                            xmlSpace="preserve"
                            fill="#616770"
                            fontFamily="Inter"
                            fontSize={15.436}
                            letterSpacing="0em"
                            style={{
                                whiteSpace: "pre",
                            }}
                            >
                            <tspan x={163.331} y={92.512}>
                                {`${e.data?.score} společných publikací`}
                            </tspan>
                            </text>
                            <path d="M32.5 32.5C33.2459 32.5 33.9613 32.2037 34.4887 31.6762C35.0162 31.1488 35.3125 30.4334 35.3125 29.6875C35.3125 28.9416 35.0162 28.2262 34.4887 27.6988C33.9613 27.1713 33.2459 26.875 32.5 26.875C31.7541 26.875 31.0387 27.1713 30.5113 27.6988C29.9838 28.2262 29.6875 28.9416 29.6875 29.6875C29.6875 30.4334 29.9838 31.1488 30.5113 31.6762C31.0387 32.2037 31.7541 32.5 32.5 32.5ZM34.375 29.6875C34.375 30.1848 34.1775 30.6617 33.8258 31.0133C33.4742 31.365 32.9973 31.5625 32.5 31.5625C32.0027 31.5625 31.5258 31.365 31.1742 31.0133C30.8225 30.6617 30.625 30.1848 30.625 29.6875C30.625 29.1902 30.8225 28.7133 31.1742 28.3617C31.5258 28.01 32.0027 27.8125 32.5 27.8125C32.9973 27.8125 33.4742 28.01 33.8258 28.3617C34.1775 28.7133 34.375 29.1902 34.375 29.6875ZM38.125 37.1875C38.125 38.125 37.1875 38.125 37.1875 38.125H27.8125C27.8125 38.125 26.875 38.125 26.875 37.1875C26.875 36.25 27.8125 33.4375 32.5 33.4375C37.1875 33.4375 38.125 36.25 38.125 37.1875ZM37.1875 37.1838C37.1866 36.9531 37.0431 36.2594 36.4075 35.6237C35.7963 35.0125 34.6459 34.375 32.5 34.375C30.3531 34.375 29.2038 35.0125 28.5925 35.6237C27.9569 36.2594 27.8144 36.9531 27.8125 37.1838H37.1875Z" fill="white" stroke="white"/>
                            <path
                            fill="#616770"
                            d="M156.826 79.369h-8.924c-.82 0-1.487.667-1.487 1.487v13.386l5.949-3.4 5.949 3.4V80.856c0-.82-.667-1.487-1.487-1.487Zm0 12.31-4.462-2.55-4.462 2.55V80.856h8.924V91.68Z"
                            />
                            <defs>
                            <filter
                                id="a"
                                width={350.779}
                                height={106.218}
                                x={0.61}
                                y={0.172}
                                colorInterpolationFilters="sRGB"
                                filterUnits="userSpaceOnUse"
                            >
                                <feFlood floodOpacity={0} result="BackgroundImageFix" />
                                <feColorMatrix
                                in="SourceAlpha"
                                result="hardAlpha"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                                />
                                <feOffset />
                                <feGaussianBlur stdDeviation={2.195} />
                                <feComposite in2="hardAlpha" operator="out" />
                                <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                                <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_10_34" />
                                <feBlend
                                in="SourceGraphic"
                                in2="effect1_dropShadow_10_34"
                                result="shape"
                                />
                            </filter>
                            <filter
                                id="b"
                                width={24.119}
                                height={26.048}
                                x={20.436}
                                y={20.48}
                                colorInterpolationFilters="sRGB"
                                filterUnits="userSpaceOnUse"
                            >
                                <feFlood floodOpacity={0} result="BackgroundImageFix" />
                                <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                <feColorMatrix
                                in="SourceAlpha"
                                result="hardAlpha"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                                />
                                <feOffset dy={1.929} />
                                <feGaussianBlur stdDeviation={1.206} />
                                <feComposite in2="hardAlpha" k2={-1} k3={1} operator="arithmetic" />
                                <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                                <feBlend in2="shape" result="effect1_innerShadow_10_34" />
                            </filter>
                            </defs>
                        </svg>
                    );
                }}
            />
        </WithLegend>
}