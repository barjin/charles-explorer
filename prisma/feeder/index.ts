/* eslint-disable no-loop-func */
import sqlite3 from 'sqlite3';
import { PrismaClient } from '@prisma/client';
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
                        lang: 'en',
                        value: data.FACULTY_NAME_EN,
                    },
                    {
                        lang: 'cs',
                        value: data.FACULTY_NAME_CS,
                    }]
                },
                abbreviations: {
                    create: [{
                        lang: 'cs',
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
                        lang: 'cs',
                        value: data.ABBR
                    }]
                },
                names: {
                    create: [{
                        lang: 'cs',
                        value: data.DEPT_NAME_CS,
                    }]
                }
            }
        }
    },
    person: {
        query: 'SELECT PERSON.*, CLASS.FACULTY_ID, CLASS.DEPT_ID FROM PERSON LEFT JOIN CLASS ON PERSON.PERSON_ID = CLASS.TEACHER_ID GROUP BY PERSON_ID;',
        transform: (data: any) => {
            const hashedId = crypto.createHash('sha256').update(data.PERSON_ID).digest('hex');
            const id = parseInt(hashedId.slice(0, 10), 16).toString();

            return {
                id,
                private_id: data.PERSON_ID,
                names: {
                    create: [{
                        lang: 'en',
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
                        lang: 'cs',
                        value: data.CLASS_NAME_CS,
                    },
                    {
                        lang: 'en',
                        value: data.CLASS_NAME_EN,
                    }]
                },
                annotation: {
                    create: [
                    {
                        lang: 'cs',
                        value: data.ANNOTATION_CS,
                    },
                    {
                        lang: 'en',
                        value: data.ANNOTATION_EN,
                    }]
                },
                syllabus: {
                    create: [{
                        lang: 'cs',
                        value: data.SYLABUS_CS,
                    },
                    {
                        lang: 'en',
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
                        lang: 'cs',
                        value: row.NAME_CS,
                    },
                    {
                        lang: 'en',
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
    }
};

function containsNullishLiterals(obj: any) {
    return Object.values(obj).some(x => !x);
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

function stripConnectors(obj: any) {
    return Object.fromEntries(Object.entries(obj).filter(([_, value]: [string, any]) => !value?.connect));
}

function getConnectors(obj: any){
    return Object.fromEntries(Object.entries(obj).filter(([key, value]: [string, any]) => value?.connect || key === 'id'));
}

const ordering = [
    'faculty', 
    'department', 
    'person',
    // 'class',
    // 'programme'
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

const batchSize = 500;

console.log((colors.bgRed.bold.white(`
  ███╗                                                                                         
██╔═══██╗        __             __        ___  __              __   __   __  ___  ___  __      
██║   ██║       /  \` |__|  /\\  |__) |    |__  /__\`    |  |\\/| |__) /  \\ |__)  |  |__  |__)     
╚██████╔╝       \\__, |  | /~~\\ |  \\ |___ |___ .__/    |  |  | |    \\__/ |  \\  |  |___ |  \\     
 ╚═════╝                                                                                       
`)));

const totals: Partial<Record<keyof typeof transformers, number>> = {};

(async () => {
    await new Promise(r => inDB.exec(`CREATE INDEX IF NOT EXISTS "STUDY_PROGRAMME_ID" ON "STUDY_PROGRAMME" ("STUDY_PROGRAMME_ID");
    CREATE INDEX IF NOT EXISTS "STUDY_PROGRAMME_CLASS_ID" ON "STUDY_PROGRAMME_CLASS" ("ID");
    CREATE INDEX IF NOT EXISTS "CLASS_ID" ON "CLASS" ("CLASS_ID");`, r));

    for (let i = 0; i < ordering.length; i++) {
        const table = ordering[i];
        const transformer = transformers[table];

        const singleBar = new cliProgress.SingleBar({
            clearOnComplete: false,
            format: `${i % 2 === 0 ? colors.redBright('{bar}') : colors.white('{bar}')} | {percentage}% | {value}/{total} | ETA: {eta_formatted} | Elapsed time: {duration_formatted} | {spinner} Inserting {tableName}`,
        }, cliProgress.Presets.shades_classic);
        
        totals[table] = await new Promise((resolve) => {
            inDB.all(`SELECT COUNT(*) FROM (${transformer!.query.replace(';', '')});`, (err: any, rows: any[]) => {
                if (err) {
                    throw err;
                }

                singleBar.start(rows[0]['COUNT(*)'], 0, { spinner: '😴', tableName: table.toUpperCase() });
                resolve(rows[0]['COUNT(*)']);
            });
        });

        let done = false;
        let offset = 0;

        const total = totals[table];

        while (!done) {
            await new Promise<void>((resolve) => {
                const getQuery = () => `${transformer!.query.replaceAll(';', '')} LIMIT ${batchSize} OFFSET ${offset};`;            
                inDB.all(getQuery(), (err, rows) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    const transformed = rows.map(transformer!.transform).map(removeNullishLiterals).map(stripConnectors);
    
                    (async () => {
                        for( const row of transformed ) {
                            try {
                                await (outDB[table] as any).create({ data: row });
                            } catch (e: any) {
                                // we don't want to throw on duplicate key errors (idempotency)
                                if(e.code !== 'P2002') {
                                    console.error(row);
                                    throw e;
                                }
                            }
                        }
                    })();
    
                    offset += batchSize;
                    singleBar.update(offset > total! ? total! : offset, { spinner: moons[Math.floor(offset / batchSize) % moons.length], tableName: table.toUpperCase() });

                    if (offset > total!) {
                        done = true;
                        singleBar.stop();
                    }
                });   

                const interval = setInterval(async () => {
                    const metrics = await (outDB as any).$metrics.json();
                    if(metrics.gauges.find((x: any) => x.key === 'prisma_pool_connections_busy').value > 5) {
                        singleBar.update({ spinner: '⌚️', tableName: `${table.toUpperCase()} (${metrics.gauges.find((x: any) => x.key === 'prisma_pool_connections_busy').value} busy connections)` } );
                    } else {
                        clearInterval(interval);
                        resolve();
                    }
                }, 1e3);
            });
        }
    }

    console.log(`

✅ ${colors.greenBright('Importing data complete!')}
${colors.white('Running data joining task')}

    `)

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
                const getQuery = () => `${transformer!.query.replaceAll(';', '')} LIMIT ${batchSize} OFFSET ${offset};`;            
                inDB.all(getQuery(), (err, rows) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    const transformed = rows.map(transformer!.transform).map(removeNullishLiterals).map(getConnectors);
    
                    (async () => {
                        for( const row of transformed ) {
                            try {
                                await (outDB[table] as any).update({where: { id: row.id }, data: row });
                            } catch (e: any) {
                                // we don't want to throw on duplicate key errors (idempotency)
                                if(e.code !== 'P2002') {
                                    console.error(row);
                                    throw e;
                                }
                            }
                        }
                    })();
    
                    offset += batchSize;
                    singleBar.update(offset > total! ? total! : offset, { spinner: moons[Math.floor(offset / batchSize) % moons.length], tableName: table.toUpperCase() });

                    if (offset > total!) {
                        done = true;
                        singleBar.stop();
                    }
                });   

                const interval = setInterval(async () => {
                    const metrics = await (outDB as any).$metrics.json();
                    if(metrics.gauges.find((x: any) => x.key === 'prisma_pool_connections_busy').value > 5) {
                        singleBar.update({ spinner: '⌚️', tableName: `${table.toUpperCase()} (${metrics.gauges.find((x: any) => x.key === 'prisma_pool_connections_busy').value} busy connections)` } );
                    } else {
                        clearInterval(interval);
                        resolve();
                    }
                }, 1e3);
            });
        }
    }

    inDB.close();
})();
