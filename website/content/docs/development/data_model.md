---
weight: 30030
title: "Data model & Schema"
description: "Find out how Charles Explorer stores its data."
icon: code
images: []
---

Charles Explorer uses a relational database (the `db` docker compose service from the [architecture part](../architecture)) to store its data. 
This part of the documentation describes the data model of Charles Explorer and what data is stored in the database.

{{< img src="/images/dev_guide/class_diagram.png" title="A top-level view of the Charles Explorer data model." horizontal="true">}}

## Classes 

The following section describes the data classes used in Charles Explorer, as defined in the [schema.prisma](https://gitlab.mff.cuni.cz/barj/charles-explorer/-/blob/master/packages/prisma/schema.prisma?ref_type=heads) file in the `packages/prisma` directory of the Charles Explorer repository. This follows the way that the data is used in the application, not the way it is stored in the database.

For details about the database schema, see the [database schema](#database-schema) section of the documentation.

Each class is described by its properties and connected entities. The properties are the actual data stored in the database, while the connected entities are references to other classes.

### Text

The "Text" model represents textual content, such as names, abstracts, keywords, or syllabi. It is a fundamental entity used to store and manage various textual information within the system. This model is linked to many other entities to associate textual data with specific classes, departments, faculties, people, publications, and programmes.

The reason why it is a separate entity is that it allows us to store the same text in multiple languages. For example, the name of a publication can be stored in English and Czech at the same time.

#### Properties 

- `id` - The unique identifier of the text.
- `lang` - The language of the text as a lowercase ISO 639-1 code.
- `value` - The actual text value.

### Department

The "Department" model represents academic departments or organizational units within an institution. It stores department names, abbreviations, and associations with faculties, classes, programs, people, and publications.

The `Department` organization unit should be used to represent an organizational unit that's a part of a `Faculty`. The details are up to the user, but a good rule of thumb is that a `Department` should be a part of a `Faculty` if it sponsors classes or study programmes.

#### Properties
- `id` - The unique identifier of the department.
- `names` - The names of the department in (possibly) different languages. List of `Text` objects.
- `abbreviations` - The abbreviations of the department in (possibly) different languages. List of `Text` objects.

#### Connected entities
- `faculties` - The faculties that this department is a part of. List of `Faculty` objects.
    - **Note:** While the model allows for the department to be a part of multiple faculties, it might cause user confusion. It's probably a better practice to keep the department in a single faculty, perhaps the one that it's most closely associated with.
- `classes` - The classes that this department sponsors. List of `Class` objects.
- `programmes` - The study programmes that this department sponsors. List of `Programme` objects.
- `people` - The people that are part of this department. List of `Person` objects.
- `publications` - The publications that this department sponsors. List of `Publication` objects.

### Faculty

The "Faculty" model represents academic faculties or schools within an institution. It stores faculty names, abbreviations, and associations with departments, classes, programs, people, and publications.

The `Faculty` organization unit should be used to represent an organizational unit that's a part of the entire educational institution. The details are up to the user, but there should be some limit on the total number of `Faculty` objects in the system - the Charles University has 17 faculties, for example.

While there are no performance issues with having a large number of `Faculty` objects, it might cause user confusion, as the Faculty is the main grouping unit in the application.

#### Properties
- `id` - The unique identifier of the faculty.
- `names` - The names of the faculty in (possibly) different languages. List of `Text` objects.
- `abbreviations` - The abbreviations of the faculty in (possibly) different languages. List of `Text` objects.

#### Connected entities
- `departments` - The departemnts that are part of this faculty. List of `Department` objects.
- `classes` - The classes that this faculty sponsors. List of `Class` objects.
- `programmes` - The study programmes that this faculty sponsors. List of `Programme` objects.
- `people` - The people that are part of this faculty. List of `Person` objects.
- `publications` - The publications that this faculty sponsors. List of `Publication` objects.

### Class

The "Class" model describes academic classes or courses offered within an educational institution. It contains information about class names, syllabi, annotations, as well as relationships with departments, faculties, people, programs, and associated textual content.

#### Properties

- `id` - The unique identifier of the class.
- `names` - The names of the class in (possibly) different languages. List of `Text` objects.
- `syllabus` - The syllabus of the class in (possibly) different languages. List of `Text` objects.
- `annotation` - The annotation of the class in (possibly) different languages. List of `Text` objects.

#### Connected entitites
- `departments` - The departments that sponsor the class. List of `Department` objects.
- `faculties` - The faculties that sponsor the class. List of `Faculty` objects.
- `people` - The people that sponsor the class. List of `Person` objects.
- `programmes` - The study programmes this class is a part of. List of `Programme` objects.

### Person

The "Person" model represents individuals, such as faculty members, or researchers, within the academic context. It includes information about names, private identifiers, and associations with classes, departments, faculties, publications, and programs.

#### Properties
- `id` - The unique identifier of the person.
- `private_id` - The private identifier of the person. This field can be used as an identifier for the person for joining data from other sources. It is not displayed to the user.
- `names` - The names of the person in (possibly) different languages. List of `Text` objects.

#### Connected entities
- `classes` - The classes that this person sponsors. List of `Class` objects.
- `departments` - The departments that this person is part of. List of `Department` objects.
- `faculties` - The faculties that this person is part of. List of `Faculty` objects.
- `programmes` - The study programmes that this person sponsors. List of `Programme` objects.
- `publications` - The publications that this person has authored. List of `Publication` objects.

### Publication

The "Publication" model is used to manage information about academic publications, including research papers, articles, or books. It stores publication names, publication year, authors, abstracts, keywords, and associations with people, faculties, and departments.

#### Properties
- `id` - The unique identifier of the publication.
- `names` - The names of the publication in (possibly) different languages. List of `Text` objects.
- `year` - The year of the publication.
- `authors` - Comma separated list of names of the publication authors. This is a fallback option for publications authored by people not present in the system (e.g. external collaborators).
- `abstract` - The abstract of the publication. List of `Text` objects.
- `keywords` - The keywords associated with the publication. List of `Text` objects.

#### Connected entities
- `people` - The people who authored the publication. List of `Person` objects.
- `faculties` - The faculties associated with the publication. List of `Faculty` objects.
- `departments` - The departments associated with the publication. List of `Department` objects.


### Programme

The "Programme" model represents academic programs or courses of study offered by an institution. It includes program names, supported languages, program types, forms, and associations with departments, faculties, people, other programs, classes, and program profiles. This entity provides comprehensive information about academic programs within the system.

#### Properties
- `id` - The unique identifier of the programme.
- `names` - The names of the programme in (possibly) different languages. List of `Text` objects.
- `languages` - The languages this programme is offered in. List of ISO 639-1 codes.
- `type` - The type of the programme. This is up to the user, but it should differentiate between different types of degrees (e.g. bachelor's, master's, doctoral, etc.).
- `form` - The form of the programme. This is also up to the user, but it should differentiate between different forms of study (e.g. full-time, part-time, distance, etc.).
- `profiles` - The graduate profiles for the programme. A graduate profile is a description of the skills and knowledge that a graduate of the programme should have. This is used to index the programmes by their content. List of `Text` objects.

#### Connected entities
- `departments` - The departments that offer the programme. List of `Department` objects.
- `faculties` - The faculties that offer the programme. List of `Faculty` objects.
- `people` - The people associated with the programme. List of `Person` objects.
- `programmes` - Other programmes related to this programme. List of `Programme` objects.
- `classes` - The classes associated with the programme. List of `Class` objects.

## Database schema

As mentioned earlier, Charles Explorer uses Prisma ORM to retrieve data from the relational PostgreSQL database. 

The `schema.prisma` definition itself is alone enough to create the database schema, and by running the `prisma migrate dev` command, the database schema is automatically created and updated.

Therefore, the inner structure of the database is not described in detail in this documentation. While this approach might not offer the most optimal performance, it allows for a very simple and straightforward development process and data integration, which is one of the main goals of Charles Explorer.