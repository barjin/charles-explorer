---
weight: 10020
title: "Search"
description: "Charles Explorer allows you to search multiple entity types using the same interface."
icon: "article"
date: "2023-09-27T13:50:02+02:00"
lastmod: "2023-09-27T13:50:02+02:00"
toc: true
---

When accessing the page for the first time, the application will generate a random query and will show you search results for it. In the left part of the screen, you can see the search results under the search box with the current generated query, on the right side, you see a word cloud with the university faculties connected to the query.

On the first access, the application also reads your browser settings and sets the application language to the preferred localization version. If this is not correct for any reason, you can easily change the app language by clicking the country flag above the top right corner of the search box.

### Search Suggestions

After clicking and typing into the search box in the left top part of the screen, the application will start giving you search suggestions in the dropdown list. In the very end of the dropdown list, there is also a short history of your searches.

{{<img src="/images/user_guide/search.png" title="Searching for a keyword opens a suggestion list">}}

The suggestion / history list can be navigated by arrow keys. A given suggestion / history entry can be submitted by Enter or by clicking it. The original query will always be the first entry in the list and can be submitted by pressing Enter or by clicking the "Magnifier" icon right of the search box.

After submitting the query, the application will load the search results. This can take a few seconds, based on the current usage of the application and the complexity of the query. While the results are loading, the application will show a progress bar in the top part of the screen and the results are replaced with "skeleton loaders" to convey the information that the search results are loading.

After the search results are retrieved, they are displayed below the search box in a list:

{{<img src="/images/user_guide/search_results.png" title="A successful search returns results">}}

The search results list is ordered based on the relevance of the entity to the current query. Each of the results list items has a title (localized entity name), a subtitle (name of the affiliated faculty), and a small color-coded icon in the left part of the result.

The color denotes the faculty and matches the faculty color in the word cloud on the right side of the screen, and the small white icon tells us of what type (class / person / publication / study program) is this result. The faculty is denoted twice (with the color and with the actual subtitle) to make Charles Explorer accessible for people with color vision deficiency.

By default, Charles Explorer will search for **classes** relevant to the current query. To search for another type of an entity, click the respective entity icon below the search box.