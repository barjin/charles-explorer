-- This file contains sql statements that update the database data based on the user requests. All the statements in this file should be idempotent and not raise errors in any case (silent fail at most).

-- doc. PaedDr. Zdeněk Konopásek Ph.D. doesn't have affiliation with the Faculty of Humanities - the existing classes are some remnant of the old system - we can remove the 
DELETE FROM "_FacultyToPerson" WHERE "B"='1845501456778964';

UPDATE "Person" SET "type"='EXTERNAL' WHERE "id"='1845501456778964';

DELETE FROM "Class" WHERE "id"='YDA203';
DELETE FROM "Class" WHERE "id"='YDA229';