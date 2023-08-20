/* eslint-disable no-loop-func */
import sqlite3 from 'sqlite3';
import { Prisma, PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import cliProgress from 'cli-progress';
import colors from 'ansi-colors';

const inDB = new sqlite3.Database(`${__dirname}/../../charles-explorer.db`);
const outDB = new PrismaClient();

const tableNames = ['class', 'faculty', 'department', 'person', 'publication', 'programme'] as const;
type Tables = typeof tableNames[number];

type TransformedResult<T extends Tables> = Parameters<typeof outDB[T]['create']>[0]['data'];

interface Declaration<T extends Tables> {
    query: string;
    transform: (val: any) => TransformedResult<T>;
}

type Doubles = Partial<{[K in Tables]: Declaration<K>}>;

const transformers: Doubles = {
    faculty: {
        query: 'SELECT * FROM FACULTY',
        transform: (data: any) => {
            return {
                id: data.FACULTY_ID,
                names: {
                    create: [{
                        lang: 'eng',
                        value: data.FACULTY_NAME_EN,
                    },
                    {
                        lang: 'cze',
                        value: data.FACULTY_NAME_CS,
                    }]
                },
                abbreviations: {
                    create: [{
                        lang: 'cze',
                        value: data.ABBR
                    }],
                },
            }
        }
    },
    department: {
        query: `SELECT * FROM (
            SELECT DISTINCT DEPT_ID, FACULTY_ID, NULL as DEPT_NAME_CS, NULL as ABBR, NULL as POID FROM CLASS
            UNION ALL
            SELECT DEPT_ID, FACULTY_ID, DEPT_NAME_CS, ABBR, POID FROM DEPARTMENT
        ) GROUP BY DEPT_ID;`,
        transform: (data: any) => {
            return {
                id: data.DEPT_ID,
                faculties: {
                    connect: {
                        id: data.FACULTY_ID,
                    }
                },
                abbreviations: {
                    create: [{
                        lang: 'cze',
                        value: data.ABBR
                    }]
                },
                names: {
                    create: [{
                        lang: 'cze',
                        value: data.DEPT_NAME_CS,
                    }]
                }
            }
        }
    },
    person: {
        query: 'SELECT PERSON.*, CLASS.FACULTY_ID, CLASS.DEPT_ID FROM PERSON LEFT JOIN CLASS ON PERSON.PERSON_ID = CLASS.TEACHER_ID GROUP BY PERSON_ID',
        transform: (data: any) => {
            const hashedId = crypto.createHash('sha256').update(data.PERSON_ID).digest('hex');
            const id = parseInt(hashedId.slice(0, 10), 16).toString();

            return {
                id,
                private_id: data.PERSON_ID,
                names: {
                    create: [{
                        lang: 'eng',
                        value: data.PERSON_NAME,
                    }]
                },
                faculties: {
                    connect: {
                        id: data.FACULTY_ID,
                    }
                },
                departments: {
                    connect: {
                        id: data.DEPT_ID,
                    }
                }
            }
        }
    },
    class: {
        query: 'SELECT C.*, P.PERSON_ID FROM CLASS as C LEFT JOIN PERSON as P ON C.TEACHER_ID = PERSON_ID GROUP BY C.CLASS_ID',
        transform: (data: any) => {
            return {
                id: data.CLASS_ID,
                names: {
                    create: [{
                        lang: 'cze',
                        value: data.CLASS_NAME_CS,
                    },
                    {
                        lang: 'eng',
                        value: data.CLASS_NAME_EN,
                    }]
                },
                annotation: {
                    create: [
                    {
                        lang: 'cze',
                        value: data.ANNOTATION_CS,
                    },
                    {
                        lang: 'eng',
                        value: data.ANNOTATION_EN,
                    }]
                },
                syllabus: {
                    create: [{
                        lang: 'cze',
                        value: data.SYLABUS_CS,
                    },
                    {
                        lang: 'eng',
                        value: data.SYLABUS_EN,
                    }]
                },
                departments: {
                    connect: {
                        id: data.DEPT_ID,
                    }
                },
                faculties: {
                    connect: {
                        id: data.FACULTY_ID,
                    }
                },
                people: {
                    connect: {
                        private_id: data.PERSON_ID,
                    }
                }
            }
        }
    },
    programme: {
        query: `
SELECT 
    S.*, 
    PERSON.PERSON_ID, 
    (SELECT group_concat(ID, '/') from STUDY_PROGRAMME where s.STUDY_PROGRAMME_ID = STUDY_PROGRAMME_ID and id != s.id) AS RELATED_PROGRAMMES,
    (SELECT group_concat(STUDY_PROGRAMME_CLASS.CLASS_ID, '/') from STUDY_PROGRAMME_CLASS LEFT JOIN CLASS as c on c.CLASS_ID = STUDY_PROGRAMME_CLASS.CLASS_ID where s.ID = ID and c.CLASS_ID is not null) AS RELATED_CLASSES
FROM 
    STUDY_PROGRAMME as S 
        LEFT JOIN 
    PERSON 
        ON S.GARANT_ID = PERSON.PERSON_ID 
GROUP BY ID`,
        transform: (row) => {
            return {
                id: row.ID,
                names: {
                    create: [{
                        lang: 'cze',
                        value: row.NAME_CS,
                    },
                    {
                        lang: 'eng',
                        value: row.NAME_EN,
                    }]
                },
                people: {
                    connect: {
                        private_id: row.PERSON_ID,
                    }
                },
                form: row.P_FORM,
                type: row.P_TYPE,
                faculties: {
                    connect: {
                        id: row.FACULTY_ID,
                    }
                },
                programmes: {
                    connect: row.RELATED_PROGRAMMES?.split('/').map((x: any) => ({id: x})),
                },
                classes: {
                    connect: row.RELATED_CLASSES?.split('/').map((x: any) => ({id: x})),
                }
            }
        }
    },
    publication: {
        query: `
        SELECT P.*, 
    json_group_array(json_object(
            'lang',PUBLICATION_KEYWORDS.languague,
            'title', PUBLICATION_KEYWORDS.title,
            'abstract', PUBLICATION_KEYWORDS.abstract,
            'keywords', PUBLICATION_KEYWORDS.keywords)
    ) as LOCALIZED FROM
            (SELECT publication.PUBLICATION_ID, 
                    PUB_YEAR,
                    group_concat(DISTINCT DEPARTMENT.DEPT_ID) AS DEPT_ID,
                    group_concat(DISTINCT DEPARTMENT.FACULTY_ID) AS FACULTY_ID,
                    group_concat(DISTINCT PERSON.PERSON_ID) AS AUTHORS
                    from 
                    PUBLICATION
                            LEFT JOIN
                    DEPARTMENT
                    ON PUBLICATION.DEPT_POID = DEPARTMENT.POID
                            LEFT JOIN
                    PUBLICATION_AUTHOR
                    ON PUBLICATION.PUBLICATION_ID = PUBLICATION_AUTHOR.PUBLICATION_ID
                    	LEFT JOIN
                    PERSON
                    ON PUBLICATION_AUTHOR.PERSON_ID = PERSON.PERSON_ID
            GROUP by PUBLICATION.PUBLICATION_ID
            {{LIMIT}} {{OFFSET}}) AS P
            LEFT JOIN
        PUBLICATION_KEYWORDS
        ON PUBLICATION_KEYWORDS.PUBLICATION_ID = P.PUBLICATION_ID
    GROUP by P.PUBLICATION_ID`,
        transform: (row) => {
            const localized: Record<string, any>[] = JSON.parse(row.LOCALIZED).filter((x,i,a) => {
                return a.findIndex((y: any) => y.lang === x.lang) === i;
            });

            return {
                id: row.PUBLICATION_ID,
                year: row.PUB_YEAR,
                authors: '',
                departments: {
                    connect: row.DEPT_ID?.split(',').map((x: string) => ({ id: x.length > 0 ? x : null })),
                },
                faculties: {
                    connect: row.FACULTY_ID?.split(',').map((x: string) => ({ id: x.length > 0 ? x : null })),
                },
                people: {
                    connect: row.AUTHORS?.split(',').map((x: string) => ({ private_id: x.length > 0 ? x : null })),
                },
                names: {
                    create: localized.map((x: any) => ({
                        lang: x.lang,
                        value: x.title,
                    }))
                },
                abstract: {
                    create: localized.map((x: any) => ({
                        lang: x.lang,
                        value: x.abstract,
                    }))
                },
                keywords: {
                    create: localized.map((x: any) => ({
                        lang: x.lang,
                        value: x.keywords,
                    }))
                }
            }
        }
    },
};

function containsNullishLiterals(obj: any) {
    return Object.values(obj).some(x => !x);
}

export function getOnlyLiterals(obj: Record<string, string>, tableName: string) {
    const literalFields = getSchemaFields(tableName)
    ?.filter(x => x.kind === 'scalar')
    .map(x => x.name);

    if (!literalFields) {
        throw new Error(`Table ${tableName} not found`);
    }

    return Object.fromEntries(
        Object.entries(obj)
        .filter(([key]) => literalFields.includes(key))
    )
}

export function getSchemaFields(tableName: string) {
    return Prisma.dmmf.datamodel.models
    .find(x => x.name.toLowerCase() === tableName.toLowerCase())
    ?.fields
}

export function removeNullishLiterals(obj: ReturnType<Declaration<'class'>['transform']>) {
    for (const [key, value] of Object.entries(obj)) {
        if ( (value as any)?.create ) {
            (value as any).create = (value as any).create.filter((x: any) => !containsNullishLiterals(x));
        }

        if ((value as any)?.connect) {
            if (containsNullishLiterals((value as any).connect)) {
                delete obj[key as keyof typeof obj];
            }
        }
    }
    return obj;
}

// function stripConnectorsAndCreators(obj: any) {
//     return Object.fromEntries(Object.entries(obj).filter(([_, value]: [string, any]) => !value?.connect && !value?.create));
// }

// function stripConnectors(obj: any) {
//     return Object.fromEntries(Object.entries(obj).filter(([_, value]: [string, any]) => !value?.connect));
// }

function getConnectors(obj: any){
    return Object.fromEntries(Object.entries(obj).filter(([key, value]: [string, any]) => value?.connect || key === 'id'));
}

function getCreators(obj: any){
    return Object.fromEntries(Object.entries(obj).filter(([key, value]: [string, any]) => value?.create || key === 'id'));
}

async function addIdsToCreators(){
    let count = await outDB.text.count() + 1;
    return (obj: any) => {
        return Object.fromEntries(Object.entries(obj).map(([key, value]: [string, any]) => {
            if (value?.create) {
                value.create = value.create.map((x: any, i: number) => ({
                    ...x,
                    id: count + i,
                }));

                count += value.create.length;
            }

            return [key, value];
        }));
    }
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

const ordering = [
    // 'faculty', 
    // 'department', 
    // 'person',
    'class',
    'programme',
    'publication'
] as const;

const moons = [
    "🌑 ",
    "🌒 ",
    "🌓 ",
    "🌔 ",
    "🌕 ",
    "🌖 ",
    "🌗 ",
    "🌘 "
];

const batchSize = 1000;

console.log((colors.bgRed.bold.white(`
  ███╗                                                                                         
██╔═══██╗        __             __        ___  __              __   __   __  ___  ___  __      
██║   ██║       /  \` |__|  /\\  |__) |    |__  /__\`    |  |\\/| |__) /  \\ |__)  |  |__  |__)     
╚██████╔╝       \\__, |  | /~~\\ |  \\ |___ |___ .__/    |  |  | |    \\__/ |  \\  |  |___ |  \\     
 ╚═════╝                                                                                       
`)));

const totals: Partial<Record<keyof typeof transformers, number>> = {};

const getQuery = (query: string, limit?: number, offset?: number) => {
    if(!limit && !offset) return query.replace('{{LIMIT}}', '').replace('{{OFFSET}}', '');

    if(!query.includes('LIMIT') && !query.includes('OFFSET')) {
        query += ` LIMIT ${limit} OFFSET ${offset}`;
    }
    if(query.includes('{{LIMIT}}'))
        {
            query = query.replace('{{LIMIT}}', `LIMIT ${limit}`);
        }
    if(query.includes('{{OFFSET}}'))
        {
            query = query.replace('{{OFFSET}}', `OFFSET ${offset}`);
        }

    return query;
}

(async () => {
    await new Promise(r => inDB.exec(`CREATE INDEX IF NOT EXISTS "STUDY_PROGRAMME_ID" ON "STUDY_PROGRAMME" ("STUDY_PROGRAMME_ID");
    CREATE INDEX IF NOT EXISTS "STUDY_PROGRAMME_CLASS_ID" ON "STUDY_PROGRAMME_CLASS" ("ID");
    CREATE INDEX IF NOT EXISTS "PUBLICATION_AUTHOR_PUB_ID" ON "PUBLICATION_AUTHOR" ("PUBLICATION_ID");
    CREATE INDEX IF NOT EXISTS "PUBLICATION_ID" ON "PUBLICATION" ("PUBLICATION_ID");
    CREATE INDEX IF NOT EXISTS "PUBLICATION_KEYWORDS_PUB_ID" ON PUBLICATION_KEYWORDS("PUBLICATION_ID");
    CREATE INDEX IF NOT EXISTS "CLASS_ID" ON "CLASS" ("CLASS_ID");
    CREATE INDEX IF NOT EXISTS "TEACHER_ID" ON "CLASS" ("TEACHER_ID");
    CREATE INDEX IF NOT EXISTS "PERSON_ID" ON "PERSON" ("PERSON_ID");
    `, r));

    for (let i = 0; i < ordering.length; i++) {
        const table = ordering[i];
        const transformer = transformers[table];

        const singleBar = new cliProgress.SingleBar({
            clearOnComplete: false,
            format: `${i % 2 === 0 ? colors.redBright('{bar}') : colors.white('{bar}')} | {percentage}% | {value}/{total} | ETA: {eta_formatted} | Elapsed time: {duration_formatted} | {spinner} Inserting {tableName}`,
        }, cliProgress.Presets.shades_classic);
        
        totals[table] = await new Promise((resolve) => {
            inDB.all(`SELECT COUNT(*) FROM (${getQuery(transformer?.query as string).replace(';', '')});`, (err: any, rows: any[]) => {
                if (err) {
                    throw err;
                }

                // singleBar.start(rows[0]['COUNT(*)'], 0, { spinner: '😴', tableName: table.toUpperCase() });
                resolve(rows[0]['COUNT(*)']);
            });
        });

        let done = false;
        let offset = 0;

        // const total = totals[table];

        // while (!done) {
        //     await new Promise<void>((resolve) => {
        //         inDB.all(getQuery(transformer?.query as string, batchSize, offset), (err, rows: ReturnType<Declaration<'class'>['transform']>[]) => {
        //             (async () => {
        //                 const transformedRows: any[] = rows.map(transformer!.transform as any);

        //                 const existingIds = (await (outDB[table] as any)
        //                     .findMany({ 
        //                         where: { 
        //                             id: { 
        //                                 in: transformedRows.map(x => x.id) 
        //                             } 
        //                         }, 
        //                         select: { 
        //                             id: true 
        //                         } 
        //                     })).map((x: any) => x.id);

        //                 const data = transformedRows
        //                     .map((x) => getOnlyLiterals(x, table))
        //                     .filter(x => !existingIds.includes(x.id));

        //                 // Insert base rows here
        //                 await (outDB[table] as any).createMany({ data, skipDuplicates: true });

        //                 const creators = transformedRows
        //                     .map(getCreators)
        //                     .filter(x => !existingIds.includes(x.id))
        //                     .map(x => removeNullishLiterals(x as any))
        //                     .map(await addIdsToCreators())
                            
        //                 //collect all the create objects

        //                 await (outDB.text).createMany({ 
        //                     data: creators
        //                         .flatMap(x => Object.entries(x)
        //                             .filter(([_,v]) => v.create)
        //                             .flatMap(x => x[1].create)
        //                         ), 
        //                     skipDuplicates: true 
        //                 });

        //                 const newTableRecords: Record<string, any[]> = {};

        //                 for (const creator of creators) {
        //                     for (const [key, value] of Object.entries(creator)){
        //                         if (key === 'id') continue;
    
        //                         const tableName = `_${capitalize(table)}${capitalize(key)}`;
        //                         const joinableIds = value.create?.map((x: any) => x.id);
    
        //                         if (joinableIds.length > 0) {
        //                             newTableRecords[tableName] ??= []; 
        //                             newTableRecords[tableName] = [
        //                                 ...newTableRecords[tableName],
        //                                 ...joinableIds.map((id: any) => ({
        //                                     A: creator.id,
        //                                     B: id
        //                                 }))
        //                             ];
        //                         }
        //                     }
        //                 }

        //                 for (const [key, value] of Object.entries(newTableRecords)) {
        //                     try {
        //                         await outDB.$executeRawUnsafe(`INSERT INTO "${key}" ("A", "B") VALUES ${value.map(x => `('${x.A}', '${x.B}')`).join(', ')}`);
        //                     } catch (e) {
        //                         console.log();
        //                         console.log(`INSERT INTO "${key}" ("A", "B") VALUES ${value.map(x => `('${x.A}', '${x.B}')`).join(', ')}`);
        //                         console.log();
        //                         throw e;
        //                     }
        //                 }

        //                 // throw new Error('Not implemented');
                        
        //                 offset += batchSize;
        //                 singleBar.update(offset > total! ? total! : offset, { spinner: moons[Math.floor(offset / batchSize) % moons.length], tableName: table.toUpperCase() });
    
        //                 if (offset > total!) {
        //                     done = true;
        //                     singleBar.stop();
        //                 }

        //                 resolve();
        //             })();
        //         });   
        //     });
        // }

        // await new Promise<void>(async (r) => {
        //     const polling = async () => {
        //         const count = await (outDB[table] as any).count(); 

        //         if (count !== total) {
        //             console.error(`Table ${table.toUpperCase()} is not consistent! Expected ${total}, got ${count}. Waiting for consistency...`);
        //         } else {
        //             clearInterval(interval);
        //             r();
        //         }
        //     }
        //     const interval = setInterval(polling, 5e3);
        //     polling();
        // });
    }

    console.log(`

✅ ${colors.greenBright('Importing data complete!')}
${colors.white('Running data joining task')}

    `);

    const fields: any = {};

    for (const table of ordering) {
        fields[table] = Object.fromEntries(Prisma.dmmf.datamodel.models.find(x => x.name === capitalize(table)).fields.map(x => [x.name, x]));
    }

    const peoplePrivToPubl = Object.fromEntries((await outDB.person.findMany({select: {id: true, private_id: true}})).map(x => [x.private_id, x.id]));

    for (let i = 0; i < ordering.length; i++) {
        const table = ordering[i];
        const transformer = transformers[table];

        const singleBar = new cliProgress.SingleBar({
            clearOnComplete: false,
            format: `${i % 2 === 0 ? colors.redBright('{bar}') : colors.white('{bar}')} | {percentage}% | {value}/{total} | ETA: {eta_formatted} | Elapsed time: {duration_formatted} | {spinner} Connecting {tableName}`,
        }, cliProgress.Presets.shades_classic);

        const total = totals[table];
        let done = false;
        let offset = 0;

        singleBar.start(total!, 0, { spinner: '😴', tableName: table.toUpperCase() });

        while (!done) {
            await new Promise<void>((resolve) => {
                inDB.all(getQuery(transformer?.query as string, batchSize, offset), (err, rows) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    const transformedRows = rows.map(transformer!.transform).map(removeNullishLiterals).map(getConnectors);
                    const newTableRecords: Record<string, any[]> = {};
                    
                    (async () => {

                        for(const row of transformedRows) {
                            for (const [key,value] of Object.entries(row)) {
                                if (key === 'id') continue;
                                
                                const tableName = `_${fields[table][key].relationName}`;
    
                                if (value.connect) {
                                    const connectors = Array.isArray(value.connect) ? value.connect : [value.connect];
    
                                    newTableRecords[tableName] ??= [];
    
                                    newTableRecords[tableName].push(...connectors.map((connector: any) => {                               
                                        return {
                                            A: key.localeCompare(table) > 0 ? row.id : connector.private_id ? peoplePrivToPubl[connector.private_id] : connector.id,
                                            B: key.localeCompare(table) > 0 ? connector.private_id ? peoplePrivToPubl[connector.private_id] : connector.id : row.id
                                        };
                                    }));
                                }
                            }
                        }  

                        for (const [key, value] of Object.entries(newTableRecords)) {
                            try {
                                await outDB.$executeRawUnsafe(`INSERT INTO "${key}" ("A", "B") VALUES ${value.map(x => `('${x.A}', '${x.B}')`).join(', ')} ON CONFLICT DO NOTHING`);
                            } catch (e) {
                                console.log();
                                console.log(`INSERT INTO "${key}" ("A", "B") VALUES ${value.map(x => `('${x.A}', '${x.B}')`).join(', ')}`);
                                console.log();
                                throw e;
                            }
                        }

                        offset += batchSize;
                        singleBar.update(offset > total! ? total! : offset, { spinner: moons[Math.floor(offset / batchSize) % moons.length], tableName: table.toUpperCase() });

                        if (offset > total!) {
                            done = true;
                            singleBar.stop();
                        }

                        const interval = setInterval(async () => {
                            const metrics = await (outDB as any).$metrics.json();
                            if(metrics.gauges.find((x: any) => x.key === 'prisma_pool_connections_busy').value > 5) {
                                singleBar.update({ spinner: '⌚️', tableName: `${table.toUpperCase()} (${metrics.gauges.find((x: any) => x.key === 'prisma_pool_connections_busy').value} busy connections)` } );
                            } else {
                                clearInterval(interval);
                                resolve();
                            }
                        }, 1e3);
                    })();
    
                });   
            });
        }
    }

    inDB.close();
})();
