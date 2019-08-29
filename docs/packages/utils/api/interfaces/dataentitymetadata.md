---
title: Utils: `DataEntityMetadata`
sidebar_label: DataEntityMetadata
---

# Interface: DataEntityMetadata

## Hierarchy

* **DataEntityMetadata**

## Indexable

* \[ **prop**: *string*\]: any

## Index

### Properties

* [_createTime](dataentitymetadata.md#_createtime)
* [_eventTime](dataentitymetadata.md#optional-_eventtime)
* [_ingestTime](dataentitymetadata.md#optional-_ingesttime)
* [_key](dataentitymetadata.md#optional-_key)
* [_processTime](dataentitymetadata.md#optional-_processtime)

## Properties

###  _createTime

• **_createTime**: *number*

*Defined in [entities/interfaces.ts:11](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/interfaces.ts#L11)*

The time at which this entity was created

___

### `Optional` _eventTime

• **_eventTime**? : *undefined | number*

*Defined in [entities/interfaces.ts:23](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/interfaces.ts#L23)*

The time associated with this data entity,
usually off of a specific field on source data or message

___

### `Optional` _ingestTime

• **_ingestTime**? : *undefined | number*

*Defined in [entities/interfaces.ts:14](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/interfaces.ts#L14)*

The time at which the data was ingested into the source data

___

### `Optional` _key

• **_key**? : *undefined | string*

*Defined in [entities/interfaces.ts:26](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/interfaces.ts#L26)*

A unique key for the data which will be can be used to key the data

___

### `Optional` _processTime

• **_processTime**? : *undefined | number*

*Defined in [entities/interfaces.ts:17](https://github.com/terascope/teraslice/blob/d2d877b60/packages/utils/src/entities/interfaces.ts#L17)*

The time at which the data was consumed by the reader
