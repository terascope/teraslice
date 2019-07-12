---
title: Data Types: `GeoType`
sidebar_label: GeoType
---

# Class: GeoType

## Hierarchy

* [BaseType](basetype.md)

  * **GeoType**

### Index

#### Constructors

* [constructor](geotype.md#constructor)

#### Properties

* [config](geotype.md#protected-config)
* [field](geotype.md#protected-field)

#### Methods

* [_formatGql](geotype.md#protected-_formatgql)
* [toESMapping](geotype.md#toesmapping)
* [toGraphQL](geotype.md#tographql)
* [toXlucene](geotype.md#toxlucene)

## Constructors

###  constructor

\+ **new GeoType**(`field`: string, `config`: [Type](../overview.md#type)): *[GeoType](geotype.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [Type](../overview.md#type) |

**Returns:** *[GeoType](geotype.md)*

## Properties

### `Protected` config

• **config**: *[Type](../overview.md#type)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: string): *string*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:19](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/base-type.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |

**Returns:** *string*

___

###  toESMapping

▸ **toESMapping**(): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/versions/v1/geo.ts:6](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/v1/geo.ts#L6)*

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/geo.ts:10](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/v1/geo.ts#L10)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/geo.ts:20](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-types/src/types/versions/v1/geo.ts#L20)*

**Returns:** *object*
