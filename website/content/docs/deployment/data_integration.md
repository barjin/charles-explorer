---
weight: 20020
title: "Integrating data"
description: "Deploy Charles Explorer locally using Docker Compose."
icon: "article"
date: "2023-09-27T13:50:02+02:00"
lastmod: "2023-09-27T13:50:02+02:00"
toc: true
---

{{< admonition content="This part of the documentation is about importing your data into your running Charles Explorer instance. If you need to run Charles Explorer, check out the [deployment guide](../deploying) first." type="warning" >}}


After successfully deploying the application to our server, we now want to fill it with our data. At the end of this guide, you will have a running Charles Explorer instance with your data.

## Prerequisites
- Running Charles Explorer instance (if you don't have that, go back to the [deployment guide](../deploying)).
- Our data export as a [SQLite3 database file](https://www.sqlite.org/index.html). 
  - If you don't have your data packed up yet, don't worry. This repository contains a sample `explorer.db` file with sample data you can use to try out the app.

## Data integration

The data integration process consists of three steps:

1. Getting our data from our current system into an [SQLite3 database file](https://www.sqlite.org/index.html). At this point, you don't have to adhere to any specific schema.

2. Mapping the data from the SQLite3 database file to the Charles Explorer data model. This step is done by writing a set of SQL queries and transformers that map the data from your database to the Charles Explorer data model.

3. Running the Charles Explorer tooling to import your data into the database. This step is pretty much automatic and doesn't require any manual work - only running the command.

### Gathering the data

The first step is to get your data into an SQLite3 database file. If you already have your data in an SQLite3 database file, you can skip this step. 

There is no schema you have to comply with - a simple clone of your production database is fine. The only requirement is that the database file is in the SQLite3 format - if you're not sure how to do this, you can use a tool like [DB Browser for SQLite](https://sqlitebrowser.org/) to help you.

### Writing transformers

Since there are no requirements for the schema of the database file, we need to map the data from the database file to the Charles Explorer data model. This is done by writing a set of SQL queries and transformers that map the data from your database to the Charles Explorer data model.

All of the logic for this step is contained in the `transformers.ts` file in the root of the repository.

```typescript
{
  // ...
  person: {
    query: `SELECT id, name FROM PEOPLE_IN_MY_DATABASE`
    transformer: (row) => {
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

As you can see on the snippet above, the `transformers.ts` file contains a single object with predefined keys (`faculty`, `department`, `person`, `class`, `programme` and `publication`). Each key represents a single entity in the data model. The value of each key is an object with two subfields: `query` (a string containing a SQL query) and `transformer` (a function that transforms the result of the query into the data model).

While this might seem complicated at first, it's actually quite simple. The `query` field contains a SQL query that will be executed on your SQLite3 database. The `transformer` field contains a function that will be called for each row returned by the query. The function takes a single argument (`row`) that contains the row returned by the query. The function then returns a [Prisma `create` argument](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create-1) that represents the entity in the Charles Explorer data model.

You can take inspiration from the example queries and transformers in the `transformers.ts` file. If you're not sure how to write a query, you can use a tool like [DB Browser for SQLite](https://sqlitebrowser.org/) to help you.

{{< admonition content="Save yourself some time and install a Typescript extension in your IDE. The `transformers.ts` file is loaded with type definitions that will guide you and enable autocomplete and checks." type="info">}}

### Running the importer

After you're done with the `transformers.ts` file, you can run the Charles Explorer tooling to import your data. To do this, run the following command in the root of the repository:

```bash
docker compose --profile=seeder up
```

Not long after running this command, you should see the following screen:

{{< img src="https://gitlab.mff.cuni.cz/barj/charles-explorer/-/wikis/uploads/0a6595867f2f7069f7978edb2a432317/obrazek.png" title="Charles Importer is running the data transformations and feeding the database." horizontal="true" >}}

The **Charles Importer** tool opens your `explorer.db` database file, runs the transformations and feeds them to the database. After the database seeding is done, it also indexes the records in the attached Solr instance, so the full-text search is working. 

The script execution can take anything from 5 to 30 minutes. It should, however, always show comprehensive status messages and loading bars to show what it is up to. After the Importer finishes, your application is ready to go! Go to [http://localhost:8080](http://localhost:8080) and give it a try!

<div align="center">

![obrazek](uploads/852fa6ea2fb0268d698413d3a401d237/obrazek.png)

</div>

{{< admonition content="In case you have encountered any issues in the process, please, let us know in the [GitLab issues](https://gitlab.mff.cuni.cz/barj/charles-explorer/-/issues). Thank you!" type="info" >}}

Your Charles Explorer instance is now fully operational. Do you want to help us with development? Continue to the [development guide](./development.md).