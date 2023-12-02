import { useRef, useEffect, useState } from 'react';
import { GraphInternal, WordCloud } from './WordCloud';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { useLocation, useNavigate, useParams } from '@remix-run/react';
import cytoscape from 'cytoscape';
// @ts-ignore
import fcose from 'cytoscape-fcose';
import { getFacultyColor } from '~/utils/colors';
import { FacultiesLegend } from './Legends/FacultiesLegend';
import { WithLegend } from './Legends/WithLegend';
/**
 * Renders a social network view on entities and their relationships
 */

export function NetworkView() {
    const graphRef = useRef<HTMLDivElement>(null);
    const cy = useRef<cytoscape.Core>(null);

    const { category, id } = useParams();
    const navigate = useNavigate();
    const { search } = useLocation();

    const [faculties, setActiveFaculties] = useState<any>([]);
    
    useEffect(() => {
        if(graphRef.current && window.screen.width > 1280 && id && category === 'person') {
            (async () => {
                const networkData: any = await fetch(`/person/network?id=${id}`).then(x => x.json());
                setActiveFaculties(
                    [...networkData.me.faculties, ...networkData.friends.map((x: any) => x.faculties)]
                        .flat()
                        .filter((x, i, a) => a.findIndex(z => z.id === x.id) === i)
                );

                cytoscape.use(fcose);

                cy.current = cytoscape({
                    container: graphRef.current,
                    autoungrabify: true,
                    userPanningEnabled: false,
                    elements: {
                        nodes: [
                            {
                                data: {
                                    id: networkData.me.id,
                                    title: `👤 ${networkData.me.names[0].value}`,
                                    faculty: networkData.me.faculties[0]?.id,
                                },
                            },
                            ...networkData.friends.map((x: any) => ({
                                data: {
                                    id: x.id,
                                    faculty: x.faculties[0]?.id,
                                    title: `👤 ${x.names[0].value}`
                                }
                            })),
                        ],
                        edges: [
                            ...networkData.friends.map((x: any) => ({
                                data: {
                                    source: networkData.me.id,
                                    target: x.id,
                                    score: Number(x.score),
                                }
                            })),
                            ...networkData.friends.map((x: any) => (
                                Object.entries(x.mutual).map(([k,v]: any) => ({
                                    data: {
                                        source: x.id,
                                        target: k,
                                        score: Number(v),
                                    }
                                }))
                            )).flat(),
                        ],
                    },
                    style: [
                        {
                            selector: `#${networkData.me.id}`,
                            style: {
                                "font-size": "2em",
                                "font-weight": "bold",
                            }
                        },
                        {
                            selector: 'node',
                            style: {
                                'label': (element: any) => element?.data('title'),
                                'background-opacity': 0,
                                'color': (e: any) => getFacultyColor(e?.data('faculty')),
                                "text-valign" : "center",
                                'opacity': 1,
                                'width': 'label',
                                'height': '13em',
                            }
                        },
                        {
                            selector: 'edge',
                            style: {
                                opacity: 0.2,
                                width: (element: any) => element?.data('score') / 10,
                            }
                        }
                    ],
                });

                cy.current?.layout({
                    name: 'fcose',
                    animate: true,
                    animationDuration: 1000,
                    animationEasing: 'ease-in-out',
                    randomize: true,
                    idealEdgeLength: (edge: any) => 1000 / (edge.data('score') + 1),
                    // fit: false,
                    nodeRepulsion: 1000
                }).run();

                cy.current?.on('click', 'node', function(evt){
                    const node = evt.target;
                    const id = node.id();

                    navigate(`/person/${id}?` + search.substring(1));
                });
            })();

        }
    }, [graphRef, id, search, setActiveFaculties]);

    if (category !== 'person' || !id) {
        return <WordCloud />;
    }


    return (
        <WithLegend 
            legend={<FacultiesLegend faculties={faculties} />}
            className="w-full h-full"
        >
            <GraphInternal r={graphRef} />
        </WithLegend>
    );
}

/**
 * Renders a sunburst view on entities and their relationships
 */