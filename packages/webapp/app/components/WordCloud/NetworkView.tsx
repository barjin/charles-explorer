import { useFetcher, useNavigate, useParams } from "@remix-run/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PiSpinner } from "react-icons/pi";
import * as d3 from 'd3';

const colors = ['blue','yellow','orange','red','green', 'orange']

export default function Network({ data, centerId }: { data: {
    nodes: any[],
    edges: any[],
}, centerId: string }) {
    const svgContainer = useRef<HTMLElement>(null);
    const navigate = useNavigate();
    const isCurrentNode = useCallback((d) => {
        return d.PERSON_ID === centerId || d.PUBLICATION_ID === centerId;
    }, [centerId]);
    const elements = useRef<{
      people: d3.Selection<SVGCircleElement | null, any, SVGGElement, undefined> | null,
      publications: d3.Selection<SVGRectElement | null, any, SVGGElement, undefined> | null,
      edges: d3.Selection<SVGLineElement | null, any, SVGGElement, undefined> | null,
    }>({
        people: null,
        publications: null,
        edges: null,
    });

    const [simulationRunning, setSimulationRunning] = useState<boolean>(true);
    const [graphSearchQuery, setGraphQuery] = useState<string>('');

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

        // Add a line for each link, and a circle for each node.
        const link = content.append("g")
            .selectAll()
            .data(links)
            .join("line")
            .attr('stroke', '#999')
            .attr('stroke-width', 1)
            .attr("stroke", (d) => isInterCommunityEdge(d)
                    ? colors[d.source.community % colors.length] 
                    : '#999'
            )
            .attr("stroke-opacity", d => isInterCommunityEdge(d) ? 0.5 : 0.1)

        const people = nodes.filter(x => x.label === 'person');
        const publications = nodes.filter(x => x.label === 'publication');

        const nodeLayer = content.append("g");

        const peopleNodes = nodeLayer.append("g")
            .selectAll()
            .data(people)
            .join("circle")
                .attr("r", d => isCurrentNode(d) ? '8' : '5')
                .attr("fill", d => isCurrentNode(d) 
                    ? 'orange' 
                    : d.found
                        ? 'black'
                        : '#999')
                .style("cursor", "pointer")
                .on("click", e => {
                    navigate(`/person/${e.target.__data__.PERSON_ID}`);
                });

        const publicationSize = 10;
        
        const publicationNodes = nodeLayer.append("g")
            .selectAll()
            .data(publications)
            .join("rect")
                .attr("width", publicationSize)
                .attr("height", publicationSize)
                .attr("fill", d => '#fff')
                .attr("stroke", d => '#999')
                .attr("stroke-width", 3)
                .style("cursor", "pointer")
                .on("click", e => {
                    navigate(`/publication/${e.target.__data__.PUBLICATION_ID}`);
                });

        peopleNodes.append("title")
            .text(d => d.PERSON_NAME);
        publicationNodes.append("title")
            .text(d => d.TITLE);

        const labels = content.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll()
            .data(nodes)
            .join("text")
            .attr("font-size", 12)
            .attr("font-family", "sans-serif")
            .attr("fill", "black")
            .attr("stroke", "none")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .text(d => 
                d.label === 'person' 
                    ? d.PERSON_NAME 
                    : d.TITLE.slice(0, 20) + (d.TITLE.length > 20 ? '...' : '')
            )
            .attr("opacity", d => {
                return d.label === 'person' ? 0.8 : 0.4;
            });

        const zoom = d3.zoom()
            .on('zoom', handleZoom);

        function handleZoom(e) {
            content.attr('transform', e.transform);

            labels
                .attr("opacity", d => e.transform.k > 0.5 ? d.label === 'person' ? 0.8 : 0.4 : 0);
            peopleNodes.attr("r", e.transform.k > 0.5 ? 5 : 10);
            publicationNodes.attr("width", e.transform.k > 0.5 ? publicationSize : publicationSize * 2);
            publicationNodes.attr("height", e.transform.k > 0.5 ? publicationSize : publicationSize * 2);
            link.attr("stroke-width", e.transform.k > 0.5 ? 1.5 : 3);
            link.attr("stroke-opacity", d => isInterCommunityEdge(d) ? e.transform.k > 0.5 ? 0.2 : 0.5 : e.transform.k > 0.5 ? 0.1 : 0.2);
        }

        svg.call(zoom);          

        function ticked() {
            // if(Date.now() - start > 5000) simulation.stop();
            
            try {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);
    
                peopleNodes
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);

                publicationNodes
                    .attr("x", d => d.x - publicationSize / 2)
                    .attr("y", d => d.y - publicationSize / 2);
    
                labels.attr("x", d => d.x).attr("y", d => d.y);
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

        console.log(elements.current);

        elements.current = {
            people: elements.current.people?.each((d) => {
                d.found = d.PERSON_NAME.toLowerCase().includes(graphSearchQuery) || d.PERSON_ID === centerId
            }) ?? null,
            edges: elements.current.edges?.each((d) => {
                d.found = d.source.found || d.target.found;
            }) ?? null,
            publications: elements.current.publications?.each((d) => {
                d.found = d.TITLE.toLowerCase().includes(graphSearchQuery) || d.PUBLICATION_ID === centerId
            }) ?? null,
        }

        elements.current.people?.attr("opacity", d => d.found ? 1 : 0);
        elements.current.edges?.transition()
            .attr("opacity", d => d3.interpolateNumber(0.0, 1)(d.found ? 1 : 0));
    }, [graphSearchQuery]);

    return (
        <div className="relative w-full h-full">
            <div
                className="absolute">
                <input 
                    placeholder="Search in graph"    
                    className="p-1 pl-2 m-4 rounded-md shadow-md"
                    onChange={(e) => setGraphQuery(e.target.value)}
                />
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