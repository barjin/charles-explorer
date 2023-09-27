import type { AsyncDatabase } from "promised-sqlite3";

import { db, getJoinableEntities, getTextFields, utils } from "@charles-explorer/prisma";
import type { Transformers } from "./types/types";

import { getQuerySize } from "./sqlite/getQuerySize";
import { getQuery } from "./sqlite/templateQuery";
import { getOnlyLiterals, removeNullishLiterals, addIdsToTextCreators, getCreators, getConnectors } from "./utils/transformObject";

import { spinner } from "./utils/spinner";
import colors from "ansi-colors";
import cliProgress from "cli-progress";
import { Solr } from "@charles-explorer/solr-client";

const { capitalize, waitUntilDbIdle, getTableSchema } = utils;

let x = 0;

/**
 * Migrate a table from a sqlite database to a prisma database
 * @param inDB Instance of the sqlite database
 * @param outDB Instance of the prisma client
 * @param tableName Name of the table to migrate
 * @param transformer Transformer object - contains an SQL query and a transform function that maps rows (results of the query) to prisma objects
 * @param options Options object
 * @param options.batchSize Batch size for the query
 */
export async function migrateSqliteToPrisma(inDB: AsyncDatabase, outDB: typeof db, tableName: string, transformer: Transformers['class'], options?: { batchSize?: number }) {
    const batchSize = options?.batchSize ?? 1000;

    const singleBar = new cliProgress.SingleBar({
        clearOnComplete: false,
        format: `${x % 2 === 0 ? colors.redBright('{bar}') : colors.white('{bar}')} | {percentage}% | {value}/{total} | ETA: {eta_formatted} | Elapsed time: {duration_formatted} | {spinner} Inserting {tableName}`,
    }, cliProgress.Presets.shades_classic);

    x++;
    
    const totalCount = await getQuerySize(inDB, getQuery(transformer.query)) as number;
    
    singleBar.start(totalCount, 0, { spinner: spinner.next().value, tableName: capitalize(tableName) });

    for (let offset = 0; offset < totalCount; offset += batchSize) {
        const rows = await inDB.all(getQuery(transformer?.query as string, batchSize, offset));
        const transformedRows: any[] = rows.map(transformer.transform);

        const existingIds = (await (outDB[tableName] as any)
            .findMany({ 
                where: { 
                    id: { 
                        in: transformedRows.map(x => x.id) 
                    } 
                }, 
                select: { 
                    id: true 
                } 
            })).map((x: any) => x.id);

            const data = transformedRows
                .map((x) => getOnlyLiterals(x, tableName));

            // Insert base rows here
            await (outDB[tableName] as any).createMany({ data, skipDuplicates: true });

            const creators = transformedRows
                .map(getCreators)
                .filter(x => !existingIds.includes(x.id))
                .map(x => removeNullishLiterals(x as any))
                .map(await addIdsToTextCreators(outDB))
                        
            // Collect all the create objects
            await (outDB.text).createMany({ 
                data: creators
                    .flatMap(x => Object.entries(x)
                        .filter(([,v]) => v.create)
                        .flatMap(x => x[1].create)
                    ), 
                skipDuplicates: true 
            });

            const newTableRecords: Record<string, any[]> = {};

            for (const creator of creators) {
                for (const [key, value] of Object.entries(creator)){
                    if (key === 'id') continue;

                    const relationTableName = `_${capitalize(tableName)}${capitalize(key)}`;
                    const joinableIds = value.create?.map((x: any) => x.id);

                    if (joinableIds.length > 0) {
                        newTableRecords[relationTableName] ??= []; 
                        newTableRecords[relationTableName] = [
                            ...newTableRecords[relationTableName],
                            ...joinableIds.map((id: any) => ({
                                A: creator.id,
                                B: id
                            }))
                        ];
                    }
                }
            }

            for (const [key, value] of Object.entries(newTableRecords)) {
                try {
                    await outDB.$executeRawUnsafe(`INSERT INTO "${key}" ("A", "B") VALUES ${value.map(x => `('${x.A}', '${x.B}')`).join(', ')}`);
                } catch (e) {
                    console.log();
                    console.log(`INSERT INTO "${key}" ("A", "B") VALUES ${value.map(x => `('${x.A}', '${x.B}')`).join(', ')}`);
                    console.log();
                    throw e;
                }
            }

            singleBar.update(offset > totalCount ? totalCount : offset, { spinner: spinner.next().value, tableName: tableName.toUpperCase() });
    }

    await new Promise<void>((r) => {
        const polling = async () => {
            const count = await (outDB[tableName] as any).count(); 

            if (count !== totalCount) {
                console.error(`Table ${tableName.toUpperCase()} is not consistent! Expected ${totalCount}, got ${count}. Waiting for consistency...`);
            } else {
                clearInterval(interval);
                r();
            }
        }
        const interval = setInterval(polling, 5e3);
        polling();
    });

    singleBar.update(totalCount, { spinner: spinner.next().value, tableName: tableName.toUpperCase() });

    singleBar.stop();
}

