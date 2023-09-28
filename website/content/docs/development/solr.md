---
title: "Search & Indexing"
description: "Find out how the search and indexing works in Charles Explorer."
icon: code
images: []
weight: 30040
---

The search and indexing in Charles Explorer is powered by [Apache Solr](https://lucene.apache.org/solr/). Solr is a search platform that is built on top of [Apache Lucene](https://lucene.apache.org/), which is a Java library for full-text search. Solr provides a REST-like API for indexing and searching data.

## Terminology

Before we dive into the details of how the search and indexing works, let's define some terminology that will be used throughout this document.

### Document

A document is a single entity in the search index. In Charles Explorer, a document represents a single entity in the data model (e.g. a person, a publication, a department, etc.). A document is composed of multiple **fields**.

### Field

A field is a single property of a document. In Charles Explorer, a field represents a single property of an entity in the data model (e.g. the **name of a person**, the **course syllabus**, etc.). 

## Configuration

While Apache Solr offers reasonable search capabilities out of the box, we need to do some additional work to make the search work well for Czech language. All the configuration for this is contained in the `solr-data/data/configsets/sharedConfig/conf` directory.

### `managed-schema.xml`

The `managed-schema.xml` file contains the schema of the data that is indexed in the Solr instance.

#### Field types
One of the entities defined in the `managed-schema.xml` file is the `fieldType`. For example, let's look at the `text_cz` custom field definition:

```xml
<fieldType name="text_cz" class="solr.TextField" positionIncrementGap="100">
    <analyzer>
        <charFilter class="solr.HTMLStripCharFilterFactory"/>
        <charFilter class="solr.MappingCharFilterFactory" mapping="mapping-FoldToASCII.txt"/>
        <tokenizer name="classic"/>
        <filter name="lowercase"/>
        <filter words="lang/stopwords_cz.txt" ignoreCase="true" name="stop"/>
        <filter name="czechStem"/>
    </analyzer>
</fieldType>
```

The contents of the `<analyzer>` tag describe the steps that are taken when indexing a document. The steps are taken in the order they are defined in the file. The steps are:

1. `HTMLStripCharFilterFactory` - removes HTML tags from the document
2. `MappingCharFilterFactory` - converts accented characters to ASCII characters using the `mapping-FoldToASCII.txt` file
3. `tokenizer` - tokenizes the document using the `ClassicTokenizerFactory`, splitting the document into words
4. `lowercase` - converts all words to lowercase
5. `stop` - removes stop words from the document using the `stopwords_cz.txt` file
6. `czechStem` - stems the words using the `CzechStemFilterFactory`

During indexing, the document is passed through all of these steps. The result of the last step (stemmed tokens) is then stored in the index.

When querying the index, the query is passed through the same steps and compared to the stored tokens. This way, we can find documents that contain the same words, even if they are in a different form or context.

The `text_en` field type is defined in a similar way.

#### Fields

Based on the field types, we can define the fields that are part of a document. For example, every **document** in the Charles Explorer Solr instance has the following **fields**:

```xml
<field name="id" type="string" multiValued="false" indexed="true" required="true" stored="true"/>
<field name="lvl0_cs" type="text_cz" uninvertible="true" indexed="true" stored="true"/>
<field name="lvl1_cs" type="text_cz" uninvertible="true" indexed="true" stored="false"/>
<field name="lvl2_cs" type="text_cz" uninvertible="true" indexed="true" stored="false"/>
<field name="lvl0_en" type="text_en" uninvertible="true" indexed="true" stored="true"/>
<field name="lvl1_en" type="text_en" uninvertible="true" indexed="true" stored="false"/>
<field name="lvl2_en" type="text_en" uninvertible="true" indexed="true" stored="false"/>
```

Aside from the required `id` field, there are 6 fields that represent the names of the document in different languages and levels of detail. 

##### Language

We can see that the fields `lvln_cs` are using the `text_cz` field type, while the fields `lvln_en` are using the `text_en` field type. This means that the Czech names of the document will be indexed using the Czech analyzer, while the English names of the document will be indexed using the English analyzer. 

This helps improving the search performance, as the analyzer can be optimized for a specific language and the search results won't be polluted by documents matching the query only because of mangled words.

##### Multiple levels

We can also see that the document contains multiple "levels" of fields for each language. This is because every document in the Charles Explorer index can contain multiple text fields with varying levels of importance. 

For example, a search for `Meteorology` should first return classes that have `Meteorology` in their name and only then the ones that mention `Meteorology` somewhere in their syllabi. This can be achieved by storing the name of the class in the `lvl0` field and the syllabus in the `lvl1` field.

##### Stored

The `stored` attribute of the field definition determines whether the field is stored verbatim in the index. This means that the field can be returned directly when querying the index.

By default, only the `id` and `lvl0_cs` / `lvl0_en` fields are stored. This is useful for the suggester functionality, as it only needs to return the name of the document.

It's important to think about which fields should be stored, as storing a field increases the size of the index.

## Using the index

The Solr instance exposes a REST-like HTTP API that can be used to index and query the data. Parts of the Charles Explorer backend use this API via the [`solr-client`](https://gitlab.mff.cuni.cz/barj/charles-explorer/-/tree/master/packages/solr-client?ref_type=heads) package, which is a very thin wrapper around the Solr API.

In case you want to make any changes to the search logic, please consult the JSDoc documentation in the [`solr-client`](https://gitlab.mff.cuni.cz/barj/charles-explorer/-/tree/master/packages/solr-client?ref_type=heads) package.