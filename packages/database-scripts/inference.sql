-- Active: 1708020081909@@127.0.0.1@3306
/* Some people don't have a department / faculty attached, because they don't teach any class.
 This is clearly wrong - we can infer their department from their publications.
 However, we only do it for the people who are not EXTERNAL_INFERRED - those are people without a connection to the university (external people from other universities, etc.).
*/

/* First, we create some indexes (we figured out which ones with EXPLAIN QUERY PLAN - basically we try to 
	eradicate all TABLE SCANs, which are bad for performance).
*/
CREATE INDEX I_PUBLICATION_DEPARTMENT ON PUBLICATION_DEPARTMENT('PUBLICATION_ID');
CREATE INDEX I_DEPARTMENT_PUBLICATION ON PUBLICATION_DEPARTMENT('DEPT_POID');
CREATE INDEX I_DEPARTMENT_FACULTY ON DEPARTMENT('POID');
CREATE INDEX I_PERSON_FACULTY ON T_PERSON('FACULTY_ID', 'TYPE');

/* 
	Then we create a temporary table PERSON_FACULTY, 
	which contains the PERSON_ID, the DEPT_ID and the FACULTY_ID of the internal people who don't have a faculty attached, 
	but have publications. 
*/
CREATE TEMP TABLE T_PERSON_FACULTY as SELECT PERSON_ID, DEPARTMENT.DEPT_ID AS DEPT_ID, DEPARTMENT.FACULTY_ID as FACULTY_ID FROM
(SELECT * FROM T_PERSON  -- this CTE is fully indexed because of the I_T_PERSON_FACULTY index - furthermore, the parent expression is only called once, as it CREATEs a table (materializes the result)
	WHERE FACULTY_ID IS NULL 
		AND 
	NOT TYPE = 'EXTERNAL_INFERRED')
LEFT JOIN
	PERSON_PUBLICATION USING(PERSON_ID)
LEFT JOIN
	PUBLICATION_DEPARTMENT USING(PUBLICATION_ID)
LEFT JOIN
	DEPARTMENT ON DEPT_POID = DEPARTMENT.POID
WHERE DEPARTMENT.DEPT_ID IS NOT NULL OR DEPARTMENT.FACULTY_ID IS NOT NULL;

/* 
	Then we create a temporary table T_PERSON_FACULTY_COUNTS, 
	which contains the PERSON_ID, the DEPT_ID, the FACULTY_ID and the COUNT of the number of publications with this configuration in the T_PERSON_FACULTY table.
	(i.e. how many publications does a person have in a department-faculty pair).

	The FACULTY column is functionally dependent on the DEPT_ID (but not the other way around), so we can GROUP BY only by the PERSON_ID and the DEPT_ID.
*/
CREATE TEMP TABLE T_PERSON_FACULTY_COUNTS AS
SELECT *, COUNT(*) AS COUNT FROM T_PERSON_FACULTY 
	GROUP BY PERSON_ID, DEPT_ID;
	
-- SELECT * FROM T_PERSON_FACULTY_COUNTS;

/*
	Now we only filter the department / faculty pairs with the highest count for each person.

	This is done with the paradigmatic "group by -> inner join" pattern, where we first find the maximum count for each person,
	and then join with the original table to find only the records with the maximum count.

	Note that this table is not guaranteed to have unique PERSON_IDs, because a person can have the same number of publications in two (or more) different departments.
*/	
-- SELECT * FROM 
-- 	T_PERSON_FACULTY_COUNTS 
-- 		INNER JOIN 
-- 	( SELECT PERSON_ID, MAX("COUNT") AS COUNT FROM T_PERSON_FACULTY_COUNTS GROUP BY PERSON_ID ) AS MAXES 
-- 		USING(PERSON_ID, "COUNT");

/*
	Because of the "multiple rows per one person" problem, we have to do a subquery to further denormalize the table and get only one row per person.
	Inside of the aggregate columns however, we would still like to keep the ordering based on the number of the publications within the given institution.

	Note that this is not possible with a regular ORDER BY clause before the GROUP BY, because in SQLite, the aggregate functions are called with an arbitrary order of the rows. This doesn't cause any issues to most aggregate functions like count, sum, avg or max (or any other commutative functions, in fact), but it doesn't preserve the required ordering for the JSON_GROUP_ARRAY function and the like.
	To pass the aggregate function parameters in a specific order, we have to use the `ORDER BY` syntax inside of the `aggregate-function-invocation` token (more details in the documentation here: https://www.sqlite.org/lang_aggfunc.html);
	This feature was added quite recently (in the version 3.44.0 released on 2023-11-01), so this query will not work with older versions of SQLite. See the release changelog at https://sqlite.org/releaselog/3_44_0.html.
*/
CREATE TEMP TABLE T_PERSON_INFERRED_FACULTIES AS
SELECT 
	PERSON_ID,
	JSON_GROUP_ARRAY(DEPT_ID ORDER BY "COUNT") AS DEPARTMENT_IDS,
	JSON_GROUP_ARRAY(DISTINCT FACULTY_ID ORDER BY "COUNT") AS FACULTY_IDS -- Here we also pass the "DISTINCT" keyword, as multiple departments could have the same faculty.
FROM 
	T_PERSON_FACULTY_COUNTS 
		INNER JOIN 
	( 
		SELECT 
			PERSON_ID, MAX("COUNT") AS COUNT 
		FROM T_PERSON_FACULTY_COUNTS GROUP BY PERSON_ID 
	) AS MAXES 
		USING(PERSON_ID, "COUNT")
	-- ORDER BY PERSON_ID, "COUNT" DESC; -- Ordering the results here doesn't work - this order is not enforced inside of the aggregate function parameters
GROUP BY PERSON_ID;

SELECT COUNT(*) FROM T_PERSON WHERE FACULTY_ID IS NOT NULL;

/*
	Finally, we can update the T_PERSON table with the inferred departments and faculties.
	Because we have all the information in the T_PERSON_FACULTY_COUNTS table (i.e. what people to update - this is because of the IS NULL SELECTION in the T_PERSON_FACULTY CTE, and what to update them with), 
	we can do it with a (simple) UPDATE statement.

	In the following snippet, we use the UPDATE FROM syntax - this is a non-standard SQL syntax (not supported in the ANSI SQL), but it is supported by SQLite.
	This allows us to drive the update from a (named) subquery, which we can reference in the SET clause of the UPDATE statement.

	One possible ANSI SQL-compatible way would be LEFT OUTER JOIN combined with a COALESCE function, but that would be much more verbose and less readable.
	This approach would also require us to make a new table and then drop the old one, which might be too space-consuming for large tables.
*/
UPDATE T_PERSON
SET FACULTY_ID = T_PERSON_INFERRED_FACULTIES."FACULTY_IDS",
	"DEPT_ID" = T_PERSON_INFERRED_FACULTIES."DEPARTMENT_IDS"
FROM T_PERSON_INFERRED_FACULTIES
WHERE T_PERSON.PERSON_ID = T_PERSON_INFERRED_FACULTIES.PERSON_ID;

SELECT COUNT(*) FROM T_PERSON WHERE FACULTY_ID IS NOT NULL;

-- The inference in this case added faculty / department annotation to 26019 persons (data from 2024-02-17).
