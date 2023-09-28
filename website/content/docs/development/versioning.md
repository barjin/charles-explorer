---
title: "Code versioning"
description: "Read about how we manage the code of Charles Explorer."
icon: code
weight: 30070
images: []
---

As with any software project, we need to keep track of the code and its changes. We use Git for this purpose. The code is hosted on the Charles University GitLab.

The project repository is currently available at [https://gitlab.mff.cuni.cz/barj/charles-explorer](https://gitlab.mff.cuni.cz/barj/charles-explorer). The only "main" branch is `master`, which is the default branch. All other branches are considered temporary and should be deleted after merging.

## Semantic commits

A closer look at the commit history reveals that the commit messages follow a certain pattern. This is not a coincidence - we use [semantic commits](https://www.conventionalcommits.org/en/), which are a set of rules for writing commit messages. The main idea is to make the commit messages more readable and understandable, which is especially useful when looking at the commit history.

## CI / CD scripts

{{< admonition content="This section is specific only to the **Charles University** instance. The information here is of little use for Charles Explorer instances running in other environments." type="info" >}}

The project uses GitLab's CI / CD pipelines for automated deployment. The pipelines are defined in the `.gitlab-ci.yml` file in the root of the repository. 

### `deploy`
The `deploy` job is triggered on every push to the `master` branch. It's purpose is to rebuild the production application on [https://explorer.cuni.cz](https://explorer.cuni.cz) every time there are changes to the `master` branch. 

This way, we don't have to manually rebuild the application every time we want to deploy a new version.

Under the hood, the `deploy` job connects to the server via SSH and runs a SSH forced command (based on the private key).

### `data-update`
The `data-update` job can be triggered manually. It also runs on every 11th day of a new month at 3AM (CET) via Pipeline Schedules. It's purpose is to update the data in the production application. Internally, this fetches the latest data from the Charles University Information System (SIS) and updates the database and the Solr index.
