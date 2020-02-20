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

*Defined in [interfaces.ts:208](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L208)*

Creation date

___

### `Optional` _deleted

• **_deleted**? : *undefined | false | true*

*Defined in [interfaces.ts:198](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L198)*

Indicates whether the record is deleted or not

___

###  _key

• **_key**: *string*

*Defined in [interfaces.ts:188](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L188)*

A unique ID for the record - nanoid 12 digit

___

###  _updated

• **_updated**: *string*

*Defined in [interfaces.ts:203](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L203)*

Updated date

___

###  client_id

• **client_id**: *number*

*Defined in [interfaces.ts:193](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L193)*

The mutli-tenant ID representing the client
