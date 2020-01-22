---
title: Elasticsearch Store: `IndexModelRecord`
sidebar_label: IndexModelRecord
---

# Interface: IndexModelRecord

## Hierarchy

* **IndexModelRecord**

## Index

### Properties

* [_created](indexmodelrecord.md#_created)
* [_deleted](indexmodelrecord.md#optional-_deleted)
* [_key](indexmodelrecord.md#_key)
* [_updated](indexmodelrecord.md#_updated)
* [client_id](indexmodelrecord.md#client_id)

## Properties

###  _created

• **_created**: *string*

*Defined in [interfaces.ts:202](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/interfaces.ts#L202)*

Creation date

___

### `Optional` _deleted

• **_deleted**? : *undefined | false | true*

*Defined in [interfaces.ts:192](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/interfaces.ts#L192)*

Indicates whether the record is deleted or not

___

###  _key

• **_key**: *string*

*Defined in [interfaces.ts:182](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/interfaces.ts#L182)*

A unique ID for the record - nanoid 12 digit

___

###  _updated

• **_updated**: *string*

*Defined in [interfaces.ts:197](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/interfaces.ts#L197)*

Updated date

___

###  client_id

• **client_id**: *number*

*Defined in [interfaces.ts:187](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/interfaces.ts#L187)*

The mutli-tenant ID representing the client
