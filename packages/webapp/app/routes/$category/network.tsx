import { type LoaderArgs } from "@remix-run/node";
import { db } from "~/connectors/prisma";
import axios from 'axios';

const emptyResponse = {
    entities: [],
    relations: []
};

/**
 * Given a set of ids, returns a set of nodes and edges that represent the social network of the given ids
 * A social network of ids are an induced subgraph of the entire social network graph.
 * @param param0 
 * @returns 
 */
export async function loader({ request, params }: LoaderArgs) {
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

    return {
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
    };
}
