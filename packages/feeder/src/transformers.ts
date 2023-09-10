import type { Transformers } from "./types/types";
import { iso6392BTo1 } from "./utils/lang";

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
        query: 'SELECT PERSON.*, CLASS.FACULTY_ID, CLASS.DEPT_ID FROM PERSON LEFT JOIN CLASS ON PERSON.PERSON_ID = CLASS.TEACHER_ID GROUP BY PERSON_WHOIS_ID',
        transform: (data: any) => {
            return {
                id: data.PERSON_WHOIS_ID,
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
                languages: [iso6392BTo1[row.JAZYK] ?? 'cs'],
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
            const localized: Record<string, any>[] = 
                JSON.parse(row.LOCALIZED)
                .filter((x: any, i: number, a: any[]) => {
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
                        lang: iso6392BTo1[x.lang] ?? 'en',
                        value: x.title,
                    }))
                },
                abstract: {
                    create: localized.map((x: any) => ({
                        lang: iso6392BTo1[x.lang] ?? 'en',
                        value: x.abstract,
                    }))
                },
                keywords: {
                    create: localized.map((x: any) => ({
                        lang: iso6392BTo1[x.lang] ?? 'en',
                        value: x.keywords,
                    }))
                },
                
            }
        }
    },
};

export const indexCreation = `
CREATE INDEX IF NOT EXISTS "STUDY_PROGRAMME_ID" ON "STUDY_PROGRAMME" ("STUDY_PROGRAMME_ID");
CREATE INDEX IF NOT EXISTS "STUDY_PROGRAMME_CLASS_ID" ON "STUDY_PROGRAMME_CLASS" ("ID");
CREATE INDEX IF NOT EXISTS "PUBLICATION_AUTHOR_PUB_ID" ON "PUBLICATION_AUTHOR" ("PUBLICATION_ID");
CREATE INDEX IF NOT EXISTS "PUBLICATION_ID" ON "PUBLICATION" ("PUBLICATION_ID");
CREATE INDEX IF NOT EXISTS "PUBLICATION_KEYWORDS_PUB_ID" ON PUBLICATION_KEYWORDS("PUBLICATION_ID");
CREATE INDEX IF NOT EXISTS "CLASS_ID" ON "CLASS" ("CLASS_ID");
CREATE INDEX IF NOT EXISTS "TEACHER_ID" ON "CLASS" ("TEACHER_ID");
CREATE INDEX IF NOT EXISTS "PERSON_ID" ON "PERSON" ("PERSON_ID");
`;