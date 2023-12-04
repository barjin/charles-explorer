import { useRef, useEffect, useState, memo } from 'react';
import { GraphInternal } from './WordCloud';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { useLocation, useNavigate, useParams } from '@remix-run/react';
import cytoscape from 'cytoscape';
// @ts-ignore
import fcose from 'cytoscape-fcose';
import { getFacultyColor } from '~/utils/colors';
import { FacultiesLegend } from './Legends/FacultiesLegend';
import { WithLegend } from './Legends/WithLegend';
import { stripTitles } from '~/utils/people';

interface GraphEntity {
    id: string;
    title: string;
    faculty: any;
    class?: 'normal' | 'large';
}

interface GraphRelationship {
    source: string;
    target: string;
    score: number;
}

export const NetworkView = memo(function NetworkView({
    data, context
}: {
    data: any,
    context: 'search' | 'entity',
}) {
    const [ state, setState ] = useState<any>({ entities: [], relationships: [], parent: null });

    console.log(context);

    useEffect(() => {
        if ( context === 'search' ) {
            setState({entities: [{
                id: '1',
                title: 'test',
                faculty: {
                id: '1',
                names: [
                    { lang: 'cs', name: 'test' },
                    { lang: 'en', name: 'test' },
                ]
                },
                class: 'large'
            },
            {
                id: '2',
                title: 'test1',
                faculty: {
                id: '3',
                names: [
                    { lang: 'cs', name: 'test3' },
                    { lang: 'en', name: 'test3' },
                ]
                },
            }], relationships: [
                {
                source: '1',
                target: '2',
                score: 10,
                }
            ],
            parent: 'search'
            });
        } else if (context === 'entity') {
            const { id, category } = data;


            fetch(`http://localhost:3000/${category}/network?id=${id}`)
                .then((x) => x.json())
                .then((x) => {
                    setState({
                        entities: [
                            {
                                id: id,
                                title: stripTitles(x.me.names[0].value),
                                faculty: x.me.faculties?.[0],
                                class: 'large',
                            },
                            ...x.friends.map(x => {
                                return {
                                    id: x.id,
                                    title: stripTitles(x.names[0].value),
                                    faculty: x.faculties?.[0],
                                }
                            }),
                        ],
                        relationships: [
                            ...x.friends.map(x => {
                                return {
                                    source: id,
                                    target: x.id,
                                    score: x.score,
                                }
                            }),
                        ],
                })
            });
        }
    }, [data.id, data.category, context])

    return (
        <INetworkView {...{...state}} />
    );
}, (prev, next) => {
    console.log(prev, next);
    return ((prev.data.id === next.data.id)) && prev.context === next.context;
});

/**
 * Renders a social network view on entities and their relationships
 */
export function INetworkView({
    entities,
    relationships,
} : {
    entities: GraphEntity[];
    relationships: GraphRelationship[];
}) {
    const graphRef = useRef<HTMLDivElement>(null);
    const cy = useRef<cytoscape.Core>(null);

    const { category } = useParams();
    const navigate = useNavigate();
    const { search } = useLocation();

    const faculties = entities.map((x) => x.faculty).filter((x, i, a) => a.findIndex(z => z.id === x.id) === i);
    
    useEffect(() => {
        if(graphRef.current && window.screen.width > 1280) {
            cytoscape.use(fcose);

            cy.current = cytoscape({
                container: graphRef.current,
                autoungrabify: true,
                userPanningEnabled: false,
                elements: {
                    nodes: entities.map((x) => ({ data: x, classes: x.class ?? 'normal' })),
                    edges: relationships.map((x) => ({ data: x })),
                },
                style: [
                    {
                        selector: '.large',
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
                            'color': (e: any) => getFacultyColor(e?.data('faculty')?.id),
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

                navigate(`/${category}/${id}?` + search.substring(1));
            });
        }
    }, [graphRef.current, entities, relationships]);

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