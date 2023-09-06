/* eslint-disable no-loop-func */
import { AsyncDatabase } from 'promised-sqlite3';
import { PrismaClient, Prisma } from '@prisma/client';
import cliProgress, { SingleBar } from 'cli-progress';
import colors from 'ansi-colors';
import { getQuerySize } from './sqlite/getQuerySize';
import { getQuery } from './sqlite/templateQuery';
import { transformers, indexCreation } from './transformers';
import { spinner } from './utils/spinner';
import { capitalize } from './utils/lang';
import { waitUntilDbIdle } from './prisma/waitForConsistency';
import { 
    removeNullishLiterals, 
    getConnectors, 
    addIdsToTextCreators, 
    getCreators, 
    getOnlyLiterals, 
    getSchemaFields 
} from './utils/transformObject';
import { Solr, getTextFields } from './solr/solr';

export const entities = ['person', 'publication', 'programme', 'class'] as const;
export const getJoinableEntities = (entity: string) => {
    return Prisma.dmmf.datamodel
        .models
        .find(x => x.name === capitalize(entity))
        ?.fields
        .filter(x => entities.includes(x.type.toLowerCase() as any))
        .map(x => ({ name: x.name, type: x.type }));
  };

const ordering = [
    'faculty', 
    'department', 
    'person',
    'class',
    'programme',
    'publication'
] as const;

const batchSize = 5000;

console.log((colors.bgRed.bold.white(`
  ███╗                                                                                         
██╔═══██╗        __             __        ___  __              __   __   __  ___  ___  __      
██║   ██║       /  \` |__|  /\\  |__) |    |__  /__\`    |  |\\/| |__) /  \\ |__)  |  |__  |__)     
╚██████╔╝       \\__, |  | /~~\\ |  \\ |___ |___ .__/    |  |  | |    \\__/ |  \\  |  |___ |  \\     
 ╚═════╝                                                                                       
`)));

const totals: Partial<Record<keyof typeof transformers, number>> = {};
const outDB = new PrismaClient();
const solr = new Solr('http://localhost:8983', outDB);

