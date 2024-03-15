.header on
.mode csv
.output publication.csv

SELECT publication_id, pub_year, title FROM PUBLICATION INNER JOIN PUBLICATION_TITLE USING("PUBLICATION_ID") WHERE PUBLICATION.LANGUAGE = PUBLICATION_TITLE.LANGUAGE;

.output person.csv
select person_id, person_name from person;

.output relations.csv
select * from person_publication;