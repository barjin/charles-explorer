import { type LoaderArgs } from "@remix-run/node";
import socialNetwork from "~/assets/social_network.json";
import { db } from "~/connectors/prisma";

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

    const ids = searchParams.get('ids')?.split(',') ?? [];
    let depth = parseInt(searchParams.get('depth') ?? '0');

    if ( ids.length === 1 ) {
        depth = 1;
    }

    if(!ids) {
        console.error('[network] no ids provided');
        return emptyResponse; 
    }

    const people = (await db.person.findMany({
        where: {
            id: { in: ids }
        },
        select: {
            private_id: true,
        }
    })) ?? {};

    if(people.length === 0) {
        console.error('[network] no valid nodes found');
        return emptyResponse;
    }

    // find neighborhood of nodes
    let nodes = people.map(x => x.private_id);
    let newNodes = nodes;

    for (let i = 0; i < depth; i++) {
        const newDiscovered = newNodes
            .flatMap(x => Object.entries(socialNetwork[x] ?? {})
                .filter(([_, score], i, a) => {
                    if(a.length < 50) return true;
                    const maxScore = Math.max(...a.map(([_, score]) => score));
                    return score > maxScore * 0.1;
                })
                .map(([id]) => id)
            );
        nodes = [...new Set([...nodes, ...newNodes])];

        newNodes = newDiscovered;
    }

    nodes = [...new Set([...nodes, ...newNodes])];

    const relations = [];

    for (const id of nodes) {
        for (const id2 of nodes) {
            if (id <= id2) {
                continue;
            }

            if (socialNetwork[id]?.[id2]) {
                relations.push({
                    source: id,
                    target: id2,
                    score: socialNetwork[id][id2]
                });
            }
        }
    }

    const peopleWithNames = await db.person.findMany({
        where: {
            private_id: { in: nodes },
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

    const peopleIdMap = Object.fromEntries(peopleWithNames.map(x => [x.private_id, x]));

    const translatedRelations = relations.map(x => ({
        source: peopleIdMap[x.source]?.id,
        target: peopleIdMap[x.target]?.id,
        score: x.score,
    })).filter(x => x.source && x.target)

    return {
        entities: peopleWithNames.map(x => ({
            id: x.id,
            title: x.names[0].value,
            faculty: x.faculties?.[0] ?? {
                id: '123',
                names: [{ value: 'Unknown' }]
            }
        })),
        relations: translatedRelations
    };
}
