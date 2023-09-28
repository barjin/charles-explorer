---
title: "Project structure"
description: "Learn about the structure of the Charles Explorer web application and how to contribute to it."
icon: code
images: []
weight: 30052
---

The web application source code is structured as a Node.js NPM-style package. It contains several important files and directories:

- `package.json`: This file contains package metadata.
- `tsconfig.json`: This file contains TypeScript compiler configuration.
- `tailwind.config.js` and `postcss.config.js`: These files are for configuring the Tailwind CSS framework.
- `remix.config.js`: The Remix.js configuration is located here.

Aside from the files listed above, the project contains the following directories:

## `/styles`

The `styles` folder contains global CSS stylesheets. If you need to add a new CSS rule, this is the place to do it. Other CSS files in the project are generated automatically using Tailwind CSS and should not be modified manually.

## `/public`

The `public` folder contains static assets such as images and localization files that the application serves. To add a new localization, follow the structure of existing localization files (e.g., `public/locales/cs/common.json`).

## `/app`

The `app` folder contains the main application code:

### `app/components`

The `components` folder contains React components used in the application. Components are organized into folders based on their purpose:

- `GlobalLoading.tsx`: This component is used to display a loading indicator when the application is loading data from the backend.
- `RelatedItem.tsx`: Heavily reused component for displaying the link to either a search result or a related entity.
- `Modal`
    - `Modal.tsx`: This component is used to display a modal dialog with the information about the application.
- `Topbar`
    - `Topbar.tsx`: Renders the control buttons above the search bar.
- `ItemDetail`
  - `ItemHeader.tsx`: Renders the header of the item detail page.
  - `RelatedEntities.tsx`: Renders the list related entities of the item detail page.
  - `TextField.tsx`: Renders a single text field of the item detail page.
- `Search`
  - `SearchBar.tsx`: Renders the search bar - an input field with a search button and a suggestion dropdown.
  - `SuggestionItem.tsx`: Renders a single suggestion item in the search bar dropdown.
  - `SearchTool.tsx`: Renders the search tool - the search bar and a set of buttons for filtering the search results.
- `WordCloud`
    - `CytoscapeWrapper.ts`: An abstraction over the Cytoscape.js library for orchestrating the word cloud visualization.
    - `DummyKeywords.ts`: An array with dummy keywords used for testing and improving the word cloud visualization.
    - `WordCloud.tsx`: Renders the word cloud visualization based on the current search results.

###  `app/routes`

The `routes` folder defines **application routes** according to the [Remix.js specification](https://remix.run/docs/en/main/guides/routing). Each `.tsx` file in this folder represents a single (possibly nested) route in the application. These files combine components from the `components` folder into pages served by the application. The `index.tsx` file serves as the entry point of the application.

Detailed description of the individual route files is in the separate [Routes](../routes) section.

### Other files

- `app/assets`: The `assets` folder contains static assets (SVG files) used in application components. These are imported directly into the code.

- `app/connectors`: The `connectors` folder contains modules used to interface the application with backend services, including the Prisma client and a minimalistic Solr client implementation.

- `app/utils`: The `utils` folder contains utility functions, primarily for data transformations, used throughout the application. There's no specific structure for this folder, as it's not expected to grow very large.

- `app/i18n.ts`: This file contains internationalization logic. It's used to load localization files from the `public` folder and provides the `t` function for translating the application. To add a new localization, register it in the `i18n.ts` file.

Other files in the `app` folder are either automatically generated or used for application configuration and typically aren't relevant for project maintainers.
