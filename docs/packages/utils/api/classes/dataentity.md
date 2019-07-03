---
title: Utils :: DataEntity
sidebar_label: DataEntity
---

# Class: DataEntity <**T**>

A wrapper for data that can hold additional metadata properties.
A DataEntity should be essentially transparent to use within operations.

IMPORTANT: Use `DataEntity.make`, `DataEntity.fromBuffer` and `DataEntity.makeArray`
to create DataEntities that are significantly faster (600x-1000x faster).

## Type parameters

▪ **T**: *object*

## Hierarchy

* **DataEntity**

## Indexable

● \[▪ **prop**: *string*\]: any

A wrapper for data that can hold additional metadata properties.
A DataEntity should be essentially transparent to use within operations.

IMPORTANT: Use `DataEntity.make`, `DataEntity.fromBuffer` and `DataEntity.makeArray`
to create DataEntities that are significantly faster (600x-1000x faster).

### Index

#### Constructors

* [constructor](dataentity.md#constructor)

#### Methods

* [getMetadata](dataentity.md#getmetadata)
* [setMetadata](dataentity.md#setmetadata)
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

\+ **new DataEntity**(`data`: *`T`*, `metadata?`: *undefined | object*): *[DataEntity](dataentity.md)*

*Defined in [data-entity.ts:118](https://github.com/terascope/teraslice/blob/5e4063e2/packages/utils/src/data-entity.ts#L118)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | `T` |
`metadata?` | undefined \| object |

**Returns:** *[DataEntity](dataentity.md)*

## Methods

###  getMetadata

▸ **getMetadata**(): *`DataEntityMetadata`*

*Defined in [data-entity.ts:138](https://github.com/terascope/teraslice/blob/5e4063e2/packages/utils/src/data-entity.ts#L138)*

**Returns:** *`DataEntityMetadata`*

▸ **getMetadata**(`key`: *string*): *any*

*Defined in [data-entity.ts:139](https://github.com/terascope/teraslice/blob/5e4063e2/packages/utils/src/data-entity.ts#L139)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |

**Returns:** *any*

___

###  setMetadata

▸ **setMetadata**(`key`: *string*, `value`: *any*): *void*

*Defined in [data-entity.ts:144](https://github.com/terascope/teraslice/blob/5e4063e2/packages/utils/src/data-entity.ts#L144)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`value` | any |

**Returns:** *void*

___

###  toBuffer

▸ **toBuffer**(`opConfig`: *[EncodingConfig](../interfaces/encodingconfig.md)*): *`Buffer`*

*Defined in [data-entity.ts:152](https://github.com/terascope/teraslice/blob/5e4063e2/packages/utils/src/data-entity.ts#L152)*

Convert the DataEntity to an encoded buffer

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`opConfig` | [EncodingConfig](../interfaces/encodingconfig.md) |  {} | The operation config used to get the encoding type of the buffer, defaults to "json"  |

**Returns:** *`Buffer`*

___

### `Static` fromBuffer

▸ **fromBuffer**<**T**>(`input`: *`Buffer`*, `opConfig`: *[EncodingConfig](../interfaces/encodingconfig.md)*, `metadata?`: *undefined | object*): *[DataEntity](dataentity.md)‹*`T`*›*

*Defined in [data-entity.ts:55](https://github.com/terascope/teraslice/blob/5e4063e2/packages/utils/src/data-entity.ts#L55)*

A utility for safely converting an `Buffer` to a `DataEntity`.

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`input` | `Buffer` | - | A `Buffer` to parse to JSON |
`opConfig` | [EncodingConfig](../interfaces/encodingconfig.md) |  {} | The operation config used to get the encoding type of the Buffer, defaults to "json" |
`metadata?` | undefined \| object | - | Optionally add any metadata  |

**Returns:** *[DataEntity](dataentity.md)‹*`T`*›*

___

### `Static` getMetadata

▸ **getMetadata**(`input`: *[DataInput](../overview.md#datainput)*, `key?`: *undefined | string*): *any*

*Defined in [data-entity.ts:107](https://github.com/terascope/teraslice/blob/5e4063e2/packages/utils/src/data-entity.ts#L107)*

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

▸ **isDataEntity**(`input`: *any*): *boolean*

*Defined in [data-entity.ts:84](https://github.com/terascope/teraslice/blob/5e4063e2/packages/utils/src/data-entity.ts#L84)*

Verify that an input is the `DataEntity`

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

### `Static` isDataEntityArray

▸ **isDataEntityArray**(`input`: *any*): *boolean*

*Defined in [data-entity.ts:96](https://github.com/terascope/teraslice/blob/5e4063e2/packages/utils/src/data-entity.ts#L96)*

Verify that an input is an Array of DataEntities,

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

### `Static` make

▸ **make**<**T**>(`input`: *[DataInput](../overview.md#datainput)*, `metadata?`: *undefined | object*): *[DataEntity](dataentity.md)‹*`T`*›*

*Defined in [data-entity.ts:27](https://github.com/terascope/teraslice/blob/5e4063e2/packages/utils/src/data-entity.ts#L27)*

A utility for safely converting an object a `DataEntity`.
If the input is a DataEntity it will return it and have no side-effect.
If you want a create new DataEntity from an existing DataEntity
either use `new DataEntity` or shallow clone the input before
passing it to `DataEntity.make`.

NOTE: `DataEntity.make` is different from using `new DataEntity`
because it attaching it doesn't shallow cloning the object
onto the `DataEntity` instance, this is significatly faster and so it
is recommended to use this in production.

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type |
------ | ------ |
`input` | [DataInput](../overview.md#datainput) |
`metadata?` | undefined \| object |

**Returns:** *[DataEntity](dataentity.md)‹*`T`*›*

___

### `Static` makeArray

▸ **makeArray**<**T**>(`input`: *[DataInput](../overview.md#datainput) | [DataInput](../overview.md#datainput)[]*): *[DataEntity](dataentity.md)‹*`T`*›[]*

*Defined in [data-entity.ts:69](https://github.com/terascope/teraslice/blob/5e4063e2/packages/utils/src/data-entity.ts#L69)*

A utility for safely converting an input of an object,
or an array of objects, to an array of DataEntities.
This will detect if passed an already converted input and return it.

**Type parameters:**

▪ **T**: *object*

**Parameters:**

Name | Type |
------ | ------ |
`input` | [DataInput](../overview.md#datainput) \| [DataInput](../overview.md#datainput)[] |

**Returns:** *[DataEntity](dataentity.md)‹*`T`*›[]*

___

### `Static` makeRaw

▸ **makeRaw**<**T**>(`input?`: *[T]()*, `metadata?`: *undefined | object*): *object*

*Defined in [data-entity.ts:41](https://github.com/terascope/teraslice/blob/5e4063e2/packages/utils/src/data-entity.ts#L41)*

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
