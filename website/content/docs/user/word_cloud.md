---
weight: 10040
title: "Word Cloud"
description: "Visualize the faculty affiliations of the query results."
icon: "article"
date: "2023-09-27T13:50:02+02:00"
lastmod: "2023-09-27T13:50:02+02:00"
toc: true
---

{{<admonition content="This part is only relevant for the desktop version of the application, as the mobile version does not render the word cloud due to limited screen space." type="warning">}}

The right side of the screen includes the faculty word cloud. This is a graph view on the faculties affiliated with the query-relevant entities.


{{< img src="/images/user_guide/wordcloud.png" title="The query results for \"java\" are affiliated with three faculties in total" >}}

Each faculty name is rendered in bold. The faculties are using the same color code that is used in the search results items. Around each faculty name, there are keywords relevant to the results from this faculty in the same color. The larger the keyword, the more relevant it is for the results from the respective faculty.

Clicking the word cloud keywords performs a search with the clicked keyword as the query.

The current word cloud implementation is rather stub. For future improvements, there are plans to e.g. render search results in the word cloud and visualize their connections.
