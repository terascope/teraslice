---
title: xLucene Translator
sidebar_label: xLucene Translator
---

> Translate xlucene query to database queries


### Note on geo shape opensearch queries
Opensearch has a limitation on the degree of precision based on how they store [geoshape](https://docs.opensearch.org/latest/mappings/supported-field-types/geo-shape/) data. Therefore exact matching of polygons or multi-polygons with the various geo relations (ie within, contains) is inconsistent.  The intersect relation seems the most reliable method to find a geoshape using the exact same geoshape in the query, though other data that intersect will also be there in the results.
