import { useFetcher, useNavigate, useParams } from "@remix-run/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PiSpinner } from "react-icons/pi";
import * as d3 from 'd3';
import { useDebounce } from "~/utils/hooks/useDebounce";

const colors = ['blue','purple','orange','red','green', 'orange']

export default function Network({ data, centerId }: { data: {
    nodes: any[],
    edges: any[],
    keywords: string[],
}, centerId: string }) {
    const svgContainer = useRef<HTMLElement>(null);
    const navigate = useNavigate();

    const isCurrentNode = useCallback((d) => {
        return d.PERSON_ID === centerId || d.PUBLICATION_ID === centerId;
    }, [centerId]);
    
    const elements = useRef<{
      people: d3.Selection<SVGGElement | null, any, SVGGElement, undefined> | null,
      publications: d3.Selection<SVGGElement | null, any, SVGGElement, undefined> | null,
      edges: d3.Selection<SVGLineElement | null, any, SVGGElement, undefined> | null,
    }>({
        people: null,
        publications: null,
        edges: null,
    });

    const [simulationRunning, setSimulationRunning] = useState<boolean>(true);
    const [graphSearchQuery, setGraphQuery] = useState<string>('');

    const createNodeLayerWithLabels = useCallback((container: d3.Selection<SVGGElement, undefined, null, undefined>, nodes: any[], labelKey: string, labelOptions?: any) => {
        const containers = container.append("g")
            .selectAll()
            .data(nodes)
            .join("g")
            .attr("transform", d => `translate(${d.x}, ${d.y})`);

        containers.append("title")
            .text(d => d?.[labelKey] ?? '');

        containers.append("text")
            .attr("font-size", 12)
            .attr("font-family", "sans-serif")
            .attr("fill", "black")
            .attr("stroke", "none")
            .attr("dx", 15)
            .attr("dy", 4)
            .text(d => d?.[labelKey] ?? '')
            .attr("opacity", labelOptions?.opacity ?? 1);

        return containers;
    }, []);


    useEffect(()=>{
        // Specify the dimensions of the chart.
        setSimulationRunning(true);
        const width = svgContainer.current?.offsetWidth;
        const height = svgContainer.current?.offsetHeight;

        // Specify the color scale.
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const nodes = data.nodes.map(d => ({...d}));
        const links = data.edges.map(d => ({...d}));

        // Create a simulation with several forces.
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id))
            .force("charge", d3
                .forceManyBody()
                .strength(-1000)
            )
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", ticked);

        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        const content = svg.append("g")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        function isInterCommunityEdge(d) {
            return d.source.community === d.target.community && !isCurrentNode(d.source) && !isCurrentNode(d.target)
        }

        const link = content.append("g")
            .selectAll()
            .data(links)
            .join("line")
            .attr('stroke-width', 1)
            .attr("stroke", (d) => isInterCommunityEdge(d)
                    ? colors[d.source.community % colors.length] 
                    : '#999'
            )
            .attr("stroke-opacity", '0.5')

        const people = nodes.filter(x => x.label === 'person');
        const publications = nodes.filter(x => x.label === 'publication');

        const nodeLayer = content.append("g");

        const peopleNodes = createNodeLayerWithLabels(nodeLayer, people, 'PERSON_NAME');

        peopleNodes.append("circle")
            .attr("r", d => isCurrentNode(d) ? '8' : '5')
            .attr("fill", d => isCurrentNode(d) 
                ? 'orange' 
                : 'white')
            .attr("stroke", d => isCurrentNode(d) ? "black" : "#999")
            .attr("stroke-width", 3)
            .style("cursor", "pointer")
            .on("click", e => {
                navigate(`/person/${e.target.__data__.PERSON_ID}`);
            });
    
        const publicationSize = 10;
        
        const publicationNodes = createNodeLayerWithLabels(nodeLayer, publications, 'TITLE', { opacity: 0.3 });
        
        publicationNodes.append("rect")
            .attr("width", publicationSize)
            .attr("height", publicationSize)
            .attr("x", -publicationSize / 2)
            .attr("y", -publicationSize / 2)
            .attr("fill", d => '#fff')
            .attr("stroke", d => '#999')
            .attr("stroke-width", 3)
            .style("cursor", "pointer")
            .on("click", e => {
                navigate(`/publication/${e.target.__data__.PUBLICATION_ID}`);
            });
        
        publicationNodes.selectAll("text")
            .text(d => d.TITLE.length > 35 ? d.TITLE.substring(0, 35) + '...' : d.TITLE);

        const zoom = d3.zoom()
            .on('zoom', handleZoom);

        function handleZoom(e) {
            content.attr('transform', e.transform);

            peopleNodes
                .selectAll("text")
                .attr("opacity", d => e.transform.k > 0.6 ? 0.8 : 0);

            peopleNodes
                .selectAll("circle")
                .attr("r", e.transform.k > 0.6 ? 5 : 10);

            publicationNodes
                .selectAll("text")
                .attr("opacity", d => e.transform.k > 0.6 ? 0.4 : 0);

            publicationNodes
                .selectAll("rect")
                .attr("width", e.transform.k > 0.6 ? publicationSize : publicationSize * 2)
                .attr("height", e.transform.k > 0.6 ? publicationSize : publicationSize * 2)
        }

        svg.call(zoom);          

        function ticked() {
            try {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);
    
                peopleNodes
                    .attr("transform", d => `translate(${d.x}, ${d.y})`);

                publicationNodes
                    .attr("transform", d => `translate(${d.x}, ${d.y})`);
            } catch (e) {

            }
        }

        setTimeout(() => {
            simulation.stop();

            setSimulationRunning(false);            
        }, 3000);

        elements.current.people = peopleNodes;
        elements.current.publications = publicationNodes;
        elements.current.edges = link;

        if(svgContainer.current){
            if(svgContainer.current.firstChild){
                svgContainer.current.removeChild(svgContainer.current.firstChild);
            }
            svgContainer.current.appendChild(svg.node()!);
        } 
    }, [data]);

    useEffect(() => {
        if(!elements.current) return;

        const query = graphSearchQuery.toLowerCase();

        const people = elements.current.people?.each((d) => {
            d.found = d.PERSON_NAME?.toLowerCase().includes(query) || d.PERSON_ID === centerId
        }) ?? null;

        const publications = elements.current.publications?.each((d) => {
            d.found = d.TITLE.toLowerCase().includes(query) || d.PUBLICATION_ID === centerId
        }) ?? null;
        
        elements.current.edges?.each((d) => {
            d.found = (d.source.found || d.target.found) && (d.source.PERSON_ID !== centerId && d.target.PERSON_ID !== centerId);
        });
        
        const edges = elements.current.edges?.each((d) => {
            if(d.found) {
                d.source.found = true;
                d.target.found = true;
            }
        }) ?? null;
        
        elements.current = {
            people,
            edges,
            publications,
        }

        elements.current.people?.attr("display", d => d.found ? 'block' : 'none');
        elements.current.publications?.attr("display", d => d.found ? 'block' : 'none');


        elements.current.edges
        ?.attr("opacity", d => d.found ? 1 : 0.4)
        ?.transition()
            .attr("stroke-width", d => d.found && query.length > 0 ? 5 : 1)
    }, [centerId, graphSearchQuery]);

    return (
        <div className="relative w-full h-full">
            <div
                className="absolute w-full flex flex-row">
                <input 
                    placeholder="Search in graph"    
                    className="p-1 pl-2 m-4 rounded-md shadow-md"
                    onChange={(e) => setGraphQuery(e.target.value)}
                    value={graphSearchQuery}
                />
                {
                    data.keywords.map((keyword, i) => (
                        <span 
                            key={i} 
                            className="my-4 py-2 px-4 rounded-full shadow-md bg-blue-500 text-white font-semibold text-xs ml-2 cursor-pointer"
                            onClick={() => setGraphQuery(keyword)}
                        >
                                {keyword}
                        </span>
                    ))
                }
            </div>
            <div 
                className={`
                    absolute t-0 l-0 
                    w-full h-full 
                    items-center 
                    flex 
                    justify-center 
                    flex-col
                    bg-slate-100
                `}
                style={{
                    display: simulationRunning ? 'flex' : 'none'
                }}
            >
                <PiSpinner className="spinner" size={32}/>
                <p className="mt-2">Layouting graph...</p>
            </div>
            <div
                className="w-full h-full z-0"
                ref={svgContainer}
            />
        </div>
    );
}

/**
 * Renders a social network view on entities and their relationships
 */
export function NetworkView() {
    const fetcher = useFetcher();
    const params = useParams();

    useEffect(() => {
        fetcher.load(`/person/network?id=${params.id}`);
    }, [params.id]);
    
    return (            
        <div className="w-full h-full text-gray-700 relative bg-slate-100">
            {
                !fetcher.data
                ? 
                    <div className="w-full h-full items-center flex justify-center flex-col">
                        <PiSpinner className="spinner" size={32}/>
                        <p className="mt-2">Loading network view...</p>
                    </div>
                : <>
                    <Network 
                        centerId={params.id}
                        data={fetcher.data}
                    />
                </>
            }
        </div>
    );
}