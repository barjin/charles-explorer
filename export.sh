#!/bin/bash
yum install sqlite -y

table_names=(FACULTY DEPARTMENT PERSON CLASS PUBLICATION PUBLICATION_AUTHOR STUDY_PROGRAMME STUDY_PROGRAMME_CLASS PUBLICATION_KEYWORDS)

set NLS_LANG=CZECH_CZECH REPUBLIC.AL32UTF8
export NLS_LANG="CZECH_CZECH REPUBLIC.AL32UTF8"

for table_name in "${table_names[@]}"
do
echo "Exporting $table_name"
(
sqlplus -S CHARLESEXPLORER/$DBPASS@dbs-studuk.int.is.cuni.cz:1521/studuk <<EOF
set termout off
set long 10000
set echo off
set serveroutput on
set feedback off
set markup csv on
spool /sql/$table_name.csv
-- Specify the date format explicitly
SELECT * FROM $table_name;
EOF
) > /dev/null
done

## Strip first empty line from csv files

for table_name in "${table_names[@]}"
do
echo "Stripping $table_name"
tail -n +2 "/sql/$table_name.csv" > "/sql/$table_name.tmp" && mv --force "/sql/$table_name.tmp" "/sql/$table_name.csv"
done

## Run sqlite and import data from the csv files

for table_name in "${table_names[@]}"
do
echo "Importing $table_name"
sqlite3 /sql/charles-explorer.db <<EOF
.mode csv
.import /sql/$table_name.csv $table_name
EOF
done
