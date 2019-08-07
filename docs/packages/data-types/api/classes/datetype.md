---
title: Data Types: `DateType`
sidebar_label: DateType
---

# Class: DateType

## Hierarchy

* [BaseType](basetype.md)

  * **DateType**

## Index

### Constructors

* [constructor](datetype.md#constructor)

### Properties

* [config](datetype.md#protected-config)
* [field](datetype.md#protected-field)

### Methods

* [_formatGql](datetype.md#protected-_formatgql)
* [toESMapping](datetype.md#toesmapping)
* [toGraphQL](datetype.md#tographql)
* [toXlucene](datetype.md#toxlucene)

## Constructors

###  constructor

\+ **new DateType**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig)): *[DateType](datetype.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) |

**Returns:** *[DateType](datetype.md)*

## Properties

### `Protected` config

• **config**: *[FieldTypeConfig](../overview.md#fieldtypeconfig)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: string, `customType?`: undefined | string): *object*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:19](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |
`customType?` | undefined \| string |

**Returns:** *object*

___

###  toESMapping

▸ **toESMapping**(`version?`: undefined | number): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/versions/v1/date.ts:6](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/v1/date.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined \| number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/date.ts:10](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/v1/date.ts#L10)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/date.ts:14](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/v1/date.ts#L14)*

**Returns:** *object*
