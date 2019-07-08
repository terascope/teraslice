---
title: Data Access: `DataType`
sidebar_label: DataType
---

# Interface: DataType

The definition a DataType model

## Hierarchy

* `IndexModelRecord`

  * **DataType**

### Index

#### Properties

* [client_id](datatype.md#client_id)
* [config](datatype.md#config)
* [created](datatype.md#created)
* [description](datatype.md#optional-description)
* [id](datatype.md#id)
* [inherit_from](datatype.md#optional-inherit_from)
* [name](datatype.md#name)
* [updated](datatype.md#updated)

## Properties

###  client_id

• **client_id**: *number*

*Defined in [models/config/data-types.ts:86](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/models/config/data-types.ts#L86)*

The mutli-tenant ID representing the client

___

###  config

• **config**: *`DataTypeConfig`*

*Defined in [models/config/data-types.ts:106](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/models/config/data-types.ts#L106)*

Data Type Config

___

###  created

• **created**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:163

Creation date

___

### `Optional` description

• **description**? : *undefined | string*

*Defined in [models/config/data-types.ts:96](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/models/config/data-types.ts#L96)*

Description of the DataType

___

###  id

• **id**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:159

ID of the view - nanoid 12 digit

___

### `Optional` inherit_from

• **inherit_from**? : *string[]*

*Defined in [models/config/data-types.ts:101](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/models/config/data-types.ts#L101)*

DataType to inherit from

___

###  name

• **name**: *string*

*Defined in [models/config/data-types.ts:91](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/models/config/data-types.ts#L91)*

Name of the DataType

___

###  updated

• **updated**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:161

Updated date

