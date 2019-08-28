---
title: Data Types: `Short`
sidebar_label: Short
---

# Class: Short

## Hierarchy

* [BaseType](basetype.md)

  * **Short**

## Index

### Constructors

* [constructor](short.md#constructor)

### Properties

* [config](short.md#protected-config)
* [field](short.md#protected-field)

### Methods

* [_formatGql](short.md#protected-_formatgql)
* [toESMapping](short.md#toesmapping)
* [toGraphQL](short.md#tographql)
* [toXlucene](short.md#toxlucene)

## Constructors

###  constructor

\+ **new Short**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig)): *[Short](short.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) |

**Returns:** *[Short](short.md)*

## Properties

### `Protected` config

• **config**: *[FieldTypeConfig](../overview.md#fieldtypeconfig)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: string, `customType?`: undefined | string): *object*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:21](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-types/src/types/versions/base-type.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |
`customType?` | undefined \| string |

**Returns:** *object*

___

###  toESMapping

▸ **toESMapping**(`_version?`: undefined | number): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/versions/v1/short.ts:6](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-types/src/types/versions/v1/short.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`_version?` | undefined \| number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/short.ts:10](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-types/src/types/versions/v1/short.ts#L10)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/short.ts:14](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-types/src/types/versions/v1/short.ts#L14)*

**Returns:** *object*
