/* 
	We create a new table for the graph and attach it to the current connection.
*/

ATTACH DATABASE 'graph.db' AS GRAPH;

/**
 * By replacing the string node (person) ids with integers we can save space and speed up the graph creation.
 *  This decreases the size of the indexed database from 1.6GB to 500MB and the time to create the graph from 1m1s to 42s.
 */
CREATE TABLE GRAPH.NODES AS
	SELECT 
		CASE 
			WHEN PERSON_WHOIS_ID IS NOT NULL THEN PERSON_WHOIS_ID
			ELSE PERSON_ID 
		END AS PERSON_PUBLIC_ID,
		PERSON_ID,
		min(CAST(PERSON_PUBLICATION.ROWID AS integer)) AS ID
	FROM 
		PERSON_PUBLICATION
	inner join 
		PERSON 
	USING(PERSON_ID)
	GROUP BY PERSON_ID;

SELECT 'NODES CREATED', COUNT(*) FROM GRAPH.NODES;

CREATE INDEX GRAPH.NODES_ID ON NODES(ID);
CREATE INDEX GRAPH.NODES_PERSON_ID ON NODES(PERSON_ID);

SELECT 'NODE INDEX CREATED', COUNT(*) FROM GRAPH.NODES;

/**
	We create a temporary table to translate the person ids to integers.
*/
CREATE TEMP TABLE TRANSLATED_PERSON_PUBLICATION AS
	SELECT CAST(ID AS INTEGER) as PERSON_ID, PUBLICATION_ID
		FROM 
			PERSON_PUBLICATION
			INNER JOIN
			GRAPH.NODES
		USING(PERSON_ID);

SELECT 'TRANSLATED_PERSON_PUBLICATION CREATED', COUNT(*) FROM TRANSLATED_PERSON_PUBLICATION;

CREATE INDEX TRANSLATED_PERSON_PUBLICATION_PERSON_ID ON TRANSLATED_PERSON_PUBLICATION(PERSON_ID);
CREATE INDEX TRANSLATED_PERSON_PUBLICATION_PUBLICATION_ID ON TRANSLATED_PERSON_PUBLICATION(PUBLICATION_ID);

SELECT 'TRANSLATED_PERSON_PUBLICATION INDEX CREATED', COUNT(*) FROM TRANSLATED_PERSON_PUBLICATION;

/* 
  By turning the publications into edges
*/
CREATE TABLE GRAPH.EDGES AS
	SELECT 
		TRANSLATED_PERSON_PUBLICATION.PERSON_ID AS "FROM", 
		SECOND.PERSON_ID AS "TO", 
		COUNT(*) AS WEIGHT
	FROM (SELECT * FROM TRANSLATED_PERSON_PUBLICATION ORDER BY PERSON_ID) AS TRANSLATED_PERSON_PUBLICATION
			INNER JOIN 
		TRANSLATED_PERSON_PUBLICATION AS SECOND 
			USING("PUBLICATION_ID") 
	WHERE TRANSLATED_PERSON_PUBLICATION.PERSON_ID < SECOND.PERSON_ID
	GROUP BY TRANSLATED_PERSON_PUBLICATION.PERSON_ID, SECOND.PERSON_ID;

SELECT 'EDGES CREATED', COUNT(*) FROM GRAPH.EDGES;

CREATE INDEX GRAPH.EDGES_FROM ON EDGES("FROM");
CREATE INDEX GRAPH.EDGES_TO ON EDGES("TO");

SELECT 'EDGES INDEX CREATED', COUNT(*) FROM GRAPH.EDGES;

DROP INDEX GRAPH.NODES_PERSON_ID;

ALTER TABLE GRAPH.NODES DROP COLUMN PERSON_ID;
ALTER TABLE GRAPH.NODES RENAME COLUMN PERSON_PUBLIC_ID TO PERSON_ID;



-- -- real    1m1,352s
-- -- user    0m41,300s
-- -- sys     0m13,288s