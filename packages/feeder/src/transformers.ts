import type { Transformers } from "./types/types";
import { iso6392BTo1 } from "./utils/lang";
import { readFileSync } from 'fs';
import path from 'path';

/**
 * The following transformers are used to transform the data from the SQLite database export into the Prisma schema.
 * 
 * The transformers are used in the following way:
 *  - The query is used to select the data from the SQLite database.
 *  - The transform function is used to transform each row of the result into the Prisma schema.
 *  - The Prisma schema is then used to insert the data into the Prisma database.
 * 
 * First, all the inserts are done without joining the data. This is done to ensure that all the data is inserted into the database.
 * Only then, the data is joined. This way, we can import the data in any order.
 * 
 * Below is the list of transformers used to transform the example explorer.db file. Use it as a reference.
 */
export const transformers: Transformers = {
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
        query: `SELECT * FROM T_PERSON`,
        transform: (data: any) => {
            const publicId = data.TYPE === 'EXTERNAL_INFERRED' ? data.PERSON_ID : data.PERSON_WHOIS_ID;
            if(!publicId) throw new Error('No public id found for person' + JSON.stringify(data));

            const faculties = JSON.parse(data.FACULTY_ID) ?? [];
            const departments = JSON.parse(data.DEPT_ID) ?? [];

            return {
                id: publicId,
                private_id: data.PERSON_ID,
                type: data.TYPE === 'U' ? 'INTERNAL' : data.TYPE === 'E' ? 'EXTERNAL' : data.TYPE === 'EXTERNAL_INFERRED' ? 'EXTERNAL_INFERRED' : 'OTHER',
                names: {
                    create: [{
                        lang: 'en',
                        value: data.PERSON_NAME,
                    }]
                },
                faculties: {
                    connect: faculties.map((x: any) => ({id: x}))
                },
                departments: {
                    connect: departments.map((x: any) => ({id: x}))
                }
            }
        }
    },
    class: {
        query: 'SELECT C.*, P.PERSON_ID FROM CLASS as C LEFT JOIN T_PERSON as P ON C.TEACHER_ID = PERSON_ID GROUP BY C.CLASS_ID',
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
    T_PERSON.PERSON_ID, 
    (SELECT group_concat(ID, '/') from STUDY_PROGRAMME where s.STUDY_PROGRAMME_ID = STUDY_PROGRAMME_ID and id != s.id) AS RELATED_PROGRAMMES,
    (SELECT group_concat(STUDY_PROGRAMME_CLASS.CLASS_ID, '/') from STUDY_PROGRAMME_CLASS LEFT JOIN CLASS as c on c.CLASS_ID = STUDY_PROGRAMME_CLASS.CLASS_ID where s.ID = ID and c.CLASS_ID is not null) AS RELATED_CLASSES
FROM 
    STUDY_PROGRAMME as S 
        LEFT JOIN 
    T_PERSON 
        ON S.GARANT_ID = T_PERSON.PERSON_ID 
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
                languages: [iso6392BTo1[row.JAZYK.toLowerCase()] ?? 'cs'],
                programmes: {
                    connect: row.RELATED_PROGRAMMES?.split('/').map((x: any) => ({id: x})),
                },
                classes: {
                    connect: row.RELATED_CLASSES?.split('/').map((x: any) => ({id: x})),
                },
                profiles: {
                    create: [{
                        lang: 'cs',
                        value: row.GRADUATE_PROFILE_CS,
                    },
                    {
                        lang: 'en',
                        value: row.GRADUATE_PROFILE_EN,
                    }]
                },
            }
        }
    },
    publication: {
        query: `
        SELECT * from PUBLICATION 
            left join
            T_PUBLICATION_ORGANISATION using("PUBLICATION_ID")
            left join
            T_PUBLICATION_AUTHORS using("PUBLICATION_ID")
            left join
            T_PUBLICATION_TEXTS using("PUBLICATION_ID")`,
        transform: (row) => {
            let texts = {}

            try {
                texts = JSON.parse(row.texts) ?? {};
            } catch (e) {
                console.error('Error parsing texts', e);
            }

            const langs = Object.keys(texts);
            const departments = JSON.parse(row.DEPARTMENTS) ?? [];
            const faculties = JSON.parse(row.FACULTIES) ?? [];
            const authors = JSON.parse(row.AUTHORS) ?? [];

            return {
                id: row.PUBLICATION_ID,
                year: row.PUB_YEAR,
                language: iso6392BTo1[row.LANGUAGE.toLowerCase()] ?? 'cs',
                authors: '',
                departments: {
                    connect: departments.map((x: any) => ({id: x}))
                },
                faculties: {
                    connect: faculties.map((x: any) => ({id: x}))
                },
                people: {
                    connect: authors.filter(x=>x).map((x: any) => ({private_id: x}))
                },
                names: {
                    create: langs.map((x: any) => ({
                        lang: iso6392BTo1[x.toLowerCase()] ?? 'cs',
                        value: texts[x]?.title,
                    }))
                },
                abstract: {
                    create: langs.map((x: any) => ({
                        lang: iso6392BTo1[x.toLowerCase()] ?? 'cs',
                        value: texts[x]?.abstract,
                    }))
                },
                keywords: {
                    create: langs.map((x: any) => ({
                        lang: iso6392BTo1[x.toLowerCase()] ?? 'cs',
                        value: texts[x]?.keywords,
                    }))
                },
                
            }
        }
    },
};

export const indexCreation = `
CREATE INDEX IF NOT EXISTS "STUDY_PROGRAMME_ID" ON "STUDY_PROGRAMME" ("STUDY_PROGRAMME_ID");
CREATE INDEX IF NOT EXISTS "STUDY_PROGRAMME_CLASS_ID" ON "STUDY_PROGRAMME_CLASS" ("ID");
CREATE INDEX IF NOT EXISTS "PUBLICATION_ID" ON "PUBLICATION" ("PUBLICATION_ID");
CREATE INDEX IF NOT EXISTS "PUBLICATION_KEYWORDS_PUB_ID" ON PUBLICATION_KEYWORDS("PUBLICATION_ID");
CREATE INDEX IF NOT EXISTS "CLASS_ID" ON "CLASS" ("CLASS_ID");
CREATE INDEX IF NOT EXISTS "TEACHER_ID" ON "CLASS" ("TEACHER_ID");
CREATE INDEX IF NOT EXISTS "PERSON_ID" ON "PERSON" ("PERSON_ID");
`
+ readFileSync(path.join(__dirname, '../../database-scripts/normalization.sql'), 'utf-8')
+ readFileSync(path.join(__dirname, '../../database-scripts/temporaries.sql'), 'utf-8')
+ readFileSync(path.join(__dirname, '../../database-scripts/inference.sql'), 'utf-8');