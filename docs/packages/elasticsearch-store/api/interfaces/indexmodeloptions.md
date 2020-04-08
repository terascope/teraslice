---
title: Elasticsearch Store: `IndexModelOptions`
sidebar_label: IndexModelOptions
---

# Interface: IndexModelOptions

A list of options that are configured during run time and will always override
the config

## Hierarchy

* **IndexModelOptions**

## Index

### Properties

* [enable_index_mutations](indexmodeloptions.md#optional-enable_index_mutations)
* [logger](indexmodeloptions.md#optional-logger)
* [namespace](indexmodeloptions.md#optional-namespace)

## Properties

### `Optional` enable_index_mutations

• **enable_index_mutations**? : *undefined | false | true*

*Defined in [interfaces.ts:269](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L269)*

Enable index mutations so indexes will be auto created or updated

___

### `Optional` logger

• **logger**? : *Logger*

*Defined in [interfaces.ts:265](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L265)*

The logger to use

___

### `Optional` namespace

• **namespace**? : *undefined | string*

*Defined in [interfaces.ts:261](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L261)*

The namespace that will be prefixed to the name value when generating
the index name or anything else that needs to be namespaced.
