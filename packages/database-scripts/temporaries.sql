-- Active: 1707662842564@@127.0.0.1@3306
-- This SQL script demonstrates SELECT statements that retrieve unique entities (people / publications) from the (normalized - see normalization.sql) import database.
--  Because of the one entity = one row principle, the SELECT statements are quite complex and result in heavily denormalized tables.
--  Perhaps the most glaring example of this is the use of the json_group_array and json_group_object functions to aggregate the data into JSON objects.
--  It's obvious that the resulting relations are not even in the 1NF, as the JSON objects contain arrays of values.
--  However, the resulting tables are very easy to query and to reason about - the data is all in one place and the queries are very simple.
--  This makes the resulting tables a good fit for the read-heavy workloads, like the subsequent export to another database or the data analysis.
--
--  The creation of the one entity = one row tables from the multiple normalized tables also requires the use of temporary tables.
--  While this might be possible using the CTE or views, the performance of those constructs in the current Sqlite3 engine is not as good as the performance of temporary tables.
--   Unlike temporary tables, CTEs and views also cannot be indexed, which is a significant performance drawback for the queries - mostly for the joins and group by operations.
--  However, the use of temporary tables can only be warranted by the fact we don't update the data in the original tables (the imports are done in a incremental manner).
--   Needing to maintain (add / remove / update) the data from the temporary tables would be a significant drawback, as the temporary tables do not exist in the original database and would need to be recreated every time the data changes.


-- CREATE a temporary table to hold the publication's departments and faculties
CREATE TEMP TABLE T_PUBLICATION_ORGANISATION AS
SELECT "PUBLICATION_ID", 
    JSON_GROUP_ARRAY(DISTINCT "DEPT_ID") AS DEPARTMENTS,
    JSON_GROUP_ARRAY(DISTINCT "FACULTY_ID") AS FACULTIES
FROM PUBLICATION 
INNER JOIN "PUBLICATION_DEPARTMENT" USING("PUBLICATION_ID")
INNER JOIN "DEPARTMENT" ON "DEPT_POID" = "POID"
GROUP BY "PUBLICATION_ID";

CREATE INDEX IF NOT EXISTS T_PUBLICATION_ORGANISATION_INDEX ON T_PUBLICATION_ORGANISATION ("PUBLICATION_ID");

-- SELECT * FROM T_PUBLICATION_ORGANISATION;

-- CREATE a temporary table to hold the publication's authors (denormalized - one row per publication)
CREATE TEMP TABLE T_PUBLICATION_AUTHORS AS
SELECT 
    PUBLICATION.PUBLICATION_ID,
    json_group_array(DISTINCT PERSON_PUBLICATION."PERSON_ID") AS AUTHORS
        FROM PUBLICATION 
    LEFT JOIN "PERSON_PUBLICATION" USING("PUBLICATION_ID")
GROUP BY PUBLICATION.PUBLICATION_ID;

CREATE INDEX IF NOT EXISTS T_PUBLICATION_AUTHORS_INDEX ON T_PUBLICATION_AUTHORS (PUBLICATION_ID);

-- SELECT * FROM T_PUBLICATION_AUTHORS;

-- SELECT * FROM publication LEFT JOIN T_PUBLICATION_ORGANISATION USING("PUBLICATION_ID") LEFT JOIN T_PUBLICATION_AUTHORS USING("PUBLICATION_ID");

CREATE INDEX IF NOT EXISTS PUBLICATION_TITLE_INDEX ON PUBLICATION_TITLE (PUBLICATION_ID, LANGUAGE);
CREATE INDEX IF NOT EXISTS PUBLICATION_ABSTRACT_INDEX ON PUBLICATION_ABSTRACT (PUBLICATION_ID, LANGUAGE);
CREATE INDEX IF NOT EXISTS PUBLICATION_KEYWORDS_INDEX ON PUBLICATION_KEYWORDS (PUBLICATION_ID, LANGUAGE);

-- CREATE a temporary table to hold the publication's texts (denormalized - one row per publication with all texts as JSON)
CREATE TEMP TABLE T_PUBLICATION_TEXTS AS
SELECT 
"PUBLICATION_ID",
json_group_object("LANGUAGE", json_object('title', "TITLE", 'abstract', "ABSTRACT", 'keywords', "KEYWORDS")) AS "texts"
 FROM "PUBLICATION_TITLE"
    LEFT JOIN 
    "PUBLICATION_ABSTRACT" USING("PUBLICATION_ID", "LANGUAGE")
    LEFT JOIN
    "PUBLICATION_KEYWORDS" USING("PUBLICATION_ID", "LANGUAGE")
    GROUP BY "PUBLICATION_ID";

CREATE INDEX IF NOT EXISTS T_PUBLICATION_TEXTS_INDEX ON T_PUBLICATION_TEXTS (PUBLICATION_ID);

-- SELECT * FROM T_PUBLICATION_TEXTS;

-- SELECT * from PUBLICATION 
--             left join
--             T_PUBLICATION_ORGANISATION using("PUBLICATION_ID")
--             left join
--             T_PUBLICATION_AUTHORS using("PUBLICATION_ID")
--             left join
--             T_PUBLICATION_TEXTS using("PUBLICATION_ID");

CREATE INDEX IF NOT EXISTS PERSON_INDEX ON PERSON (PERSON_ID);
CREATE INDEX IF NOT EXISTS TEACHER_INDEX ON CLASS (TEACHER_ID);

CREATE TEMP TABLE T_PERSON AS
select PERSON.*,
    json_group_array(DISTINCT DEPT_ID) as "DEPT_ID",
    json_group_array(DISTINCT FACULTY_ID) as "FACULTY_ID"
FROM "PERSON"
        LEFT JOIN 
    CLASS 
        ON PERSON."PERSON_ID" = CLASS."TEACHER_ID"
    WHERE "DEPT_ID" IS NOT NULL
GROUP BY PERSON."PERSON_ID"
    UNION
Select PERSON.*,
    NULL as "DEPT_ID",
    NULL as "FACULTY_ID"
FROM "PERSON"
        LEFT JOIN
    "CLASS" 
        ON PERSON."PERSON_ID" = "CLASS"."TEACHER_ID"
    WHERE "DEPT_ID" IS NULL
GROUP BY PERSON."PERSON_ID";

CREATE INDEX IF NOT EXISTS T_PERSON_INDEX ON T_PERSON (PERSON_ID);

-- The exports currently contain all the people from the internal SIS databases, including the ones that are not associated with any publication or class.
-- These people are disconnected from the rest of the data and therefore are not useful for the social network analysis.
DELETE FROM T_PERSON 
    WHERE 
    (PERSON_ID NOT IN (SELECT PERSON_ID FROM "PERSON_PUBLICATION") 
        AND
    PERSON_ID NOT IN (SELECT TEACHER_ID FROM "CLASS"));
