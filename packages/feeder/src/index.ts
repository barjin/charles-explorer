/**
 * This file is the main entry point for the migration script.
 * 
 * It is responsible for:
 * - Creating the database schema
 * - Migrating the data from the SQLite database to the Prisma database
 * - Joining the data in the Prisma database
 * - Inserting the data into Solr
 * 
 * Before running this script, make sure your target database / Solr is clean. Multiple runs of this script will most likely result in duplicate and / or inconsistent data.
 */

import { db } from '@charles-explorer/prisma';

import { AsyncDatabase } from 'promised-sqlite3';
import colors from 'ansi-colors';
import { transformers, indexCreation } from './transformers';
import { connectPrismaEntities, insertToSolr, migrateSqliteToPrisma } from './migrate';

import dotenv from "dotenv";

import fs from 'fs';

dotenv.config({ path: `${__dirname}/../../../.env` });

const ordering = [
    'faculty', 
    'department', 
    'person',
    'class',
    'programme',
    'publication'
] as const;

const batchSize = 5000;

function main() {
    console.log((colors.bgRed.bold.white(`
    ███╗                                                                                         
  ██╔═══██╗        __             __        ___  __              __   __   __  ___  ___  __      
  ██║   ██║       /  \` |__|  /\\  |__) |    |__  /__\`    |  |\\/| |__) /  \\ |__)  |  |__  |__)     
  ╚██████╔╝       \\__, |  | /~~\\ |  \\ |___ |___ .__/    |  |  | |    \\__/ |  \\  |  |___ |  \\     
   ╚═════╝                                                                                       
`)));
  
(async () => {
    // test if the database file exists
    if(!fs.existsSync(`${__dirname}/../../../explorer.db`)) {
        console.log(`
            ${colors.redBright('Database file not found!')}
            Please add the ${colors.white('explorer.db')} file to the root of the project and try again.
        `);
        process.exit(1);
    }

    console.log('Preparing the SQLite database for migration...');
    console.time('time spent on sqlite operations');
    const inDB = await AsyncDatabase.open(`${__dirname}/../../../explorer.db`);
    await inDB.exec(indexCreation);
    console.log('SQLite database prepared!');
    console.timeEnd('time spent on sqlite operations');

    // Creation task - create all the tables without joining the data
    for (const table of ordering) {
        await migrateSqliteToPrisma(inDB, db, table, transformers[table], { batchSize })
    }

            console.log(`
        
        ✅ ${colors.greenBright('Importing data complete!')}
        ${colors.white('Running data joining task')}
        
            `);

    // Joining task - fill up the relational tables
    for (const table of ordering) {
        await connectPrismaEntities(inDB, db, table, transformers[table], { batchSize })
    }

    inDB.close();
})().then(async () => {
        console.log(`

    ✅ ${colors.greenBright('Data joining complete!')}
    ${colors.white('Inserting data into Solr')}
    
        `);

    await insertToSolr('class', db, cls => ({
        id: cls.id,
        lvl0_cs: cls.names.find(x => x.lang === 'cs')?.value,
        lvl0_en: cls.names.find(x => x.lang === 'en')?.value,
        lvl1_cs: cls.annotation?.find(x => x.lang === 'cs')?.value,
        lvl1_en: cls.annotation?.find(x => x.lang === 'en')?.value,
        lvl2_cs: cls.syllabus?.find(x => x.lang === 'cs')?.value,
        lvl2_en: cls.syllabus?.find(x => x.lang === 'en')?.value
    }));
    
    await insertToSolr('person',db, p => ({
        id: p.id,
        lvl0_cs: p.names[0]?.value,
        lvl0_en: p.names[0]?.value,
        lvl1_cs: [ ...p.classes.map(x => x.names.find(x => x.lang === 'cs')?.value), ...p.publications.map(x => x.names.find(x => x.lang === 'cs')?.value) ].join(' '),
        lvl1_en: [ ...p.classes.map(x => x.names.find(x => x.lang === 'en')?.value), ...p.publications.map(x => x.names.find(x => x.lang === 'en')?.value) ].join(' '),
        lvl2_cs: [ ...p.classes.map(x => x.annotation.find(x => x.lang === 'cs')?.value), ...p.publications.map(x => x.abstract.find(x => x.lang === 'cs')?.value) ].join(' '),
        lvl2_en: [ ...p.classes.map(x => x.annotation.find(x => x.lang === 'en')?.value), ...p.publications.map(x => x.abstract.find(x => x.lang === 'en')?.value) ].join(' ')
    }), { loadConnected: true, batchSize: 1000 });

    await insertToSolr('publication',db, (pub) => ({
        id: pub.id,
        lvl0_cs: pub.names.find(x => x.lang === 'cs')?.value,
        lvl0_en: pub.names.find(x => x.lang === 'en')?.value,
        lvl1_cs: pub.keywords.find(x => x.lang === 'cs')?.value,
        lvl1_en: pub.keywords.find(x => x.lang === 'en')?.value,
        lvl2_cs: pub.abstract?.find(x => x.lang === 'cs')?.value,
        lvl2_en: pub.abstract?.find(x => x.lang === 'en')?.value
    }));

    await insertToSolr('programme', db, (pub) => ({
        id: pub.id,
        lvl0_cs: pub.names.find(x => x.lang === 'cs')?.value,
        lvl0_en: pub.names.find(x => x.lang === 'en')?.value,
        lvl1_cs: pub.profiles?.find(x => x.lang === 'cs')?.value,
        lvl1_en: pub.profiles?.find(x => x.lang === 'en')?.value,
    }));
});  
}

main();