---
title: Utils: `DataEntity`
sidebar_label: DataEntity
---

# Class: DataEntity <**T, M**>

A wrapper for data that can hold additional metadata properties.
A DataEntity should be essentially transparent to use within operations.

NOTE: Use `DataEntity.make`, `DataEntity.fromBuffer` and `DataEntity.makeArray`
in production for potential performance gains

## Type parameters

▪ **T**

▪ **M**

## Hierarchy

* **DataEntity**

## Indexable

* \[ **prop**: *string*\]: any

A wrapper for data that can hold additional metadata properties.
A DataEntity should be essentially transparent to use within operations.

NOTE: Use `DataEntity.make`, `DataEntity.fromBuffer` and `DataEntity.makeArray`
in production for potential performance gains

## Index

### Constructors

* [constructor](dataentity.md#constructor)

### Methods

* [getCreateTime](dataentity.md#getcreatetime)
* [getEventTime](dataentity.md#geteventtime)
* [getIngestTime](dataentity.md#getingesttime)
* [getKey](dataentity.md#getkey)
* [getMetadata](dataentity.md#getmetadata)
* [getProcessTime](dataentity.md#getprocesstime)
* [getRawData](dataentity.md#getrawdata)
* [setEventTime](dataentity.md#seteventtime)
* [setIngestTime](dataentity.md#setingesttime)
* [setKey](dataentity.md#setkey)
* [setMetadata](dataentity.md#setmetadata)
* [setProcessTime](dataentity.md#setprocesstime)
* [setRawData](dataentity.md#setrawdata)
* [toBuffer](dataentity.md#tobuffer)
* [[Symbol.hasInstance]](dataentity.md#static-[symbol.hasinstance])
* [fork](dataentity.md#static-fork)
* [fromBuffer](dataentity.md#static-frombuffer)
* [getMetadata](dataentity.md#static-getmetadata)
* [isDataEntity](dataentity.md#static-isdataentity)
* [isDataEntityArray](dataentity.md#static-isdataentityarray)
* [make](dataentity.md#static-make)
* [makeArray](dataentity.md#static-makearray)

## Constructors

###  constructor

\+ **new DataEntity**(`data`: T | null | undefined, `metadata?`: M): *[DataEntity](dataentity.md)*

*Defined in [packages/utils/src/entities/data-entity.ts:169](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L169)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | T &#124; null &#124; undefined |
`metadata?` | M |

**Returns:** *[DataEntity](dataentity.md)*

## Methods

###  getCreateTime

▸ **getCreateTime**(): *Date*

*Defined in [packages/utils/src/entities/data-entity.ts:245](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L245)*

Get the time at which this entity was created.

**Returns:** *Date*

___

###  getEventTime

▸ **getEventTime**(): *Date | false | undefined*

*Defined in [packages/utils/src/entities/data-entity.ts:317](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L317)*

Get time associated from a specific field on source data or message

If none is found, `undefined` will be returned.
If an invalid date is found, `false` will be returned.

**Returns:** *Date | false | undefined*

___

###  getIngestTime

▸ **getIngestTime**(): *Date | false | undefined*

*Defined in [packages/utils/src/entities/data-entity.ts:261](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L261)*

Get the time at which the data was ingested into the source data

If none is found, `undefined` will be returned.
If an invalid date is found, `false` will be returned.

**Returns:** *Date | false | undefined*

___

###  getKey

▸ **getKey**(): *string | number*

*Defined in [packages/utils/src/entities/data-entity.ts:221](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L221)*

Get the unique document `_key` from the metadata.
If no `_key` is found, an error will be thrown

**Returns:** *string | number*

___

###  getMetadata

▸ **getMetadata**(`key?`: undefined): *i._DataEntityMetadata‹M›*

*Defined in [packages/utils/src/entities/data-entity.ts:188](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L188)*

Get the metadata for the DataEntity.
If a field is specified, it will get that property of the metadata

**Parameters:**

Name | Type |
------ | ------ |
`key?` | undefined |

**Returns:** *i._DataEntityMetadata‹M›*

▸ **getMetadata**<**K**>(`key`: K): *i.EntityMetadataValue‹M, K›*

*Defined in [packages/utils/src/entities/data-entity.ts:189](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L189)*

**Type parameters:**

▪ **K**: *i.DataEntityMetadataValue‹M›*

**Parameters:**

Name | Type |
------ | ------ |
`key` | K |

**Returns:** *i.EntityMetadataValue‹M, K›*

___

###  getProcessTime

▸ **getProcessTime**(): *Date | false | undefined*

*Defined in [packages/utils/src/entities/data-entity.ts:289](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L289)*

Get the time at which the data was consumed by the reader.

If none is found, `undefined` will be returned.
If an invalid date is found, `false` will be returned.

**Returns:** *Date | false | undefined*

___

###  getRawData

▸ **getRawData**(): *Buffer*

*Defined in [packages/utils/src/entities/data-entity.ts:343](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L343)*

Get the raw data, usually used for encoding type `raw`.
If there is no data, an error will be thrown

**Returns:** *Buffer*

___

###  setEventTime

▸ **setEventTime**(`val?`: string | number | Date): *void*

*Defined in [packages/utils/src/entities/data-entity.ts:330](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L330)*

Set time associated from a specific field on source data or message

If the value is empty it will set the time to now.
If an invalid date is given, an error will be thrown.

**Parameters:**

Name | Type |
------ | ------ |
`val?` | string &#124; number &#124; Date |

**Returns:** *void*

___

###  setIngestTime

▸ **setIngestTime**(`val?`: string | number | Date): *void*

*Defined in [packages/utils/src/entities/data-entity.ts:274](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L274)*

Set the time at which the data was ingested into the source data

If the value is empty it will set the time to now.
If an invalid date is given, an error will be thrown.

**Parameters:**

Name | Type |
------ | ------ |
`val?` | string &#124; number &#124; Date |

**Returns:** *void*

___

###  setKey

▸ **setKey**(`key`: string | number): *void*

*Defined in [packages/utils/src/entities/data-entity.ts:234](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L234)*

Set the unique document `_key` from the metadata.
If no `_key` is found, an error will be thrown

**Parameters:**

Name | Type |
------ | ------ |
`key` | string &#124; number |

**Returns:** *void*

___

###  setMetadata

▸ **setMetadata**<**K**, **V**>(`field`: K, `value`: V): *void*

*Defined in [packages/utils/src/entities/data-entity.ts:203](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L203)*

Given a field and value set the metadata on the record

**Type parameters:**

▪ **K**: *i.DataEntityMetadataValue‹M›*

▪ **V**: *i.EntityMetadataValue‹M, K›*

**Parameters:**

Name | Type |
------ | ------ |
`field` | K |
`value` | V |

**Returns:** *void*

___

###  setProcessTime

▸ **setProcessTime**(`val?`: string | number | Date): *void*

*Defined in [packages/utils/src/entities/data-entity.ts:302](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L302)*

Set the time at which the data was consumed by the reader

If the value is empty it will set the time to now.
If an invalid date is given, an error will be thrown.

**Parameters:**

Name | Type |
------ | ------ |
`val?` | string &#124; number &#124; Date |

**Returns:** *void*

___

###  setRawData

▸ **setRawData**(`buf`: Buffer | string | null): *void*

*Defined in [packages/utils/src/entities/data-entity.ts:354](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L354)*

Set the raw data, usually used for encoding type `raw`
If given `null`, it will unset the data

**Parameters:**

Name | Type |
------ | ------ |
`buf` | Buffer &#124; string &#124; null |

**Returns:** *void*

___

###  toBuffer

▸ **toBuffer**(`opConfig`: [EncodingConfig](../interfaces/encodingconfig.md)): *Buffer*

*Defined in [packages/utils/src/entities/data-entity.ts:369](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L369)*

Convert the DataEntity to an encoded buffer

**`default`** `json`

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`opConfig` | [EncodingConfig](../interfaces/encodingconfig.md) |  {} | The operation config used to get the encoding type of the buffer, |

**Returns:** *Buffer*

___

### `Static` [Symbol.hasInstance]

▸ **[Symbol.hasInstance]**(`instance`: any): *boolean*

*Defined in [packages/utils/src/entities/data-entity.ts:156](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L156)*

**Parameters:**

Name | Type |
------ | ------ |
`instance` | any |

**Returns:** *boolean*

___

### `Static` fork

▸ **fork**<**T**>(`input`: T, `withData`: boolean): *T*

*Defined in [packages/utils/src/entities/data-entity.ts:75](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L75)*

Create a new instance of a DataEntity.

If the second param `withData` is set to `true`
both the data and metadata will be forked, if set
to `false` only the metadata will be copied. Defaults
to `true`

**Type parameters:**

▪ **T**: *[DataEntity](dataentity.md)‹any, any›*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | T | - |
`withData` | boolean | true |

**Returns:** *T*

___

### `Static` fromBuffer

▸ **fromBuffer**<**T**, **M**>(`input`: Buffer | string, `opConfig`: [EncodingConfig](../interfaces/encodingconfig.md), `metadata?`: M): *[DataEntity](dataentity.md)‹T, M›*

*Defined in [packages/utils/src/entities/data-entity.ts:97](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L97)*

A utility for converting a `Buffer` to a `DataEntity`,
using the DataEntity encoding.

**Type parameters:**

▪ **T**

▪ **M**

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`input` | Buffer &#124; string | - | A `Buffer` to parse to JSON |
`opConfig` | [EncodingConfig](../interfaces/encodingconfig.md) |  {} | The operation config used to get the encoding type of the Buffer, defaults to "json" |
`metadata?` | M | - | Optionally add any metadata  |

**Returns:** *[DataEntity](dataentity.md)‹T, M›*

___

### `Static` getMetadata

▸ **getMetadata**(`input`: any, `field?`: any): *any*

*Defined in [packages/utils/src/entities/data-entity.ts:146](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L146)*

Safely get the metadata from a `DataEntity`.
If the input is object it will get the property from the object

**DEPRECATED:** Since this isn't recommended to be used, and will
be removed in future releases.

**`deprecated`** 

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`field?` | any |

**Returns:** *any*

___

### `Static` isDataEntity

▸ **isDataEntity**<**T**, **M**>(`input`: any): *input is DataEntity<T, M>*

*Defined in [packages/utils/src/entities/data-entity.ts:119](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L119)*

Verify that an input is the `DataEntity`

**Type parameters:**

▪ **T**

▪ **M**

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is DataEntity<T, M>*

___

### `Static` isDataEntityArray

▸ **isDataEntityArray**<**T**, **M**>(`input`: any): *input is DataEntity<T, M>[]*

*Defined in [packages/utils/src/entities/data-entity.ts:128](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L128)*

Verify that an input is an Array of DataEntities,

**Type parameters:**

▪ **T**

▪ **M**

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is DataEntity<T, M>[]*

___

### `Static` make

▸ **make**<**T**, **M**>(`input`: T, `metadata?`: M): *T*

*Defined in [packages/utils/src/entities/data-entity.ts:32](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L32)*

A utility for safely converting an object a `DataEntity`.
If the input is a DataEntity it will return it and have no side-effect.
If you want a create new DataEntity from an existing DataEntity
either use `new DataEntity` or shallow clone the input before
passing it to `DataEntity.make`.

**Type parameters:**

▪ **T**: *[DataEntity](dataentity.md)‹any, any›*

▪ **M**

**Parameters:**

Name | Type |
------ | ------ |
`input` | T |
`metadata?` | M |

**Returns:** *T*

▸ **make**<**T**, **M**>(`input`: Record‹string, any›, `metadata?`: M): *[DataEntity](dataentity.md)‹T, M›*

*Defined in [packages/utils/src/entities/data-entity.ts:36](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L36)*

**Type parameters:**

▪ **T**

▪ **M**

**Parameters:**

Name | Type |
------ | ------ |
`input` | Record‹string, any› |
`metadata?` | M |

**Returns:** *[DataEntity](dataentity.md)‹T, M›*

___

### `Static` makeArray

▸ **makeArray**<**T**, **M**>(`input`: [DataArrayInput](../overview.md#dataarrayinput)): *[DataEntity](dataentity.md)‹T, M›[]*

*Defined in [packages/utils/src/entities/data-entity.ts:53](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/entities/data-entity.ts#L53)*

A utility for safely converting an input of an object,
or an array of objects, to an array of DataEntities.
This will detect if passed an already converted input and return it.

**Type parameters:**

▪ **T**

▪ **M**

**Parameters:**

Name | Type |
------ | ------ |
`input` | [DataArrayInput](../overview.md#dataarrayinput) |

**Returns:** *[DataEntity](dataentity.md)‹T, M›[]*
