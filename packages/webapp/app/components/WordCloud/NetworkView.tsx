import { useRef, useEffect, useState, memo, useCallback } from 'react';
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
import { jLouvain } from './louvain';
import { GraphTooltip } from './GraphTooltip';

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

export const NetworkView = function NetworkView({
    data, context
}: {
    data: any,
    context: 'search' | 'entity',
}) {
    const [ state, setState ] = useState<any>({ entities: [], relationships: [], communities: [] });

    const { id, filters } = data;

    const seeds = [id, ...(filters?.map(x => x.id).filter(x => x) ?? [])];

    useEffect(() => {
        const { id, category } = data;
        
        if ( context === 'search' ) {
            const searchResultIds = data.searchResults.map(x => x.id)

            fetch(`/${category}/network?op=ONLY&node=${searchResultIds.join(',')}`)
                .then((x) => x.json())
                .then((x) => {

                    const maxScore = Math.max(...x.relations.map(x => x.score));
                    const communities = jLouvain(x.entities.map(x => x.id), x.relations.map(x => ({...x, value: x.score/(maxScore+1)})), 0.05);

                    setState({
                        entities: x.entities,
                        relationships: x.relations.filter(x => communities[x.source] === communities[x.target]),
                        communities,
                        connections: []
                    })
                });
        } else if (context === 'entity') {
            fetch(`/${category}/network?mode=AND&node=${seeds.join(',')}`)
                .then((x) => x.json())
                .then((response) => {
                    const maxScore = Math.max(...response.relations.map(x => x.score));

                    response.entities = response.entities
                    .map(b => ({
                        ...b, 
                        score: response.relations.filter((edge) => 
                            (edge.source === id && edge.target === b.id) || 
                            (edge.source === b.id && edge.target === id))
                                .reduce((acc, x) => acc + x.score, 0)
                            }
                        )
                    );
                    
                    const communities = jLouvain(response.entities.map(x => x.id), response.relations.map(x => ({...x, value: x.score/(maxScore+1)})), 0.1);


                    if(Object.keys(communities).length === [...new Set(Object.values(communities))].length) {
                        setState({
                            entities: response.entities,
                            relationships: response.relations,
                            connections: response.entities
                                .filter(x => seeds.includes(x.id))
                                .flatMap((seed: any) => {
                                    const seedData = response.entities.find(x => x.id === (seed.id));

                                    const incidentEdges = response.relations.filter((edge) => [edge.source, edge.target].includes(seed.id));

                                    return incidentEdges.map((edge: any) => ({
                                        from: edge.source === seed.id ? edge.target : edge.source,
                                        to: seedData,
                                        publications: edge.score
                                    }));
                                })
                        });
                    } else {
                        setState({
                            entities: response.entities
                                .filter(x => x.id !== id),
                            relationships: communities.length > response.relations.length * 0.8 ? 
                                response.relations.filter(edge => edge.source !== id && edge.target !== id) : 
                                response.relations
                                    .filter(edge => edge.source !== id && edge.target !== id)
                                    .filter(x => communities[x.source] === communities[x.target]),
                            connections: response.entities
                                .filter(x => seeds.includes(x.id))
                                .flatMap((seed: any) => {
                                    const seedData = response.entities.find(x => x.id === (seed.id));

                                    const incidentEdges = response.relations.filter((edge) => [edge.source, edge.target].includes(seed.id));

                                    return incidentEdges.map((edge: any) => ({
                                        from: edge.source === seed.id ? edge.target : edge.source,
                                        to: seedData,
                                        publications: edge.score,
                                    }));
                            })
                        })
                    }
                });
        }
    }, [id, filters, context, data.searchResults, data.category])

    return (
        <INetworkView {...{...state}} />
    );
};

/**
 * Renders a social network view on entities and their relationships
 */
