---
title: Utils: `DataEntityMetadata`
sidebar_label: DataEntityMetadata
---

# Interface: DataEntityMetadata

DataEntities have conventional metadata properties
that can track source, destination and other process
information.

**NOTE** Time values are set in UNIX Epoch time,
to reduce memory footput, the DataEntity has convenience
apis for getting and setting the time given and handling
the conversion between unix milliseconds to Date format.

## Hierarchy

* **DataEntityMetadata**

## Index

### Properties

* [_createTime](dataentitymetadata.md#optional-_createtime)
* [_eventTime](dataentitymetadata.md#optional-_eventtime)
* [_ingestTime](dataentitymetadata.md#optional-_ingesttime)
* [_key](dataentitymetadata.md#optional-_key)
* [_processTime](dataentitymetadata.md#optional-_processtime)

## Properties

### `Optional` _createTime

• **_createTime**? : *undefined | number*

*Defined in [packages/utils/src/entities/interfaces.ts:41](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L41)*

The time at which this entity was created
(this is automatically set on DataEntity creation)

**`readonly`** 

___

### `Optional` _eventTime

• **_eventTime**? : *undefined | number*

*Defined in [packages/utils/src/entities/interfaces.ts:53](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L53)*

The time associated with this data entity,
usually off of a specific field on source data or message

___

### `Optional` _ingestTime

• **_ingestTime**? : *undefined | number*

*Defined in [packages/utils/src/entities/interfaces.ts:44](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L44)*

The time at which the data was ingested into the source data

___

### `Optional` _key

• **_key**? : *string | number*

*Defined in [packages/utils/src/entities/interfaces.ts:56](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L56)*

A unique key for the data which will be can be used to key the data

___

### `Optional` _processTime

• **_processTime**? : *undefined | number*

*Defined in [packages/utils/src/entities/interfaces.ts:47](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/entities/interfaces.ts#L47)*

The time at which the data was consumed by the reader
