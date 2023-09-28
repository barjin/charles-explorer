---
weight: 20010
title: "Installing Charles Explorer"
description: "Deploy Charles Explorer locally using Docker Compose."
icon: "article"
date: "2023-09-27T13:50:02+02:00"
lastmod: "2023-09-27T13:50:02+02:00"
toc: true
---

At the end of this guide, you will have a running Charles Explorer instance on your local machine. In case you already have a running Charles Explorer instance, you can skip this guide and continue to the [Data integration guide](data-integration).

## Prerequisites

In order to run Charles Explorer locally, you will need to have the following installed:
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

Some basic knowledge of Docker and Docker Compose is also required.

While it is possible to run the Charles Explorer instance without Docker, we do not provide any instructions for this, as it is not recommended and not supported.

## Installation

<ol>
<li>
After installing the prerequisites, you can start by cloning the Charles Explorer repository:
<br>

```bash
git clone git@gitlab.mff.cuni.cz:barj/charles-explorer.git
```

<br>

</li>
<li>

Navigate to the `charles-explorer` directory and create a `.env` file with the URL of your Solr instance, Nanoker instance and PostgreSQL database.

Chances are, you don't have any of these - in that case, you can use the supplied `.env.prod` file - just rename it to `.env`.

</li>
<li>

Now, you can run the Charles Explorer instance using Docker Compose:

```bash
docker compose --profile=app up
```

After a while, your Charles Explorer instance should start running on port 8080. However, it won't be very useful yet, as the database doesn't contain the required tables yet. You can see that the underlying services are having a hard time understanding that by looking at the logs of the `docker-compose` command.

{{< img src="https://gitlab.mff.cuni.cz/barj/charles-explorer/-/wikis/uploads/243018f874fe3a2f2b81f061fca34d63/obrazek.png" title="The web application shows an error message." horizontal="true">}}

{{< img src="https://gitlab.mff.cuni.cz/barj/charles-explorer/-/wikis/uploads/3f0f03c20a386eef8d80b50847fee797/obrazek.png" title="The backend console is cluttered with error messages about the missing 'charles_explorer_db' database." horizontal="true">}}


To fix this issue, let's continue to the [Data integration guide](./data_integration.md).
