import { type entityTypes } from "~/utils/entityTypes";
import { db } from "./prisma";
import { Solr } from "prisma/feeder/solr/solr";

const DEFAULT_ROWS_LIMIT = 30;

abstract class CategorySearchClient {
    category: entityTypes;
    searchClient: SearchClient;

    constructor(searchClient: SearchClient) {
        this.searchClient = searchClient;
        this.category = 'default' as any;
    }

    async searchIds(query: string, { rows = DEFAULT_ROWS_LIMIT } = {}): Promise<{ id: string, score: number }[]> {
        return this.searchClient.solr.getCollection(this.category).searchIds(query, { rows });
    }

    async search(query: string, { rows = DEFAULT_ROWS_LIMIT } = {}): Promise<any[]> {
        return this.searchClient.solr.getCollection(this.category).search(query, { rows });
    }
}

class ClassSearchClient extends CategorySearchClient {
    constructor(searchClient: SearchClient) {
        super(searchClient);
        this.category = 'class';
    }
}
class PublicationSearchClient extends CategorySearchClient {
    constructor(searchClient: SearchClient) {
        super(searchClient);
        this.category = 'publication';
    }
}
class ProgrammeSearchClient extends CategorySearchClient {
    constructor(searchClient: SearchClient) {
        super(searchClient);
        this.category = 'programme';
    }

    override async search(query: string, { rows = DEFAULT_ROWS_LIMIT } = {}): Promise<any[]> {
        const classes = await this.searchClient.categoryClients.get('class')!.searchIds(query, { rows: rows * 2 });

        const programmes = await db.programme.findMany({
            where: {
                classes: {
                    some: {
                        id: {
                            in: classes.map(({ id }) => id)
                        }
                    }
                }
            },
            include: {
                names: true,
                faculties: {
                    include: {
                        names: true,
                    }
                },
                classes: {
                    select: {
                        id: true,
                    }
                }
            }
        });

        return programmes
            .map(programme => ({ 
                ...programme,
                score: classes.filter(({ id }) => programme.classes.some(({ id: classId }) => classId === id)).reduce((acc, { score }) => acc + score, 0)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, rows);
    }

    override async searchIds(query: string, { rows = DEFAULT_ROWS_LIMIT } = {}): Promise<{ id: string, score: number }[]> {
        const matches = await this.search(query, { rows });
        return matches.map(({ id, score }) => ({ id, score }));
    }
}

class PersonSearchClient extends CategorySearchClient {
    constructor(searchClient: SearchClient) {
        super(searchClient);
        this.category = 'person';
    }
}

class SearchClient {
    public solr: Solr;
    public categoryClients = new Map<entityTypes, CategorySearchClient>();
    constructor(url: string) {
        this.solr = new Solr(url, db);
        this.categoryClients.set('class', new ClassSearchClient(this));
        this.categoryClients.set('programme', new ProgrammeSearchClient(this));
        this.categoryClients.set('publication', new PublicationSearchClient(this));
        this.categoryClients.set('person', new PersonSearchClient(this));
    }

    async search(category: entityTypes, query: string, { rows = DEFAULT_ROWS_LIMIT } = {}): Promise<any[]> {
        return this.categoryClients.get(category)!.search(query, { rows });
    }
    
    async searchIds(category: entityTypes, query: string, { rows = DEFAULT_ROWS_LIMIT } = {}): Promise<any[]> {
        return this.categoryClients.get(category)!.searchIds(query, { rows });
    }
}

export const searchClient = new SearchClient(process.env.SOLR_URL ?? 'http://localhost:8983');
