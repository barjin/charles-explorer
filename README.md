<table align="center"><tr><td align="center" width="9999">
    <a href="https://explorer.cuni.cz" align="center">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="./docs/img/logo_dark.png">
          <img alt="Charles Explorer" src="./docs/img/logo.png" width="500">
        </picture>
    </a>
</td></tr></table>

Charles Explorer is a tool for vizualizing, searching and exploring university courses, publications, study programmes and more. It is a part of the [Charles University Information System](https://is.cuni.cz) and is available at [explorer.cuni.cz](https://explorer.cuni.cz).

## Features

- 📚 **Courses** - Search and explore courses, their syllabi, teachers and more.
- 📖 **Publications** - Search and explore publications, their authors and more.
- 🎓 **Study programmes** - Search and explore study programmes, their courses and more.
- 🧑🏼‍🏫 **People** - Search and explore people, their publications, courses and more.

## Built for the web

Unlike many university information systems, Charles Explorer is built for the web with the 21st century in mind.

- ✅ Progressive enhancement (works without JavaScript)
- ✅ Accessibility
- ✅ Responsive design
- ✅ Linked Data intergration
- ✅ Simple internationalization
- and more...

## Integrate with your university

We at Charles Univeristy are fully aware of years-old incremental development of university information systems. That's why we've built Charles Explorer to be easily integrated with any university information system.

All you need is an SQLite export and 10 minutes to write the mapping transformation.

## How to do it?

1. Clone this repository
2. Supply your database url in the `.env` file. 
    - If you don't have a database, you can use the example environment file `.env.prod`. Just rename it to `.env` and you're good to go.
3. Build the services with `docker compose --profile=app build` and `docker compose --profile=seeder build`
4. Run the services with `docker compose --profile=app up`.
    - At this point, you should be able to access the app at `localhost:8080`.
5. Run the seeder with `docker compose --profile=seeder up`.
    - This will populate the database with example data from the database.db file.
    - You can provide your data in the same format (and the transformation script) and it will be imported automatically.
6. You're done! 🎉