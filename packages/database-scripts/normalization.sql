-- This script normalizes most of the tables in the import database to higher NFs for better performance and easier querying.
-- Run before any other work with the imported database using `sqlite3 ./import.db < normalization.sql`
-- Jindřich Bär 2024-02-03

-- Normalizing the publications table:
-- Add index to the publication table
CREATE INDEX PUBLICATION_P_INDEX ON PUBLICATION (PUBLICATION_ID);
CREATE INDEX PUBLICATION_KEYWORDS_P_INDEX ON PUBLICATION_KEYWORDS (PUBLICATION_ID);
CREATE INDEX PUBLICATION_AUTHOR_ALL_P_INDEX ON PUBLICATION_AUTHOR_ALL (PUBLICATION_ID);
CREATE INDEX PERSON_P_INDEX ON PERSON (PERSON_ID);

-- these columns are empty:
ALTER TABLE PUBLICATION DROP COLUMN ABSTRACT;
ALTER TABLE PUBLICATION DROP COLUMN KEYWORDS;

-- Test whether all publications have their abstract (TRUE if 0, false if anything else) // this was also true on 3.2.2024
SELECT COUNT(*) FROM 
PUBLICATION 
	LEFT JOIN 
PUBLICATION_KEYWORDS 
ON PUBLICATION.PUBLICATION_ID = PUBLICATION_KEYWORDS.PUBLICATION_ID 
WHERE PUBLICATION_KEYWORDS.PUBLICATION_ID IS NULL;

-- => the title column in PUBLICATION is worthless (and carries less information - publication_keywords has language annotations
ALTER TABLE PUBLICATION DROP COLUMN TITLE;

-- Normalize the PUBLICATION table => one row, one publication

CREATE TABLE PUBLICATION_DEPARTMENT AS SELECT PUBLICATION_ID, DEPT_POID from PUBLICATION;
ALTER TABLE PUBLICATION DROP COLUMN DEPT_POID;

CREATE TABLE PUBLICATION_YEAR AS SELECT * FROM PUBLICATION GROUP BY PUBLICATION_ID;
DROP TABLE PUBLICATION;
ALTER TABLE PUBLICATION_YEAR RENAME TO PUBLICATION;

-- Normalize the PUBLICATION_KEYWORDS table (and joining it with the original publications table)

CREATE TABLE PUBLICATION_LANGUAGE AS select * from (SELECT PUBLICATION_ID, languague as LANGUAGE from PUBLICATION_KEYWORDS where original = 'Ano');

CREATE TABLE PUBLICATION_COMPLETE AS 
SELECT 
    PUBLICATION_LANGUAGE."PUBLICATION_ID", 
    "PUB_YEAR", 
    "LANGUAGE" 
FROM PUBLICATION_LANGUAGE 
    LEFT JOIN 
PUBLICATION 
ON PUBLICATION.PUBLICATION_ID = PUBLICATION_LANGUAGE.PUBLICATION_ID;

DROP TABLE PUBLICATION_LANGUAGE;
DROP TABLE PUBLICATION;
ALTER TABLE PUBLICATION_COMPLETE RENAME TO PUBLICATION;

ALTER TABLE "PUBLICATION_KEYWORDS" DROP COLUMN ORIGINAL;

-- Start normalizing the publication_keywords table - there are triplets of title + abstract + keywords for every publication and language mutation - gonna tear this apart for 3NF

CREATE TABLE PUBLICATION_TITLE AS SELECT PUBLICATION_ID, LANGUAGUE AS LANGUAGE, TITLE from PUBLICATION_KEYWORDS WHERE LENGTH(TRIM(TITLE)) > 0;
CREATE TABLE PUBLICATION_ABSTRACT AS SELECT PUBLICATION_ID, LANGUAGUE AS LANGUAGE, ABSTRACT from PUBLICATION_KEYWORDS WHERE LENGTH(TRIM(ABSTRACT)) > 0;
CREATE TABLE PUBLICATION_KEYWORDS_SEPARATE AS SELECT PUBLICATION_ID, LANGUAGUE AS LANGUAGE, KEYWORDS from PUBLICATION_KEYWORDS WHERE LENGTH(TRIM(KEYWORDS)) > 0;

DROP TABLE PUBLICATION_KEYWORDS;

ALTER TABLE "PUBLICATION_KEYWORDS_SEPARATE" RENAME TO "PUBLICATION_KEYWORDS";

-- Right now, we have :
--  PUBLICATION - the original publication table, with the year and language
--  PUBLICATION_KEYWORDS - the keywords of the publication, with the language
  --  PUBLICATION_TITLE - the title of the publication, with the language
  --  PUBLICATION_ABSTRACT - the abstract of the publication, with the language
  --  PUBLICATION_KEYWORDS - the keywords of the publication, with the language

-- PUBLICATION now contains records from the PUBLICATION_KEYWORDS too, so this is all fixed now :)

-- Now let's normalize the people!

-- Normalizing the PERSON table
ALTER TABLE person rename to PERSON_ALL;

CREATE TABLE PERSON_WEBSITE AS SELECT PERSON_ID, PERSON_WEBSITE from PERSON_ALL where length(PERSON_WEBSITE) > 0;

ALTER TABLE PERSON_ALL DROP COLUMN PERSON_WEBSITE;

-- There are two tables with publication authors - PUBLICATION_AUTHOR and PUBLICATION_AUTHOR_ALL. We test those for inclusion:

