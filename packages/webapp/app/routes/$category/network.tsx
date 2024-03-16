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

/**
 * Given a set of ids, returns a set of nodes and edges that represent the social network of the given ids
 * A social network of ids are an induced subgraph of the entire social network graph.
 * @param param0 
 * @returns 
 */
export async function loader({ request, params }: LoaderArgs): Promise<SocialNetwork> {
    return {
        entities: [],
        relations: [],
    }
}
