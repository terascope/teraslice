---
title: Data Access: `DataType`
sidebar_label: DataType
---

# Interface: DataType

The definition a DataType model

## Hierarchy

* IndexModelRecord

  * **DataType**

## Index

### Properties

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

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:163

The mutli-tenant ID representing the client

___

###  config

• **config**: *DataTypeConfig*

*Defined in [models/config/data-types.ts:94](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/data-types.ts#L94)*

Data Type Config

___

###  created

• **created**: *string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:171

Creation date

___

### `Optional` description

• **description**? : *undefined | string*

*Defined in [models/config/data-types.ts:84](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/data-types.ts#L84)*

Description of the DataType

___

###  id

• **id**: *string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:159

A unique ID for the record - nanoid 12 digit

___

### `Optional` inherit_from

• **inherit_from**? : *string[]*

*Defined in [models/config/data-types.ts:89](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/data-types.ts#L89)*

DataType to inherit from

___

###  name

• **name**: *string*

*Defined in [models/config/data-types.ts:79](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/data-types.ts#L79)*

Name of the DataType

___

###  updated

• **updated**: *string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:167

Updated date
