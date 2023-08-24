import { type entityTypes } from "~/utils/entityTypes";
import { getNames } from "~/utils/retrievers";
import { db } from "./prisma";
import { Solr } from "prisma/feeder/solr/solr";

const solr = new Solr('http://localhost:8983', db);

async function getRelevantIds(query: string, category: entityTypes, { limit = 10 } = {}): Promise<string[]>{
    return (await solr.getCollection(category).searchIds(query, { rows: limit })).map(({ id }) => id);
}

export async function getRelevantEntities(query: string, category: entityTypes, { limit } = { limit: 30 }): Promise<any[]> {
    return await solr.getCollection(category).search(query, { rows: limit });
}