/**
 * Infers people's connections to faculties and departments from their programmes and classes.
 * @param prisma Instance of the Prisma client
 */
export async function fixPeopleFaculties(prisma: typeof db) {
    const singleBar = new cliProgress.SingleBar({
        clearOnComplete: false,
        format: `${x % 2 === 0 ? colors.redBright('{bar}') : colors.white('{bar}')} | {percentage}% | {value}/{total} | ETA: {eta_formatted} | Elapsed time: {duration_formatted} | {spinner} Inserting {tableName}`,
    }, cliProgress.Presets.shades_classic);

    console.log('Infering people\'s connections to faculties and departments from their programmes and classes...');

    const c = await prisma['person'].findMany({
        where: {
            OR: [
                {
                    faculties: {
                        none: {}
                    },
                },
                // {
                //     departments: {
                //         none: {}
                //     }
                // }
            ]
        },
        select: {
            id: true,
        }
    });

    singleBar.start(c.length, 0, { spinner: spinner.next().value, tableName: 'people\'s faculties...' });

    let i = 0;
    for (const { id } of c) {
        if ( ++i % 100 === 0) {
            singleBar.update(i, { spinner: spinner.next().value, tableName: 'people\'s faculties...' });
        }
        const person = await prisma['person'].findUnique({
            where: {
                id
            },
            include: {
                names: true,
                programmes: {
                    include: {
                        faculties: true,
                    }
                },
                classes: {
                    include: {
                        faculties: true,
                    }
                },
                publications: {
                    include: {
                        faculties: true,
                    }
                },
            }
        });

        if(person) {
            const faculties = {};

            for (const programme of person.programmes) {
                for (const faculty of programme.faculties) {
                    faculties[faculty.id] ??= 0;
                    faculties[faculty.id]++;
                }
            }
    
            for (const c of person.classes) {
                for (const faculty of c.faculties) {
                    faculties[faculty.id] ??= 0;
                    faculties[faculty.id]++;
                }
            }

            for (const p of person.publications) {
                for (const faculty of p.faculties) {
                    faculties[faculty.id] ??= 0;
                    faculties[faculty.id]++;
                }
            }
    
            const facultyIds = Object.entries(faculties).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0,1).map(x => x[0]);
    
            await prisma['person'].update({
                where: {
                    id
                },
                data: {
                    faculties: {
                        connect: facultyIds.map(id => ({ id }))
                    }
                }
            });
        }
    }

    singleBar.update(c.length, { spinner: spinner.next().value, tableName: 'people\'s faculties...' });
    singleBar.stop();
}

/**
 * Returns a function that maps private IDs to public IDs. This can be useful when the user is matching data using the private IDs.
 * @param prisma Instance of the Prisma client
 * @returns A function that maps private IDs to public IDs.
 */
async function getPeoplePrivToPubl(prisma: typeof db) {
    const people = await prisma['person'].findMany({
        select: {
            id: true,
            private_id: true
        }
    });
    const mapping = Object.fromEntries(people.map(x => [x.private_id, x.id]));

    return (id: string) => mapping[id];
}

/**
 * Runs the data joining task. This task connects the data in the Prisma database by inserting records into the join tables.
 * @param inDB SQLite database instance
 * @param outDB Prisma client instance
 * @param tableName Current table name
 * @param transformer Transformer object - contains an SQL query and a transform function that maps rows (results of the query) to prisma objects
 * @param options Options object
 */
