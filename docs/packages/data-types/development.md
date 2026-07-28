---
title: Data Types Development
sidebar_label: Development
---

## Versioning

This repository is set up to allow for versioning of the complete set of data types. Currently there is only a `v1` version. The `LATEST_VERSION` constant in src/types/index.ts is used to indicate the current version (1, 2, etc). This version will be used automatically by the DataType class and can not be overwritten. The mapping at src/types/mappings.ts groups all data type class files of a version under a numerical key (1, 2, etc). All files associated with a certain version should live in a common directory (v1, v2, etc).

## Core classes

- [`DataType`](../api/data-type/classes/DataType) — the entry point. Build one
  from a `DataTypeConfig` (a `version` plus a map of field names to their type
  configs), then convert it with `toESMapping()`, `toGraphQL()`, or
  `toXlucene()`. See [Examples](./overview.md#examples).
- [`BaseType`](../api/types/base-type/classes/default) — the abstract base
  every field type extends. It defines the `toESMapping` / `toGraphQL` /
  `toXlucene` contract that each [field type](./overview.md#field-types) implements.
- [`GroupType`](../api/types/group-type/classes/default) — represents an
  `Object` field together with its dot-notation children as a single nested
  unit (assembled internally, not declared directly).
- [`TupleType`](../api/types/tuple-type/classes/default) — represents a
  `Tuple` field: an ordered set of values, each element its own type.
