---
title: "Routes"
description: "Learn how the Charles Explorer web application is structured and how it communicates with the other parts of the project."
icon: code
images: []
weight: 30053
---

The `app/routes` folder defines **application routes** according to the [Remix.js specification](https://remix.run/docs/en/main/guides/routing). Each `.tsx` file in this folder represents a single (possibly nested) route in the application. These files combine components from the `components` folder into pages served by the application. The `index.tsx` file serves as the entry point of the application.

## `/$category/$id.tsx`
Contains the page for displaying the detail of a single entity. The `$category` and `$id` parameters are dynamic and represent the category and ID of the entity. 

For example, the `https://explorer.cuni.cz/class/NSWI130` page is represented by this file. 

## `/$category/index.tsx`
Rendered when user accesses the `https://explorer.cuni.cz/class` page. This route performs search based on the `?query` parameter. This file contains logic for performing the search and rendering the search results. 

Example usage: `https://explorer.cuni.cz/class?query=meteorology`.

## `/$category/[sitemap.xml].tsx`
This route contains the logic for generating the sitemap. It's used by search engines to discover the pages of the application. Because of the high volumes of data contained in Charles Explorer, the sitemaps are paginated. 

Example usage: `https://explorer.cuni.cz/class/sitemap.xml?p=1`.

## `/$category/suggest.tsx`
API-only route for the search bar suggestions. This route is used by the search bar to fetch suggestions based on the user's input. 

Example usage: `https://explorer.cuni.cz/class/suggest?q=meteorology`.

## `/index.tsx`
The root route of the application. This route is rendered when the user accesses the `https://explorer.cuni.cz` page. It contains the logic for rendering the home page of the application. 

## `/[sitemap.xml].tsx`
This route contains the root logic for generating the sitemap. It's used by search engines to discover the pages of the application. This route only returns sitemap index containing links to the individual sitemaps. 

Example usage: `https://explorer.cuni.cz/sitemap.xml`.