export async function connectPrismaEntities(inDB: AsyncDatabase, outDB: typeof db, tableName: string, transformer: Transformers['class'], options?: { batchSize?: number }) {
    const batchSize = options?.batchSize ?? 1000;
    const schema = getTableSchema(tableName);
    const peoplePrivToPubl = await getPeoplePrivToPubl(db);

    const singleBar = new cliProgress.SingleBar({
        clearOnComplete: false,
        format: `${x % 2 === 0 ? colors.redBright('{bar}') : colors.white('{bar}')} | {percentage}% | {value}/{total} | ETA: {eta_formatted} | Elapsed time: {duration_formatted} | {spinner} Connecting {tableName}`,
    }, cliProgress.Presets.shades_classic);

    x++;

    const total = await getQuerySize(inDB, getQuery(transformer.query));
    singleBar.start(total, 0, { spinner: '😴', tableName: tableName.toUpperCase() });

    for (let offset = 0; offset < total; offset += batchSize) {
        singleBar.update(offset > total ? total : offset, { spinner: spinner.next().value, tableName: tableName.toUpperCase() });

        const rows = await inDB.all(getQuery(transformer.query as string, batchSize, offset));

        const transformedRows: any[] = 
            rows.map(transformer.transform)
                .map(removeNullishLiterals)
                .map(getConnectors) as any[];
        
        const newTableRecords: Record<string, any[]> = {};
                
        for(const row of transformedRows) {
            for (const [key, value] of Object.entries(row) as [any, any][]) {
                if (key === 'id') continue;
                
                const relationTableName = `_${schema[key].relationName}`;

                if (value.connect) {
                    const connectors = Array.isArray(value.connect) ? value.connect : [value.connect];

                    newTableRecords[relationTableName] ??= [];

                    newTableRecords[relationTableName].push(...connectors.map((connector: any) => {                               
                        return {
                            A: key.localeCompare(tableName) > 0 ? row.id : connector.private_id ? peoplePrivToPubl(connector.private_id) : connector.id,
                            B: key.localeCompare(tableName) > 0 ? connector.private_id ? peoplePrivToPubl(connector.private_id) : connector.id : row.id
                        };
                    }));
                }
            }
        }  

        for (const [tableName, rows] of Object.entries(newTableRecords)) {
            try {
                await outDB.$executeRawUnsafe(`INSERT INTO "${tableName}" ("A", "B") VALUES ${rows.map(x => `('${x.A}', '${x.B}')`).join(', ')} ON CONFLICT DO NOTHING`);
            } catch (e) {
                console.log();
                console.log(`INSERT INTO "${tableName}" ("A", "B") VALUES ${rows.map(x => `('${x.A}', '${x.B}')`).join(', ')}`);
                console.log();
                throw e;
            }
        }

        singleBar.update(offset > total ? total : offset, { spinner: '⌚️', tableName: `${tableName.toUpperCase()}, waiting for idle DB state` });
        await waitUntilDbIdle();
    }

    singleBar.update(total, { spinner: spinner.next().value, tableName: tableName.toUpperCase() });
    singleBar.stop();
}

/**
 * Inserts data from a Prisma relation into a Solr core
 * @param coreName Name of the Solr core to insert the data into
 * @param inDB Instance of the Prisma client
 * @param transformer Transformer function that maps Prisma objects to Solr objects
 * @param options Options object
 */
export async function insertToSolr(coreName: string, inDB: typeof db, transformer: (a: any) => any, options?: { batchSize?: number, loadConnected?: boolean }){
    const solr = new Solr(process.env.SOLR_URL ?? 'http://localhost:8983', inDB);

    const { batchSize = 5000 } = options ?? {};

    const singleBar = new cliProgress.SingleBar({
        clearOnComplete: false,
        format: `${colors.redBright('{bar}')} | {percentage}% | {value}/{total} | ETA: {eta_formatted} | Elapsed time: {duration_formatted} | {spinner} [Solr] Indexing {tableName}`,
    }, cliProgress.Presets.shades_classic);

    const total = await (inDB[coreName] as any).count() as number;
    singleBar.start(total, 0, { spinner: spinner.next().value, tableName: capitalize(coreName) });
    
    await solr.getCollection(coreName).createIfNotExists();
    let cursor: string | undefined = undefined;
    let hasMore = true;

    let soFar = 0;

    while (hasMore) {
        const t = {
            include: {
                ...getTextFields(coreName as any)?.reduce((p: Record<string, any>, x) => ({
                    ...p,
                    [x]: true
                }), {}),
                ...(options?.loadConnected ? 
                    getJoinableEntities(coreName as any)?.reduce((p: Record<string, any>, x) => ({
                        ...p,
                        [x.name]: {
                            include: getTextFields(x.type as any)?.reduce((p: Record<string, any>, x) => ({
                                ...p,
                                [x]: true
                            }), {})
                        }
                    }), {})
                : {})
            },
            take: batchSize,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
        };

        const records: any[] = await (inDB[coreName] as any).findMany(t);

        soFar += records.length;

        singleBar.update((soFar > total) ? total : soFar, { spinner: spinner.next().value, tableName: capitalize(coreName) });

        await solr.getCollection(coreName).addDocuments(records.map(transformer));

        if (records.length < batchSize) {
            hasMore = false;
        } else {
            cursor = records[records.length - 1].id;
        }
    }

    singleBar.update(total, { spinner: spinner.next().value, tableName: capitalize(coreName) + ' (commiting changes).' });
    await solr.getCollection(coreName).finish();

    singleBar.stop();
}