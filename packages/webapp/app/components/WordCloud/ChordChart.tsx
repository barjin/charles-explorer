import { useState, useEffect } from 'react';
import { WordCloud } from './WordCloud';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { useParams, useNavigate, useLocation } from '@remix-run/react';
import { ResponsiveChord } from '@nivo/chord';
import { stripTitles } from '~/utils/people';

export function ChordChart() {
    const { category, id } = useParams();
    const [data, setData] = useState<any>(null);
    
    useEffect(() => {
        fetch(`/person/network?id=${id}`)
            .then(x => x.json())
            .then(network => {
                if(!network || network.length < 0 || !network.me) return;

                const names = [network.me.names[0].value, ...network.friends.map((x: any) => x.names[0].value)];

                setData({
                    network,
                    names: names.map(stripTitles),
                    data: [
                        [0, ...network.friends.map((x: any) => x.score)],
                        ...names.slice(1).map((name, i) => [network.friends[i]?.score, ...network.friends.map(x => network.friends[i].mutual[x.id] || 0)])
                    ]
                })
            });
    }, [id]);

    const navigate = useNavigate();
    const { search } = useLocation();

    if (category !== 'person' || !id) {
        return <WordCloud />;
    }

    return data &&
        <ResponsiveChord
        data={data.data}
        keys={data.names}
        margin={{ top: 200, right: 100, bottom: 200, left: 100 }}
        valueFormat={value => `${value} publications`}
        padAngle={0.02}
        inactiveArcOpacity={0.25}
        arcBorderColor={{
            from: 'color',
            modifiers: [
                [
                    'darker',
                    0.6
                ]
            ]
        }}
        activeRibbonOpacity={0.8}
        inactiveRibbonOpacity={0.25}
        ribbonBorderColor={{
            from: 'color',
            modifiers: [
                [
                    'darker',
                    1
                ]
            ]
        }}
        labelRotation={-90}
        labelTextColor={{
            from: 'color',
            modifiers: [
                [
                    'darker',
                    1
                ]
            ]
        }}
        onArcClick={(arc: any) => {
            if(arc.index !== 0) {
                navigate(`/person/${data.network.friends[arc.index - 1].id}${search}`);
            }
        }}
        colors={{ scheme: 'nivo' }}
    />
}