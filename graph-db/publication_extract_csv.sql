.header on
.mode csv

.output publication.csv
SELECT publication_id, pub_year, title FROM PUBLICATION INNER JOIN PUBLICATION_TITLE USING("PUBLICATION_ID") WHERE PUBLICATION.LANGUAGE = PUBLICATION_TITLE.LANGUAGE;

.output person.csv
SELECT coalesce(PERSON_WHOIS_ID, person_id) as PERSON_ID, PERSON_NAME FROM T_PERSON;

.output relations.csv
SELECT PUBLICATION_ID, coalesce(PERSON_WHOIS_ID, person_id) as PERSON_ID from PERSON_PUBLICATION inner join T_PERSON using("PERSON_ID");