async function insertToSolr(coreName: string, transformer: (a: any) => any, options?: { batchSize?: number, loadConnected?: boolean }){
    const { batchSize = 1000 } = options ?? {};

    const singleBar = new cliProgress.SingleBar({
        clearOnComplete: false,
        format: `${colors.redBright('{bar}')} | {percentage}% | {value}/{total} | ETA: {eta_formatted} | Elapsed time: {duration_formatted} | {spinner} [Solr] Indexing {tableName}`,
    }, cliProgress.Presets.shades_classic);

    const total = await (outDB[coreName] as any).count();

    // singleBar.start(total, 0, { spinner: spinner.next().value, tableName: capitalize(coreName) });
    
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

        const records: any[] = await (outDB[coreName] as any).findMany(t);

        soFar += records.length;

        singleBar.update(soFar > total! ? total! : soFar, { spinner: spinner.next().value, tableName: capitalize(coreName) });

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

(async () => {
//     const inDB = await AsyncDatabase.open(`${__dirname}/../../charles-explorer.db`);

//     await inDB.exec(indexCreation);

//     // Creation task - create all the tables without joining the data
//     for (const table of ordering) {
//         const transformer = transformers[table];

//         const singleBar = new cliProgress.SingleBar({
//             clearOnComplete: false,
//             format: `${ordering.findIndex((x) => x === table) % 2 === 0 ? colors.redBright('{bar}') : colors.white('{bar}')} | {percentage}% | {value}/{total} | ETA: {eta_formatted} | Elapsed time: {duration_formatted} | {spinner} Inserting {tableName}`,
//         }, cliProgress.Presets.shades_classic);
        
//         totals[table] = await getQuerySize(inDB, getQuery(transformer?.query as string));
//         const total = totals[table]!;
        
//         singleBar.start(total, 0, { spinner: spinner.next().value, tableName: capitalize(table) });

//         for (let offset = 0; offset < total; offset += batchSize) {
//             const rows = await inDB.all(getQuery(transformer?.query as string, batchSize, offset));
//             const transformedRows: any[] = rows.map(transformer!.transform as any);

//             const existingIds = (await (outDB[table] as any)
//                 .findMany({ 
//                     where: { 
//                         id: { 
//                             in: transformedRows.map(x => x.id) 
//                         } 
//                     }, 
//                     select: { 
//                         id: true 
//                     } 
//                 })).map((x: any) => x.id);

//                 const data = transformedRows
//                     .map((x) => getOnlyLiterals(x, table));

//                 // Insert base rows here
//                 await (outDB[table] as any).createMany({ data, skipDuplicates: true });

//                 const creators = transformedRows
//                     .map(getCreators)
//                     .filter(x => !existingIds.includes(x.id))
//                     .map(x => removeNullishLiterals(x as any))
//                     .map(await addIdsToTextCreators(outDB))
                            
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

//                 singleBar.update(offset > total! ? total! : offset, { spinner: spinner.next().value, tableName: table.toUpperCase() });
//         }

//         await new Promise<void>(async (r) => {
//             const polling = async () => {
//                 const count = await (outDB[table] as any).count(); 

//                 if (count !== total) {
//                     console.error(`Table ${table.toUpperCase()} is not consistent! Expected ${total}, got ${count}. Waiting for consistency...`);
//                 } else {
//                     clearInterval(interval);
//                     r();
//                 }
//             }
//             const interval = setInterval(polling, 5e3);
//             polling();
//         });

//         singleBar.update(total, { spinner: spinner.next().value, tableName: table.toUpperCase() });

//         singleBar.stop();
//     }

//     console.log(`

// ✅ ${colors.greenBright('Importing data complete!')}
// ${colors.white('Running data joining task')}

//     `);

//     const fields: any = {};
//     for (const table of ordering) {
//         fields[table] = getSchemaFields(table);
//     }

//     const peoplePrivToPubl = Object.fromEntries((await outDB.person.findMany({select: {id: true, private_id: true}})).map(x => [x.private_id, x.id]));

//     for (let i = 0; i < ordering.length; i++) {
//         const table = ordering[i];
//         const transformer = transformers[table];

//         const singleBar = new cliProgress.SingleBar({
//             clearOnComplete: false,
//             format: `${i % 2 === 0 ? colors.redBright('{bar}') : colors.white('{bar}')} | {percentage}% | {value}/{total} | ETA: {eta_formatted} | Elapsed time: {duration_formatted} | {spinner} Connecting {tableName}`,
//         }, cliProgress.Presets.shades_classic);

//         const total = totals[table]!;
//         singleBar.start(total!, 0, { spinner: '😴', tableName: table.toUpperCase() });

//         for (let offset = 0; offset < total; offset += batchSize) {
//             singleBar.update(offset > total! ? total! : offset, { spinner: spinner.next().value, tableName: table.toUpperCase() });

//             const rows = await inDB.all(getQuery(transformer?.query as string, batchSize, offset));

//             const transformedRows: any[] = 
//                 rows.map(transformer!.transform)
//                     .map(removeNullishLiterals)
//                     .map(getConnectors) as any[];
            
//             const newTableRecords: Record<string, any[]> = {};
                    
//             for(const row of transformedRows) {
//                 for (const [key, value] of Object.entries(row) as [any, any][]) {
//                     if (key === 'id') continue;
                    
//                     const tableName = `_${fields[table][key].relationName}`;
    
//                     if (value.connect) {
//                         const connectors = Array.isArray(value.connect) ? value.connect : [value.connect];

//                         newTableRecords[tableName] ??= [];

//                         newTableRecords[tableName].push(...connectors.map((connector: any) => {                               
//                             return {
//                                 A: key.localeCompare(table) > 0 ? row.id : connector.private_id ? peoplePrivToPubl[connector.private_id] : connector.id,
//                                 B: key.localeCompare(table) > 0 ? connector.private_id ? peoplePrivToPubl[connector.private_id] : connector.id : row.id
//                             };
//                         }));
//                     }
//                 }
//             }  

//             for (const [tableName, rows] of Object.entries(newTableRecords)) {
//                 try {
//                     await outDB.$executeRawUnsafe(`INSERT INTO "${tableName}" ("A", "B") VALUES ${rows.map(x => `('${x.A}', '${x.B}')`).join(', ')} ON CONFLICT DO NOTHING`);
//                 } catch (e) {
//                     console.log();
//                     console.log(`INSERT INTO "${tableName}" ("A", "B") VALUES ${rows.map(x => `('${x.A}', '${x.B}')`).join(', ')}`);
//                     console.log();
//                     throw e;
//                 }
//             }

//             singleBar.update(offset > total! ? total! : offset, { spinner: '⌚️', tableName: `${table.toUpperCase()}, waiting for idle DB state` });
//             await waitUntilDbIdle(outDB);
//         }

//         singleBar.update(total, { spinner: spinner.next().value, tableName: table.toUpperCase() });
//         singleBar.stop();
//     }

//     inDB.close();


    // const c = await outDB['person'].findMany({
    //     where: {
    //         OR: [
    //             {
    //                 faculties: {
    //                     none: {}
    //                 },
    //             },
    //             {
    //                 departments: {
    //                     none: {}
    //                 }
    //             }
    //         ]
    //     },
    //     select: {
    //         id: true,
    //     }
    // });

    // let i = 0;
    // for (const { id } of c) {
    //     if(i++ % 100 === 0) console.log(i);
    //     const person = await outDB['person'].findUnique({
    //         where: {
    //             id
    //         },
    //         include: {
    //             names: true,
    //             programmes: {
    //                 include: {
    //                     faculties: true,
    //                 }
    //             },
    //             classes: {
    //                 include: {
    //                     faculties: true,
    //                 }
    //             },
    //         }
    //     })!;

    //     const faculties = {};

    //     for (const programme of person!.programmes) {
    //         for (const faculty of programme.faculties) {
    //             faculties[faculty.id] ??= 0;
    //             faculties[faculty.id]++;
    //         }
    //     }

    //     for (const c of person!.classes) {
    //         for (const faculty of c.faculties) {
    //             faculties[faculty.id] ??= 0;
    //             faculties[faculty.id]++;
    //         }
    //     }

    //     const facultyIds = Object.entries(faculties).sort((a, b) => b[1] - a[1]).map(x => x[0]);

    //     await outDB['person'].update({
    //         where: {
    //             id
    //         },
    //         data: {
    //             faculties: {
    //                 connect: facultyIds.map(id => ({ id }))
    //             }
    //         }
    //     });
    // }
})().then(async () => {
    // await insertToSolr('class', cls => ({
    //     id: cls.id,
    //     lvl0_cs: cls.names.find(x => x.lang === 'cs')?.value,
    //     lvl0_en: cls.names.find(x => x.lang === 'en')?.value,
    //     lvl1_cs: cls.annotation?.find(x => x.lang === 'cs')?.value,
    //     lvl1_en: cls.annotation?.find(x => x.lang === 'en')?.value,
    //     lvl2_cs: cls.syllabus?.find(x => x.lang === 'cs')?.value,
    //     lvl2_en: cls.syllabus?.find(x => x.lang === 'en')?.value
    // }));
    
    await insertToSolr('person', p => ({
        id: p.id,
        lvl0_cs: p.names[0]?.value,
        lvl0_en: p.names[0]?.value,
        lvl1_cs: [ ...p.classes.map(x => x.names.find(x => x.lang === 'cs')?.value), ...p.publications.map(x => x.names.find(x => x.lang === 'cs')?.value) ].join(' '),
        lvl1_en: [ ...p.classes.map(x => x.names.find(x => x.lang === 'en')?.value), ...p.publications.map(x => x.names.find(x => x.lang === 'en')?.value) ].join(' '),
        lvl2_cs: [ ...p.classes.map(x => x.annotation.find(x => x.lang === 'cs')?.value), ...p.publications.map(x => x.abstract.find(x => x.lang === 'cs')?.value) ].join(' '),
        lvl2_en: [ ...p.classes.map(x => x.annotation.find(x => x.lang === 'en')?.value), ...p.publications.map(x => x.abstract.find(x => x.lang === 'en')?.value) ].join(' ')
    }), { loadConnected: true });

    // await insertToSolr('publication', (pub: any) => ({
    //     id: pub.id,
    //     lvl0_cs: pub.names.find(x => x.lang === 'cs')?.value,
    //     lvl0_en: pub.names.find(x => x.lang === 'en')?.value,
    //     lvl1_cs: pub.keywords.find(x => x.lang === 'cs')?.value,
    //     lvl1_en: pub.keywords.find(x => x.lang === 'en')?.value,
    //     lvl2_cs: pub.abstract?.find(x => x.lang === 'cs')?.value,
    //     lvl2_en: pub.abstract?.find(x => x.lang === 'en')?.value
    // }));

    // await insertToSolr('programme', (pub: any) => ({
    //     id: pub.id,
    //     lvl0_cs: pub.names.find(x => x.lang === 'cs')?.value,
    //     lvl0_en: pub.names.find(x => x.lang === 'en')?.value,
    //     lvl1_cs: pub.profiles?.find(x => x.lang === 'cs')?.value,
    //     lvl1_en: pub.profiles?.find(x => x.lang === 'en')?.value,
    // }));
});
