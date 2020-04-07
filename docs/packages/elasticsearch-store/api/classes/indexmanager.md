---
title: Elasticsearch Store: `IndexManager`
sidebar_label: IndexManager
---

# Class: IndexManager

Manage Elasticsearch Indicies

## Hierarchy

* **IndexManager**

## Index

### Constructors

* [constructor](indexmanager.md#constructor)

### Properties

* [client](indexmanager.md#client)
* [enableIndexMutations](indexmanager.md#enableindexmutations)
* [esVersion](indexmanager.md#esversion)

### Methods

* [exists](indexmanager.md#exists)
* [formatIndexName](indexmanager.md#formatindexname)
* [formatTemplateName](indexmanager.md#formattemplatename)
* [getMapping](indexmanager.md#getmapping)
* [getTemplate](indexmanager.md#gettemplate)
* [indexSetup](indexmanager.md#indexsetup)
* [isIndexActive](indexmanager.md#isindexactive)
* [migrateIndex](indexmanager.md#migrateindex)
* [putMapping](indexmanager.md#putmapping)
* [updateMapping](indexmanager.md#updatemapping)
* [upsertTemplate](indexmanager.md#upserttemplate)
* [waitForIndexAvailability](indexmanager.md#protected-waitforindexavailability)

## Constructors

###  constructor

\+ **new IndexManager**(`client`: Client, `enableIndexMutations`: boolean): *[IndexManager](indexmanager.md)*

*Defined in [index-manager.ts:14](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L14)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`client` | Client | - |
`enableIndexMutations` | boolean |  ts.isTest |

**Returns:** *[IndexManager](indexmanager.md)*

## Properties

###  client

• **client**: *Client*

*Defined in [index-manager.ts:12](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L12)*

___

###  enableIndexMutations

• **enableIndexMutations**: *boolean*

*Defined in [index-manager.ts:14](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L14)*

___

###  esVersion

• **esVersion**: *number*

*Defined in [index-manager.ts:13](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L13)*

## Methods

###  exists

▸ **exists**(`index`: string): *Promise‹boolean›*

*Defined in [index-manager.ts:29](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L29)*

Verify the index exists

**Parameters:**

Name | Type |
------ | ------ |
`index` | string |

**Returns:** *Promise‹boolean›*

___

###  formatIndexName

▸ **formatIndexName**(`config`: [IndexConfig](../interfaces/indexconfig.md), `useWildcard`: boolean): *string*

*Defined in [index-manager.ts:35](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L35)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`config` | [IndexConfig](../interfaces/indexconfig.md) | - |
`useWildcard` | boolean | true |

**Returns:** *string*

___

###  formatTemplateName

▸ **formatTemplateName**(`config`: [IndexConfig](../interfaces/indexconfig.md)): *string*

*Defined in [index-manager.ts:56](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [IndexConfig](../interfaces/indexconfig.md) |

**Returns:** *string*

___

###  getMapping

▸ **getMapping**(`index`: string): *Promise‹any›*

*Defined in [index-manager.ts:245](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L245)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | string |

**Returns:** *Promise‹any›*

___

###  getTemplate

▸ **getTemplate**(`name`: string, `flatSettings`: boolean): *Promise‹any›*

*Defined in [index-manager.ts:316](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L316)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`flatSettings` | boolean |

**Returns:** *Promise‹any›*

___

###  indexSetup

▸ **indexSetup**(`config`: [IndexConfig](../interfaces/indexconfig.md)): *Promise‹boolean›*

*Defined in [index-manager.ts:71](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L71)*

Safely setup a versioned Index, its template and any other required resouces

**`todo`** this should handle better index change detection

**Parameters:**

Name | Type |
------ | ------ |
`config` | [IndexConfig](../interfaces/indexconfig.md) |

**Returns:** *Promise‹boolean›*

a boolean that indicates whether the index was created or not

___

###  isIndexActive

▸ **isIndexActive**(`index`: string): *Promise‹boolean›*

*Defined in [index-manager.ts:155](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L155)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | string |

**Returns:** *Promise‹boolean›*

___

###  migrateIndex

▸ **migrateIndex**(`options`: [MigrateIndexOptions](../interfaces/migrateindexoptions.md)): *Promise‹any›*

*Defined in [index-manager.ts:174](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L174)*

Perform an Index Migration

**IMPORTANT** This is a potentionally dangerous operation
and should only when the cluster is properly shutdown.

**`todo`** add support for timeseries and templated indexes

**`todo`** add support for complicated reindexing behaviors

**Parameters:**

Name | Type |
------ | ------ |
`options` | [MigrateIndexOptions](../interfaces/migrateindexoptions.md) |

**Returns:** *Promise‹any›*

___

###  putMapping

▸ **putMapping**(`index`: string, `type`: string, `properties`: any): *Promise‹any›*

*Defined in [index-manager.ts:253](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L253)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | string |
`type` | string |
`properties` | any |

**Returns:** *Promise‹any›*

___

###  updateMapping

▸ **updateMapping**(`index`: string, `type`: string, `mapping`: any, `logger`: Logger): *Promise‹void›*

*Defined in [index-manager.ts:273](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L273)*

Safely update a mapping

**WARNING:** This only updates the mapping if it exists

**Parameters:**

Name | Type |
------ | ------ |
`index` | string |
`type` | string |
`mapping` | any |
`logger` | Logger |

**Returns:** *Promise‹void›*

___

###  upsertTemplate

▸ **upsertTemplate**(`template`: any, `logger?`: ts.Logger): *Promise‹void›*

*Defined in [index-manager.ts:327](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L327)*

Safely create or update a template

**Parameters:**

Name | Type |
------ | ------ |
`template` | any |
`logger?` | ts.Logger |

**Returns:** *Promise‹void›*

___

### `Protected` waitForIndexAvailability

▸ **waitForIndexAvailability**(`index`: string): *Promise‹void›*

*Defined in [index-manager.ts:353](https://github.com/terascope/teraslice/blob/f95bb5556/packages/elasticsearch-store/src/index-manager.ts#L353)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | string |

**Returns:** *Promise‹void›*
