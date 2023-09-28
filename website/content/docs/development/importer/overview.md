---
title: "Overview"
description: "Learn how the Charles Explorer data pipeline works and how to use it."
icon: code
images: []
weight: 30061
---

This part of the documentation describes the Charles Importer script. The Charles Importer is a TypeScript program that reads data from a SQLite3 database and using user-defined transformations and mappings, it writes the data to the Charles Explorer PostgreSQL database and the Solr search index.

## Top-level view

By supplying the script with the `explorer.db` SQLite3 database and a set of transformations, the user can import data into the Charles Explorer PostgreSQL database and the Solr search index. 

As an example, let's assume the **explorer.db** file contains a table called "People":
| NAME | ID |
| --- | --- |
| John Doe | 123 |
| Jane Doe | 456 |

The user can then define a transformation that will map the "People" table to the "Person" table in the Charles Explorer PostgreSQL database. 

The transformation will look something like this:
```typescript
{
  // ...
  person: {
    query: `SELECT id, name FROM PEOPLE` // this is the SQL query that will be executed on the SQLite3 database above
    transformer: (row) => { // row is a single row from the result of the SQL query above
      return {
        id: row.id,
        name: {
          create: {
            value: row.name
            lang: "cs"
          }
        }
      }
    }
  }
  //...
}
```

The Charles Importer will then execute the SQL query and for each row, it will execute the transformer function. The result of the transformer function will be written to the Charles Explorer PostgreSQL database.

However, this is not so simple, as there are entities with cyclic dependencies - most notably the "study programme" entity, which can contain references to other (similar) study programmes. This means that we can't just write the data to the database in the order we read it from the SQLite3 database.