import { useRef, useEffect } from 'react';
import { GraphInternal, WordCloud } from './WordCloud';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { useLocation, useNavigate, useParams } from '@remix-run/react';
import cytoscape from 'cytoscape';
// @ts-ignore
import fcose from 'cytoscape-fcose';
/**
 * Renders a social network view on entities and their relationships
 */
export function NetworkView() {
    const graphRef = useRef<HTMLDivElement>(null);
    const cy = useRef<cytoscape.Core>(null);

    const { category, id } = useParams();
    const navigate = useNavigate();
    const { search } = useLocation();
    
    useEffect(() => {
        if(graphRef.current && window.screen.width > 1280 && id && category === 'person') {
            (async () => {
                const networkData: any = await fetch(`/person/network?id=${id}`).then(x => x.json());

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
                                    title: `👤 ${networkData.me.names[0].value}`
                                },
                            },
                            ...networkData.friends.map((x: any) => ({
                                data: {
                                    id: x.id,
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
                    'name': 'fcose',
                    'animate': true,
                    'animationDuration': 1000,
                    'animationEasing': 'ease-in-out',
                    'randomize': true,
                    idealEdgeLength: edge => 1000 / (edge.data('score') + 1),
                    // fit: false,
                    nodeRepulsion: node => 1000
                }).run();

                cy.current?.on('click', 'node', function(evt){
                    const node = evt.target;
                    const id = node.id();
                    navigate(`/person/${id}?` + search.substring(1));
                });
            })();

        }
    }, [graphRef, id, search]);

    if (category !== 'person' || !id) {
        return <WordCloud />;
    }

    return <GraphInternal r={graphRef} />;
}

/**
 * Renders a sunburst view on entities and their relationships
 */