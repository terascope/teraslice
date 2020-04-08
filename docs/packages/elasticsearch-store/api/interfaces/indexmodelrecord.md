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

*Defined in [interfaces.ts:209](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L209)*

Creation date

___

### `Optional` _deleted

• **_deleted**? : *undefined | false | true*

*Defined in [interfaces.ts:199](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L199)*

Indicates whether the record is deleted or not

___

###  _key

• **_key**: *string*

*Defined in [interfaces.ts:189](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L189)*

A unique ID for the record - nanoid 12 digit

___

###  _updated

• **_updated**: *string*

*Defined in [interfaces.ts:204](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L204)*

Updated date

___

###  client_id

• **client_id**: *number*

*Defined in [interfaces.ts:194](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/interfaces.ts#L194)*

The mutli-tenant ID representing the client
