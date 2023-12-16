import { getTextFields, db } from '@charles-explorer/prisma';
import axios from 'axios';

/**
 * SolrCollection is a wrapper around a Solr core with a simple API for creating the search core, adding documents and performing search.
 */
class SolrCollection {
    /**
     * The underlying Solr instance.
     */
    private solr: Solr;
    /**
     * The name of the Solr core.
     */
    private collection: string;
    /**
     * Whether the Solr core exists. This is `false` until the first call to `createIfNotExists()`.
     */
    private exists = false;

    constructor(solr: Solr, collection: string) {
        this.solr = solr;
        this.collection = collection;
    }

    /**
     * Creates the Solr core if it does not exist yet.
     * 
     * First checks if the core exists by calling the Solr API. 
     * If it does not exist, it creates it using the `sharedConfig` config set containing the `managed-schema.xml` and `solrconfig.xml` files.
     */
    public async createIfNotExists() {
        if(this.exists) return;

        await axios(`${this.solr.url}/solr/admin/cores?action=STATUS&core=${this.collection}`).then(async (res) => {
            if(Object.values(res.data.status[this.collection]).length > 0) return;

            await axios.post(`${this.solr.url}/api/cores`, {
                create: [{
                    name: this.collection,
                    instanceDir: this.collection,
                    configSet: "sharedConfig"
                }]
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        });

        this.exists = true;
    }

    /**
     * Returns the URL of the Solr core with the given slug.
     * @param slug The slug to append to the URL.
     * @returns The URL of the Solr core with the given slug.
     */
    private getSelfUrl(slug = '') {
        return new URL(`/solr/${this.collection}/${slug}`, this.solr.url).href;
    }

    /**
     * Adds a single document to the Solr core. This document has to follow the schema defined in `managed-schema.xml`.
     * 
     * In case you are adding multiple documents, use `addDocuments()` instead, which is more efficient.
     * @param document The document to add.
     */
    async addDocument(document: any) {
        await this.createIfNotExists();

        await axios.post(this.getSelfUrl('update'), document, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Adds multiple documents to the Solr core. These documents have to follow the schema defined in `managed-schema.xml`.
     * @param documents The array of documents to add.
     */
    async addDocuments(documents: any[]) {
        await this.createIfNotExists();

        await axios.post(this.getSelfUrl('update'), documents, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Runs the Solr commit and suggest build commands.
     * 
     * This causes the Solr core to update its index and build the suggester. It might take a while to finish.
     */
    async finish() {
        await axios.get(this.getSelfUrl('update?commit=true'));
        await axios.get(this.getSelfUrl('suggest?suggest.buildAll=true'));
    }
    
    /**
     * Escapes special characters in a Solr query.
     * @param query The query to escape.
     * @returns The escaped query.
     */
    private escapeSolrQuery(query: string){
        const specialChars = ["+","-","&","|","!","(",")","{","}","[","]","^","\"","~","*","?",":","/"];
    
        return specialChars.reduce((acc, char) => acc.replaceAll(char, `\\${char}`), query).split(' ').join(' ');
    }
    
    /**
     * Performs a search in the Solr core and returns the IDs of the matching documents.
     * @param query Query to search for.
     * @param options Options for the search (e.g. number of results to return or IDs to filter by)
     * @returns Array of IDs of the matching documents with their relevance scores.
     */
    async searchIds(query: string, options?: { rows?: number, ids?: string[] }): Promise<{ id: string, score: number }[]> {
        if (!query || options.ids?.length === 0) {
            return Promise.resolve([]);
        }
    
        const escapedQuery = this.escapeSolrQuery(query);
        
        const queryParts: string[] = [];
        const fields = ["lvl0_cs", "lvl0_en", "lvl1_cs", "lvl1_en", "lvl2_cs", "lvl2_en"];

        fields.forEach((field, i) => {
            queryParts.push(`${field}:"${escapedQuery}"^${fields.length - i}`);
        });
    
        const solrQuery = queryParts.join(' OR ');

        const filterQuery = ((options?.ids?.length ?? 0) > 0) ? `id:(${options!.ids!.slice(0,50)!.join(' OR ')})&` : '';

        try {
            const url = new URL(this.getSelfUrl('select'));

            url.searchParams.append('fl', 'id, score');
            url.searchParams.append('indent', 'true');
            url.searchParams.append('q', solrQuery);
            url.searchParams.append('rows', String(options?.rows ?? 30));
            url.searchParams.append('start', '0');
            url.searchParams.append('wt', 'json');
            url.searchParams.append('fq', filterQuery);

            return axios.get(url.toString()).then(res => res.data.response.docs);
        }
        catch (e) {
            console.error(e);
            return Promise.resolve([]);
        }
    }
    
    /**
     * Performs a search in the Solr core and returns the matching documents from the attached database.
     * @param query Query to search for.
     * @param options Options for the search (e.g. number of results to return or whether to include text fields)
     * @returns Array of matching documents with their relevance scores.
     */
    async search(query: string, options?: { rows?: number, includeTextFields?: boolean }): Promise<any[]> {
        const idsWithScores = await this.searchIds(query, options);

        const entities = await (db as any)[this.collection].findMany({
            where: {
                id: {
                    in: idsWithScores.map(({ id }) => id)
                }
            },
            include: {
                names: true,
                faculties: {
                    include: {
                        names: true,
                    }
                },
                ...(options?.includeTextFields ? 
                    getTextFields(this.collection as any)?.reduce((p: Record<string, any>, x) => ({
                    ...p,
                    [x]: true
                }), {}) : {})
            }
        });

        return entities
            .map((entity: any) => ({
                ...entity,
                score: idsWithScores.find(({ id }) => entity.id === id)?.score ?? 0
            }))
            .sort((a: any, b: any) => b.score - a.score);
    }

    /**
     * Performs a suggest query in the Solr core and returns the suggestions.
     * @param query Query to search for.
     * @param options Options for the suggest query (e.g. number of results to return or the suggestion language)
     * @returns Array of suggestions.
     */
    async suggest(query: string, options?: { rows?: number, lang?: 'cs' | 'en' }): Promise<any[]> {
        const url = new URL(this.getSelfUrl('suggest'))
        url.searchParams.append('suggest.q', query);
        url.searchParams.append('suggest.count', String(options?.rows ?? 5));
        url.searchParams.append('suggest.dictionary', `${options?.lang ?? 'cs'}_suggester`);

        return axios.get(url.href).then(res => {
            return (Object.values(res.data.suggest)[0] as any)[query].suggestions;
        });
    }
}

/**
 * Solr is a wrapper around a Solr instance with a simple API for creating and accessing Solr cores.
 */
export class Solr {
    public url: string;
    public database: typeof db;
    constructor(url: string, database: typeof db) {
        this.url = url;
        this.database = database;
    }

    /**
     * @param collection The name of the Solr core.
     * @returns The `SolrCollection` with the given name.
     */
    getCollection(collection: string) {
        return new SolrCollection(this, collection);
    }
}