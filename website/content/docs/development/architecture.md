---
weight: 30020
title: "Project architecture"
description: "Top-level architecture of the Charles Explorer application."
icon: code
images: []
---

Structured as a monorepo, all parts of the project are contained in the same repository in the `packages` folder. Furthermore, the root folder contains project-wide configuration files for the ESLint linter (`eslintrc.js`), the Yarn package manager dependency declarations (`package.json`, `yarn.lock`), and the `tsc` transpiler configuration (`tsconfig.json`). It also contains a sample SQLite3 database for seeding the application (`explorer.db`).

The run environment then consists of a Docker Compose setup including 4 services:

{{< img src="/images/dev_guide/diagram.svg" title="A diagram describing the top-level project architecture" horizontal="true">}}

### Remix.js application

First is the `web` service, which is the main web application. This container's image is built from the `dockerfiles/Dockerfile.app` file and contains the production build of the main Remix.js application. This is also the only service that the client is supposed to be communicating with via HTTP. 

If run with `docker compose up`, the application is available on port `8080`.

### PostgreSQL database

The `db` service is built on top of the official [postgres Docker image](https://hub.docker.com/_/postgres) and runs this image basically without change. It mounts the `postgres-data` folder from the repository root for data storage, easier debugging, and more transparent recovery in case the container shuts down.

The main application communicates with this service via the postgres protocol on port `5432` through the internal docker network. For safety reasons, this port is not exposed to the host machine.

### Apache Solr 

The `solr` service is built on top of the official [Solr Docker image](https://hub.docker.com/_/solr). It mounts the `solr-data` folder from the repo root as the index storage. The `solr-data` folder by default contains presets and other files (e.g., stopword files, text field configurations for different locales, etc.).

The main application communicates with this service via the Solr protocol on port `8983` through the internal docker network. For safety reasons, this port is not exposed to the host machine.

### Nanoker

The `ker` service for generating the keywords for the word cloud is running a custom Docker image, built from the `packages/nanoker/Dockerfile` file. This package (`packages/nanoker`) is a simplified Python3 port of the [Ker application](https://github.com/ufal/ker) by [Mgr. Jindřich Libovický PhD.](https://github.com/jlibovicky) of ÚFAL, MFF. 

All credits go to him and the [MorphoDiTa team](https://ufal.mff.cuni.cz/morphodita).

The main application communicates with this service via the HTTP protocol on port `8547`.

## Auxiliary services

The root `docker-compose.yml` file contains definitions for two more services.

The `solr-user-fix` is a one-time service designed for fixing ownership of the aforementioned `solr-data` folder contents. There is a [well-known issue](https://stackoverflow.com/questions/63993993/docker-persisted-volum-has-no-permissions-apache-solr) in the official `solr` Docker image that forbids Solr from writing into the mounted volume if the `solr` user is not the folder owner.

The `seed-data` service is running a custom Docker image, built from the `dockerfiles/Dockerfile.importer` file. This service connects to the common Docker network and seeds the Postgres database container and the Solr container with data from the user-modifiable `explorer.db` database file.