export function INetworkView({
    entities,
    relationships,
    connections,
    communities
} : {
    entities: GraphEntity[];
    relationships: GraphRelationship[];
    connections: any[];
    communities: any[];
}) {
    const graphRef = useRef<HTMLDivElement>(null);
    const cy = useRef<cytoscape.Core>(null);

    const { category, id } = useParams();
    const navigate = useNavigate();
    const { search, pathname } = useLocation();

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

    const faculties = entities.map((x) => x.faculty).filter((x, i, a) => a.findIndex(z => z.id === x.id) === i);

    const getNodeSize = useCallback((node: any) => {
        const publications = connections?.filter((x: any) => x.from === node.id()).reduce((acc: number, x: any) => acc + x.publications, 0);

        return `${Math.floor(10*(1.5 + (publications ?? 0) / 20))/10}em`;
    }, [connections]);

    useEffect(() => {
        if(graphRef.current && window.screen.width > 1280) {
            cytoscape.use(fcose);

            cy.current = cytoscape({
                container: graphRef.current,
                autoungrabify: true,
                wheelSensitivity: 0.1,
                elements: {
                    nodes: entities.map((x) => ({ 
                        data: x,
                        classes: x.class ?? 'normal' 
                    })),
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
                            'content': (element: any) => stripTitles(element?.data('title')),
                            'font-size': x => (getNodeSize(x).split('em')[0] * 0.3 + 'em'),
                            'background-opacity': 1,
                            shape: 'ellipse',
                            'color': (e: any) => getFacultyColor(e?.data('faculty')?.id),
                            'background-color': (e: any) => getFacultyColor(e.data('faculty')?.id, 40, 70),
                            'opacity': 1,
                            'width': getNodeSize,
                            'height': getNodeSize,
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            opacity: 0.5,
                            width: (element: any) => element?.data('score') / 10,
                        }
                    }
                ],
            });

            cy.current.on('mouseover', 'node', function({ target: node }) {
                graphRef.current?.classList.add('cursor-pointer');

                setTooltipData({
                    id: node.id(),
                    name: stripTitles(node.data('title')),
                    type: node.data('type'),
                    color: getFacultyColor(node.data('faculty')?.id),
                    faculty: node.data('faculty'),
                    publications: node.data('score'),
                    visible: true,
                    connections: connections?.filter((x: any) => x.from === node.id()),
                    position: [node.renderedPosition().x, node.renderedPosition().y],
                });
            });

            cy.current.on('mouseout', 'node', function() {
                graphRef.current?.classList.remove('cursor-pointer');

                setTooltipData({
                    visible: false,
                });
            });

            const rightClickListener = ({ target: node }) => {
                const id = node.id();
                const data = node.data();

                setTooltipData({
                    visible: false,
                });

                const newPath = pathname + `,${
                    data?.alternativeIds && data.alternativeIds.length > 1
                        ? `[${data.alternativeIds.join('|')}]` 
                        : id
                }`;

                navigate(newPath + search);
            };

            const leftClickListener = ({ target: node }) => {
                const id = node.id();
                const data = node.data();

                setTooltipData({
                    visible: false,
                });

                if(data?.alternativeIds && data.alternativeIds.length > 1) {
                    return rightClickListener({ target: node });
                }

                navigate(`/${category}/${
                    data?.alternativeIds && data.alternativeIds.length > 1
                        ? `[${data.alternativeIds.join('|')}]` 
                        : id
                    }?` + search.substring(1));
            }

            cy.current?.on('click', 'node', leftClickListener);
            cy.current?.on('cxttapstart', 'node', rightClickListener);

            cy.current?.layout({
                name: 'fcose',
                nodeRepulsion: 6000,
                idealEdgeLength: 100,
                animate: true,
                animationDuration: 1000,
                animationEasing: 'ease-in-out',
                randomize: true,
                fit: true,
                padding: 100,
            }).run();
        }
    }, [graphRef.current, entities, relationships, pathname, search ]);

    return (
        <WithLegend 
            legend={<FacultiesLegend faculties={faculties} />}
            className="w-full h-full relative"
        >   
        {
            tooltipData.visible &&
            <GraphTooltip 
                id={tooltipData.id}
                name={tooltipData.name}
                type={tooltipData.type}
                faculty={tooltipData.faculty}
                publications={tooltipData.publications}
                followCursor={graphRef.current}
                connections={tooltipData.connections}
            />
        }
            <GraphInternal r={graphRef} />
        </WithLegend>
    );
}