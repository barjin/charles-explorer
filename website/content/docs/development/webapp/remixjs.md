---
title: "Remix.js primer"
description: "Understand the core concepts of the Remix.js framework used in the Charles Explorer web application."
icon: code
images: []
weight: 30051
---

The Charles Explorer web application is fully written in TypeScript. It is built on top of the [Remix.js framework](https://remix.run/), which is a framework for building server-rendered React applications.

Because of the use of Remix.js, the Charles Explorer web application is structured differently than a typical React application. In this section, we will go over the most important concepts of Remix.js.

### Loader functions

While most applications are structured to separate the frontend and the backend, Remix.js allows developers to write both the frontend and the backend in the same file. The result is a more cohesive application and better developer experience, where the frontend and the backend parts can use the same TypeScript types and share the same code.

A Remix.js page that's loading data from the backend and displaying it to the user might look like this:

```typescript
import { useLoaderData } from 'remix';

// This function is always executed on the server.
export function loader() {
    return { title: "This data is coming from the backend!" };
}

// This function renders the frontend component.
export default function Website() {
    const data = useLoaderData(); // retrieve the data from the loader function

    return (
        <div>
            <h1>Hello world!</h1>
            <p>{data.title}</p>
        </div>
    );
}
```

### Routes

Remix.js uses a file-based routing system. This means that each page is represented by a single file. For example, the `/about` page is represented by the `website/routes/about.tsx` file. The `/about/team` page is represented by the `website/routes/about/team.tsx` file.

It also supports dynamic routes. For example, the `/person/:id` page is represented by the `website/routes/person/$id.tsx` file. The `id` parameter is then available in the `useParams()` hook.
