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

\+ **new IndexManager**(`client`: Client): *[IndexManager](indexmanager.md)*

*Defined in [index-manager.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |

**Returns:** *[IndexManager](indexmanager.md)*

## Properties

###  client

• **client**: *Client*

*Defined in [index-manager.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L12)*

## Methods

###  exists

▸ **exists**(`index`: string): *Promise‹boolean›*

*Defined in [index-manager.ts:25](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L25)*

Verify the index exists

**Parameters:**

Name | Type |
------ | ------ |
`index` | string |

**Returns:** *Promise‹boolean›*

___

###  formatIndexName

▸ **formatIndexName**(`config`: [IndexConfig](../interfaces/indexconfig.md), `useWildcard`: boolean): *string*

*Defined in [index-manager.ts:31](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L31)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`config` | [IndexConfig](../interfaces/indexconfig.md) | - |
`useWildcard` | boolean | true |

**Returns:** *string*

___

###  formatTemplateName

▸ **formatTemplateName**(`config`: [IndexConfig](../interfaces/indexconfig.md)): *string*

*Defined in [index-manager.ts:52](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [IndexConfig](../interfaces/indexconfig.md) |

**Returns:** *string*

___

###  getMapping

▸ **getMapping**(`index`: string): *Promise‹any›*

*Defined in [index-manager.ts:230](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L230)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | string |

**Returns:** *Promise‹any›*

___

###  getTemplate

▸ **getTemplate**(`name`: string, `flatSettings`: boolean): *Promise‹any›*

*Defined in [index-manager.ts:297](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L297)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`flatSettings` | boolean |

**Returns:** *Promise‹any›*

___

###  indexSetup

▸ **indexSetup**(`config`: [IndexConfig](../interfaces/indexconfig.md)): *Promise‹boolean›*

*Defined in [index-manager.ts:67](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L67)*

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

*Defined in [index-manager.ts:140](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L140)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | string |

**Returns:** *Promise‹boolean›*

___

###  migrateIndex

▸ **migrateIndex**(`options`: [MigrateIndexOptions](../interfaces/migrateindexoptions.md)): *Promise‹any›*

*Defined in [index-manager.ts:159](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L159)*

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

*Defined in [index-manager.ts:239](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L239)*

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

*Defined in [index-manager.ts:259](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L259)*

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

*Defined in [index-manager.ts:309](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L309)*

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

*Defined in [index-manager.ts:335](https://github.com/terascope/teraslice/blob/d2d877b60/packages/elasticsearch-store/src/index-manager.ts#L335)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | string |

**Returns:** *Promise‹void›*
