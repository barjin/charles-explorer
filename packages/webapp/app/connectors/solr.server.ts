import { type entityTypes } from "~/utils/entityTypes";
import { db } from "@charles-explorer/prisma";
import { Solr } from "@charles-explorer/solr-client";
import axios from "axios";
import dotenv from "dotenv";
import { findUpSync } from "find-up";

const envfile = findUpSync('.env', { cwd: __dirname });
if (envfile) {
    dotenv.config({ path: envfile });
}

const DEFAULT_ROWS_LIMIT = 30;

abstract class CategorySearchClient {
    category: entityTypes;
    searchClient: SearchClient;

    constructor(searchClient: SearchClient) {
        this.searchClient = searchClient;
        this.category = 'default' as any;
    }

    async searchIds(query: string, { rows = DEFAULT_ROWS_LIMIT, ids }: { rows?: number, ids?: string[] } = {}): Promise<{ id: string, score: number }[]> {
        return this.searchClient.solr.getCollection(this.category).searchIds(query, { rows, ids });
    }

    async search(query: string, { rows = DEFAULT_ROWS_LIMIT, includeTextFields = false } = {}): Promise<any[]> {
        return this.searchClient.solr.getCollection(this.category).search(query, { rows, includeTextFields });
    }
    
    async suggest(query: string, { rows = DEFAULT_ROWS_LIMIT } = {}): Promise<any[]> {
        return this.searchClient.solr.getCollection(this.category).suggest(query, { rows, lang: 'cs' });
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

    override async search(query: string, { rows = DEFAULT_ROWS_LIMIT, includeTextFields = false } = {}): Promise<any[]> {
        const programmeMatches = await super.searchIds(query, { rows });
        const classes = await this.searchClient.categoryClients.get('class')!.searchIds(query, { rows: rows * 2 });

        const programmes = await db.programme.findMany({
            where: {
                OR: [
                    {
                        classes: {
                            some: {
                                id: {
                                    in: classes.map(({ id }) => id)
                                }
                            }
                        }
                    },
                    {
                        id: {
                            in: programmeMatches.map(({ id }) => id)
                        }
                    }
                ]
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
                },
                profiles: includeTextFields
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
    private nanokerUrl: string;

    constructor(solrUrl: string, nanokerUrl: string) {
        this.solr = new Solr(solrUrl, db);
        this.nanokerUrl = nanokerUrl;

        this.categoryClients.set('class', new ClassSearchClient(this));
        this.categoryClients.set('programme', new ProgrammeSearchClient(this));
        this.categoryClients.set('publication', new PublicationSearchClient(this));
        this.categoryClients.set('person', new PersonSearchClient(this));
    }

    async search(category: entityTypes, query: string, { rows = DEFAULT_ROWS_LIMIT, includeTextFields = false } = {}): Promise<any[]> {
        return this.categoryClients.get(category)!.search(query, { rows, includeTextFields });
    }
    
    async searchIds(category: entityTypes, query: string, { rows = DEFAULT_ROWS_LIMIT, ids } : {rows?: number, ids?: string[]} = {}): Promise<any[]> {
        return this.categoryClients.get(category)!.searchIds(query, { rows, ids });
    }

    async suggest(category: entityTypes, query: string, { rows = DEFAULT_ROWS_LIMIT } = {}): Promise<any[]> {
        try {
            return await this.categoryClients.get(category)!.suggest(query, { rows });
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getKeywords(content: string, { lang }: { lang: 'en' | 'cs' }): Promise<{ value: string, score: string }[]> {
        const requestUrl = new URL(this.nanokerUrl);
        requestUrl.searchParams.append('lang', lang ?? 'cs');

        const response = await axios.post(requestUrl.href, content);
        return response.data
            .map(([value, score]: [string, number]) => ({ value, score }))
            .filter(({ value }) => value.length > 3)
            .filter(({ value }) => !value.includes('-'))
            .filter(({ value }, i, a) => a.findIndex(({ value: v }) => v.toLowerCase() === value.toLowerCase()) === i)
    }
}

export const searchClient = new SearchClient(
    process.env.SOLR_URL ?? 'http://localhost:8983', 
    process.env.NANOKER_URL ?? 'http://localhost:8547'
);
