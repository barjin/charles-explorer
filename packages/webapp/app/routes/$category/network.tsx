import { type LoaderArgs } from "@remix-run/node";
import { db } from "~/connectors/prisma";
import axios from 'axios';
import { normalizeName } from "~/utils/people";

const emptyResponse = {
    entities: [],
    relations: []
};

interface Node {
    id: string;
    alternativeIds?: string[],
    type: string;
    title: string;
    faculty: {
        id: string;
        names: { value: string }[];
    };
}

interface Edge {
    source: string;
    target: string;
    score: number;
}

interface SocialNetwork {
    entities: Node[];
    relations: Edge[];
}

// Merges all nodes with the same title into a single node while keeping the edges to other nodes - if there are duplicit edges (between the same nodes) after the node merging, the edge scores are added together
function mergeNodesByTitles(network: SocialNetwork): SocialNetwork {
    const nodes = new Map<string, Node>();
    const mergedTo = new Map<string, string>();

    const internalNodes: Node[] = [];
    const edges = new Map<string, Edge>();

    // Merge nodes with the same title
    network.entities.forEach((node) => {
        if(!node.id.includes('-')) {
            internalNodes.push(node);
            return;
        }

        const title = normalizeName(node.title);

        const existing = nodes.get(title);
        if (existing) {
            mergedTo.set(node.id, existing.id);
            existing.alternativeIds?.push(node.id);
        } else {
            node.alternativeIds = [node.id];
            nodes.set(title, node);
            mergedTo.set(node.id, node.id);
        }
    });

    // Merge edges
    network.relations.forEach((edge) => {
        const source = mergedTo.get(edge.source) ?? edge.source;
        const target = mergedTo.get(edge.target) ?? edge.target;

        const key = `${source}-${target}`;
        const existing = edges.get(key);

        if (existing) {
            existing.score += edge.score;
        } else {
            edges.set(key, { source, target, score: edge.score });
        }
    });

    return {
        entities: Array.from(nodes.values()).concat(internalNodes),
        relations: Array.from(edges.values())
    };
}


/**
 * Given a set of ids, returns a set of nodes and edges that represent the social network of the given ids
 * A social network of ids are an induced subgraph of the entire social network graph.
 * @param param0 
 * @returns 
 */
export async function loader({ request, params }: LoaderArgs): Promise<SocialNetwork> {
    const searchParams = new URL(request.url).searchParams;
    const { category } = params;

    if (category !== 'person') {
        console.error('[network] Invalid category');
        return emptyResponse;
    }

    const ids = searchParams.get('node')?.split(',') ?? [];
    const mode: 'AND' | 'OR' = searchParams.get('op') ?? 'AND' as 'AND' | 'OR' | 'ONLY';

    const url = process.env.NETWORK_URL ?? 'http://localhost:8899/graph';

    const graphUrl = new URL(url);
    graphUrl.searchParams.append('op', mode);
    graphUrl.searchParams.append('node', ids.join(','));

    let nodes = [];
    let edges = [];


    try {
        const data = await axios.get(graphUrl.href);
    
        nodes = data.data.nodes;
        edges = data.data.edges;
    } catch (e) {
        console.error('[network] Failed to fetch graph', e);
        return emptyResponse;
    }

    const peopleWithNames = await db.person.findMany({
        where: {
            id: { in: nodes.map(x => x.id) },
        },
        include: {
            names: true,
            faculties: {
                include: {
                    names: true,
                    abbreviations: true,
                }
            }
        }
    });

    return mergeNodesByTitles({
        entities: peopleWithNames
        .map(x => ({
            id: x.id,
            type: x.type,
            title: x.names[0].value,
            faculty: x.faculties?.[0] ?? {
                id: 'EXTERNAL',
                names: [{ value: 'External' }]
            }
        })),
        relations: edges.map(edge => ({
            source: edge.from,
            target: edge.to,
            score: edge.weight,
        })).filter(x => x.source && x.target)
    });
}
