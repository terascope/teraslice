---
title: Utils: `DataEntity`
sidebar_label: DataEntity
---

# Class: DataEntity <**T, M**>

A wrapper for data that can hold additional metadata properties.
A DataEntity should be essentially transparent to use within operations.

IMPORTANT: Use `DataEntity.make`, `DataEntity.fromBuffer` and `DataEntity.makeArray`
to create DataEntities that are significantly faster (600x-1000x faster).

## Type parameters

▪ **T**: *object*

▪ **M**: *object*

## Hierarchy

* **DataEntity**

## Indexable

* \[ **prop**: *string*\]: any

A wrapper for data that can hold additional metadata properties.
A DataEntity should be essentially transparent to use within operations.

IMPORTANT: Use `DataEntity.make`, `DataEntity.fromBuffer` and `DataEntity.makeArray`
to create DataEntities that are significantly faster (600x-1000x faster).

## Index

### Constructors

* [constructor](dataentity.md#constructor)

### Properties

* [__computed](dataentity.md#__computed)

### Methods

* [getMetadata](dataentity.md#getmetadata)
* [getRawData](dataentity.md#getrawdata)
* [setMetadata](dataentity.md#setmetadata)
* [setRawData](dataentity.md#setrawdata)
* [toBuffer](dataentity.md#tobuffer)
* [fromBuffer](dataentity.md#static-frombuffer)
* [getMetadata](dataentity.md#static-getmetadata)
* [isDataEntity](dataentity.md#static-isdataentity)
* [isDataEntityArray](dataentity.md#static-isdataentityarray)
* [make](dataentity.md#static-make)
* [makeArray](dataentity.md#static-makearray)
* [makeRaw](dataentity.md#static-makeraw)

## Constructors

###  constructor

\+ **new DataEntity**(`data`: T | null | undefined, `metadata?`: [M]()): *[DataEntity](dataentity.md)*

*Defined in [entities/data-entity.ts:117](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L117)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | T \| null \| undefined |
`metadata?` | [M]() |

**Returns:** *[DataEntity](dataentity.md)*

## Properties

###  __computed

• **__computed**: *i.__DataEntityProps‹M›*

*Defined in [entities/data-entity.ts:117](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L117)*

## Methods

###  getMetadata

▸ **getMetadata**<**K**>(`key?`: [K]()): *DataEntityMetadata[K] | any*

*Defined in [entities/data-entity.ts:135](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L135)*

Get the metadata for the DataEntity.
If a key is specified, it will get that property of the metadata

**Type parameters:**

▪ **K**: *keyof DataEntityMetadata*

**Parameters:**

Name | Type |
------ | ------ |
`key?` | [K]() |

**Returns:** *DataEntityMetadata[K] | any*

___

###  getRawData

▸ **getRawData**(): *Buffer*

*Defined in [entities/data-entity.ts:157](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L157)*

Get the raw data, usually used for encoding type `raw`
If there is no data, an error will be thrown

**Returns:** *Buffer*

___

###  setMetadata

▸ **setMetadata**(`key`: keyof M | keyof DataEntityMetadata | string, `value`: any): *void*

*Defined in [entities/data-entity.ts:145](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L145)*

Given a key and value set the metadata on the record

**Parameters:**

Name | Type |
------ | ------ |
`key` | keyof M \| keyof DataEntityMetadata \| string |
`value` | any |

**Returns:** *void*

___

###  setRawData

▸ **setRawData**(`buf`: Buffer | string | null): *void*

*Defined in [entities/data-entity.ts:167](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L167)*

Set the raw data, usually used for encoding type `raw`
If given `null`, it will unset the data

**Parameters:**

Name | Type |
------ | ------ |
`buf` | Buffer \| string \| null |

**Returns:** *void*

___

###  toBuffer

▸ **toBuffer**(`opConfig`: [EncodingConfig](../interfaces/encodingconfig.md)): *Buffer*

*Defined in [entities/data-entity.ts:181](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L181)*

Convert the DataEntity to an encoded buffer

**`default`** `json`

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`opConfig` | [EncodingConfig](../interfaces/encodingconfig.md) |  {} | The operation config used to get the encoding type of the buffer, |

**Returns:** *Buffer*

___

### `Static` fromBuffer

▸ **fromBuffer**<**T**>(`input`: Buffer | string, `opConfig`: [EncodingConfig](../interfaces/encodingconfig.md), `metadata?`: undefined | object): *[DataEntity](dataentity.md)‹T›*

*Defined in [entities/data-entity.ts:48](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L48)*

A utility for safely converting an `Buffer` to a `DataEntity`.

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`input` | Buffer \| string | - | A `Buffer` to parse to JSON |
`opConfig` | [EncodingConfig](../interfaces/encodingconfig.md) |  {} | The operation config used to get the encoding type of the Buffer, defaults to "json" |
`metadata?` | undefined \| object | - | Optionally add any metadata  |

**Returns:** *[DataEntity](dataentity.md)‹T›*

___

### `Static` getMetadata

▸ **getMetadata**(`input`: [DataInput](../overview.md#datainput), `key?`: undefined | string): *any*

*Defined in [entities/data-entity.ts:105](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L105)*

Safely get the metadata from a `DataEntity`.
If the input is object it will get the property from the object

**Parameters:**

Name | Type |
------ | ------ |
`input` | [DataInput](../overview.md#datainput) |
`key?` | undefined \| string |

**Returns:** *any*

___

### `Static` isDataEntity

▸ **isDataEntity**(`input`: any): *boolean*

*Defined in [entities/data-entity.ts:87](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L87)*

Verify that an input is the `DataEntity`

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

### `Static` isDataEntityArray

▸ **isDataEntityArray**(`input`: any): *boolean*

*Defined in [entities/data-entity.ts:94](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L94)*

Verify that an input is an Array of DataEntities,

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

### `Static` make

▸ **make**<**T**>(`input`: [DataInput](../overview.md#datainput), `metadata?`: undefined | object): *[DataEntity](dataentity.md)‹T›*

*Defined in [entities/data-entity.ts:21](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L21)*

A utility for safely converting an object a `DataEntity`.
If the input is a DataEntity it will return it and have no side-effect.
If you want a create new DataEntity from an existing DataEntity
either use `new DataEntity` or shallow clone the input before
passing it to `DataEntity.make`.

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type |
------ | ------ |
`input` | [DataInput](../overview.md#datainput) |
`metadata?` | undefined \| object |

**Returns:** *[DataEntity](dataentity.md)‹T›*

___

### `Static` makeArray

▸ **makeArray**<**T**>(`input`: [DataInput](../overview.md#datainput) | [DataInput](../overview.md#datainput)[]): *[DataEntity](dataentity.md)‹T›[]*

*Defined in [entities/data-entity.ts:72](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L72)*

A utility for safely converting an input of an object,
or an array of objects, to an array of DataEntities.
This will detect if passed an already converted input and return it.

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type |
------ | ------ |
`input` | [DataInput](../overview.md#datainput) \| [DataInput](../overview.md#datainput)[] |

**Returns:** *[DataEntity](dataentity.md)‹T›[]*

___

### `Static` makeRaw

▸ **makeRaw**<**T**>(`input?`: [T](), `metadata?`: undefined | object): *object*

*Defined in [entities/data-entity.ts:30](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/entities/data-entity.ts#L30)*

A barebones method for creating data-entities. This does not do type detection
and returns both the metadata and entity

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type |
------ | ------ |
`input?` | [T]() |
`metadata?` | undefined \| object |

**Returns:** *object*
