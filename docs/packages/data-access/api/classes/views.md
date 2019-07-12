---
title: Data Access: `Views`
sidebar_label: Views
---

# Class: Views

Manager for Views

## Hierarchy

* `IndexModel<View>`

  * **Views**

### Index

#### Constructors

* [constructor](views.md#constructor)

#### Properties

* [logger](views.md#logger)
* [name](views.md#name)
* [store](views.md#store)
* [IndexModelConfig](views.md#static-indexmodelconfig)

#### Methods

* [_appendToArray](views.md#protected-_appendtoarray)
* [_createJoinQuery](views.md#protected-_createjoinquery)
* [_ensureUnique](views.md#protected-_ensureunique)
* [_find](views.md#protected-_find)
* [_postProcess](views.md#protected-_postprocess)
* [_preProcess](views.md#protected-_preprocess)
* [_removeFromArray](views.md#protected-_removefromarray)
* [_sanitizeRecord](views.md#protected-_sanitizerecord)
* [_updateWith](views.md#protected-_updatewith)
* [checkForViewConflicts](views.md#checkforviewconflicts)
* [count](views.md#count)
* [countBy](views.md#countby)
* [create](views.md#create)
* [deleteAll](views.md#deleteall)
* [deleteById](views.md#deletebyid)
* [exists](views.md#exists)
* [find](views.md#find)
* [findAll](views.md#findall)
* [findAndApply](views.md#findandapply)
* [findBy](views.md#findby)
* [findByAnyId](views.md#findbyanyid)
* [findById](views.md#findbyid)
* [getViewOfSpace](views.md#getviewofspace)
* [initialize](views.md#initialize)
* [removeRoleFromViews](views.md#removerolefromviews)
* [shutdown](views.md#shutdown)
* [update](views.md#update)

## Constructors

###  constructor

\+ **new Views**(`client`: `Client`, `config`: `IndexModelOptions`): *[Views](views.md)*

*Overrides void*

*Defined in [models/views.ts:12](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/views.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | `Client` |
`config` | `IndexModelOptions` |

**Returns:** *[Views](views.md)*

## Properties

###  logger

• **logger**: *`Logger`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:12

___

###  name

• **name**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:11

___

###  store

• **store**: *`IndexStore<View>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:10

___

### `Static` IndexModelConfig

▪ **IndexModelConfig**: *`IndexModelConfig<View>`* =  viewsConfig

*Defined in [models/views.ts:12](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/views.ts#L12)*

## Methods

### `Protected` _appendToArray

▸ **_appendToArray**(`id`: string, `field`: keyof View, `values`: string[] | string): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:33

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof View |
`values` | string[] \| string |

**Returns:** *`Promise<void>`*

___

### `Protected` _createJoinQuery

▸ **_createJoinQuery**(`fields`: `AnyInput<View>`, `joinBy?`: `JoinBy`, `arrayJoinBy?`: `JoinBy`): *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:40

**Parameters:**

Name | Type |
------ | ------ |
`fields` | `AnyInput<View>` |
`joinBy?` | `JoinBy` |
`arrayJoinBy?` | `JoinBy` |

**Returns:** *string*

___

### `Protected` _ensureUnique

▸ **_ensureUnique**(`record`: `AnyInput<View>`): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:36

**Parameters:**

Name | Type |
------ | ------ |
`record` | `AnyInput<View>` |

**Returns:** *`Promise<void>`*

___

### `Protected` _find

▸ **_find**(`q?`: undefined | string, `options?`: `i.FindOptions<View>`, `queryAccess?`: `QueryAccess<View>`): *`Promise<View[]>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:35

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | `i.FindOptions<View>` |
`queryAccess?` | `QueryAccess<View>` |

**Returns:** *`Promise<View[]>`*

___

### `Protected` _postProcess

▸ **_postProcess**(`record`: [View](../interfaces/view.md)): *[View](../interfaces/view.md)*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:38

**Parameters:**

Name | Type |
------ | ------ |
`record` | [View](../interfaces/view.md) |

**Returns:** *[View](../interfaces/view.md)*

___

### `Protected` _preProcess

▸ **_preProcess**(`record`: [View](../interfaces/view.md)): *[View](../interfaces/view.md)*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:39

**Parameters:**

Name | Type |
------ | ------ |
`record` | [View](../interfaces/view.md) |

**Returns:** *[View](../interfaces/view.md)*

___

### `Protected` _removeFromArray

▸ **_removeFromArray**(`id`: string, `field`: keyof View, `values`: string[] | string): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:34

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof View |
`values` | string[] \| string |

**Returns:** *`Promise<void>`*

___

### `Protected` _sanitizeRecord

▸ **_sanitizeRecord**(`record`: [View](../interfaces/view.md)): *[View](../interfaces/view.md)*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:37

**Parameters:**

Name | Type |
------ | ------ |
`record` | [View](../interfaces/view.md) |

**Returns:** *[View](../interfaces/view.md)*

___

### `Protected` _updateWith

▸ **_updateWith**(`id`: string, `body`: any): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:32

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`body` | any |

**Returns:** *`Promise<void>`*

___

###  checkForViewConflicts

▸ **checkForViewConflicts**(`space`: `Partial<Space>`): *`Promise<void>`*

*Defined in [models/views.ts:18](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/views.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`space` | `Partial<Space>` |

**Returns:** *`Promise<void>`*

___

###  count

▸ **count**(`q?`: undefined | string, `queryAccess?`: `QueryAccess<View>`): *`Promise<number>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:19

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`queryAccess?` | `QueryAccess<View>` |

**Returns:** *`Promise<number>`*

___

###  countBy

▸ **countBy**(`fields`: `AnyInput<View>`, `joinBy?`: `JoinBy`, `arrayJoinBy?`: `JoinBy`): *`Promise<number>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:20

**Parameters:**

Name | Type |
------ | ------ |
`fields` | `AnyInput<View>` |
`joinBy?` | `JoinBy` |
`arrayJoinBy?` | `JoinBy` |

**Returns:** *`Promise<number>`*

___

###  create

▸ **create**(`record`: `i.CreateRecordInput<View>`): *`Promise<View>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:21

**Parameters:**

Name | Type |
------ | ------ |
`record` | `i.CreateRecordInput<View>` |

**Returns:** *`Promise<View>`*

___

###  deleteAll

▸ **deleteAll**(`ids`: string[]): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:23

**Parameters:**

Name | Type |
------ | ------ |
`ids` | string[] |

**Returns:** *`Promise<void>`*

___

###  deleteById

▸ **deleteById**(`id`: string): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:22

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

**Returns:** *`Promise<void>`*

___

###  exists

▸ **exists**(`id`: string[] | string): *`Promise<boolean>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:24

**Parameters:**

Name | Type |
------ | ------ |
`id` | string[] \| string |

**Returns:** *`Promise<boolean>`*

___

###  find

▸ **find**(`q?`: undefined | string, `options?`: `i.FindOptions<View>`, `queryAccess?`: `QueryAccess<View>`): *`Promise<View[]>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:30

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | `i.FindOptions<View>` |
`queryAccess?` | `QueryAccess<View>` |

**Returns:** *`Promise<View[]>`*

___

###  findAll

▸ **findAll**(`input`: string[] | string | undefined, `options?`: `i.FindOneOptions<View>`, `queryAccess?`: `QueryAccess<View>`): *`Promise<View[]>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:29

**Parameters:**

Name | Type |
------ | ------ |
`input` | string[] \| string \| undefined |
`options?` | `i.FindOneOptions<View>` |
`queryAccess?` | `QueryAccess<View>` |

**Returns:** *`Promise<View[]>`*

___

###  findAndApply

▸ **findAndApply**(`updates`: `Partial<View>` | undefined, `options?`: `i.FindOneOptions<View>`, `queryAccess?`: `QueryAccess<View>`): *`Promise<Partial<View>>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:28

**Parameters:**

Name | Type |
------ | ------ |
`updates` | `Partial<View>` \| undefined |
`options?` | `i.FindOneOptions<View>` |
`queryAccess?` | `QueryAccess<View>` |

**Returns:** *`Promise<Partial<View>>`*

___

###  findBy

▸ **findBy**(`fields`: `AnyInput<View>`, `joinBy?`: `JoinBy`, `options?`: `i.FindOneOptions<View>`, `queryAccess?`: `QueryAccess<View>`): *`Promise<View>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:25

**Parameters:**

Name | Type |
------ | ------ |
`fields` | `AnyInput<View>` |
`joinBy?` | `JoinBy` |
`options?` | `i.FindOneOptions<View>` |
`queryAccess?` | `QueryAccess<View>` |

**Returns:** *`Promise<View>`*

___

###  findByAnyId

▸ **findByAnyId**(`anyId`: any, `options?`: `i.FindOneOptions<View>`, `queryAccess?`: `QueryAccess<View>`): *`Promise<View>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:27

**Parameters:**

Name | Type |
------ | ------ |
`anyId` | any |
`options?` | `i.FindOneOptions<View>` |
`queryAccess?` | `QueryAccess<View>` |

**Returns:** *`Promise<View>`*

___

###  findById

▸ **findById**(`id`: string, `options?`: `i.FindOneOptions<View>`, `queryAccess?`: `QueryAccess<View>`): *`Promise<View>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:26

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`options?` | `i.FindOneOptions<View>` |
`queryAccess?` | `QueryAccess<View>` |

**Returns:** *`Promise<View>`*

___

###  getViewOfSpace

▸ **getViewOfSpace**(`space`: [Space](../interfaces/space.md), `role`: [Role](../interfaces/role.md)): *`Promise<View>`*

*Defined in [models/views.ts:53](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/views.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`space` | [Space](../interfaces/space.md) |
`role` | [Role](../interfaces/role.md) |

**Returns:** *`Promise<View>`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:17

**Returns:** *`Promise<void>`*

___

###  removeRoleFromViews

▸ **removeRoleFromViews**(`roleId`: string): *`Promise<void>`*

*Defined in [models/views.ts:70](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/views.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`roleId` | string |

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:18

**Returns:** *`Promise<void>`*

___

###  update

▸ **update**(`record`: `i.UpdateRecordInput<View>`): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:31

**Parameters:**

Name | Type |
------ | ------ |
`record` | `i.UpdateRecordInput<View>` |

**Returns:** *`Promise<void>`*