-- Test whether PUBLICATION_AUTHOR <= PUBLICATION_AUTHOR_ALL (true if 0, false if anything else) // this was TRUE on 3.2.2024 - we can disregard the smaller PUBLICATION_AUTHOR table
SELECT Count(*) from 
PUBLICATION_AUTHOR 
	left join 
PUBLICATION_AUTHOR_ALL 
on PUBLICATION_AUTHOR_ALL.PERSON_ID = PUBLICATION_AUTHOR.PERSON_id 
and 
PUBLICATION_AUTHOR_ALL.PUBLICATION_ID = PUBLICATION_AUTHOR.PUBLICATION_ID
where PUBLICATION_AUTHOR_ALL.PERSON_NAME is null;

-- => PUBLICATION_AUTHOR_ALL is a superset of PUBLICATION_AUTHOR, so we can disregard the smaller table
DROP TABLE PUBLICATION_AUTHOR;

-- The following query returns no rows, the EXTERNAL attribute is fully dependent on the existence of the PERSON_ID
SELECT COUNT(*) FROM "PUBLICATION_AUTHOR_ALL" WHERE (length("PERSON_ID") > 0 AND "EXTERNAL" = 1) OR (length("PERSON_ID") = 0 AND "EXTERNAL" = 0);

-- Therefore, we can drop the EXTERNAL attribute
ALTER TABLE "PUBLICATION_AUTHOR_ALL" DROP COLUMN EXTERNAL;

-- collect all the internal authors (we can group them by their ID)
-- SELECT 
--     "PERSON_ID", 
--     "PERSON_NAME" 
-- FROM "PUBLICATION_AUTHOR_ALL" WHERE length("PERSON_ID") > 0 
-- GROUP BY "PERSON_ID";

-- Collect all the external authors (we cannot group them by anything, as they don't have any identifiers - names are not unique).
-- We generate them identifiers based on their names and their publication IDs - the name-publication affiliation is the only thing we know is unique.
    -- In fact, even that doesn't have to be unique - consider two people with the same name and the same publication.
        -- we add row numbers to the generated ids to ensure uniqueness

-- SELECT 
--     rowid || '-' || "PERSON_NAME" || '-' || "PUBLICATION_ID" AS "PERSON_ID", 
--     "PERSON_NAME" 
-- FROM 
--     "PUBLICATION_AUTHOR_ALL" 
-- WHERE length("PERSON_ID") = 0;

-- We now can collect all the people in the PUBLCATION_AUTHOR_ALL table and put them all together

CREATE TABLE AUTHORS AS
    SELECT 
        "PERSON_ID", 
        "PERSON_NAME" 
    FROM "PUBLICATION_AUTHOR_ALL" WHERE length("PERSON_ID") > 0 
    GROUP BY "PERSON_ID"
UNION
    SELECT 
        rowid || '-' || replace(replace(replace(lower("PERSON_NAME"),' ', '-'), '.', '-'), ',', '-') || '-' || "PUBLICATION_ID" AS "PERSON_ID", 
        "PERSON_NAME" 
    FROM 
        "PUBLICATION_AUTHOR_ALL" 
    WHERE length("PERSON_ID") = 0;

-- Now we can merge the newly found people with the original people in the PERSON table
    -- few notes:
        -- even existing people (internal) can have multiple different names in the publications (e.g. "John Doe" and "J. Doe", "Bc. John Doe" -> "Mgr. John Doe" etc.)
            -- for the internals, we take the name from the PERSON_ALL table, as that's the most reliable source
            -- for the externals, this doesn't happen, as we treat each author-publication pair as a unique person
CREATE TABLE PERSON_UNION AS
SELECT 
    authors."PERSON_ID",
    coalesce(PERSON_ALL."PERSON_NAME", AUTHORS."PERSON_NAME") as "PERSON_NAME",
    PERSON_ALL."PERSON_WHOIS_ID",
    case when PERSON_ALL."PERSON_ID" is null then 'EXTERNAL_INFERRED' else PERSON_ALL.TYPE end as TYPE
from 
AUTHORS 
    LEFT JOIN
PERSON_ALL using (PERSON_ID)
UNION
SELECT * FROM PERSON_ALL WHERE PERSON_ID;

-- create index PERSON_PERSON_ID on PERSON (PERSON_ID);

-- DELETE FROM "PERSON"
--     WHERE ROWID NOT IN (SELECT MIN(ROWID) FROM "PERSON" GROUP BY "PERSON_ID");

DROP TABLE PERSON_ALL;
DROP TABLE AUTHORS;

ALTER TABLE PERSON_UNION RENAME TO PERSON;

CREATE TABLE PERSON_PUBLICATION AS
SELECT 
    CASE 
        WHEN length("PERSON_ID") = 0 THEN rowid || '-' || replace(replace(replace(lower("PERSON_NAME"),' ', '-'), '.', '-'), ',', '-') || '-' || "PUBLICATION_ID"
        ELSE "PERSON_ID"
    END AS "PERSON_ID",
    "PUBLICATION_ID"
FROM 
    "PUBLICATION_AUTHOR_ALL";

CREATE INDEX PERSON_PUBLICATION_PERSON_ID_INDEX ON PERSON_PUBLICATION (PERSON_ID);
CREATE INDEX PERSON_PUBLICATION_PUBLICATION_ID_INDEX ON PERSON_PUBLICATION (PUBLICATION_ID);

DROP TABLE PUBLICATION_AUTHOR_ALL;
