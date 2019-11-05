---
title: Data Types: `Domain`
sidebar_label: Domain
---

# Class: Domain

## Hierarchy

* [BaseType](basetype.md)

  ↳ **Domain**

## Index

### Constructors

* [constructor](domain.md#constructor)

### Properties

* [config](domain.md#protected-config)
* [field](domain.md#protected-field)

### Methods

* [_formatGql](domain.md#protected-_formatgql)
* [toESMapping](domain.md#toesmapping)
* [toGraphQL](domain.md#tographql)
* [toXlucene](domain.md#toxlucene)

## Constructors

###  constructor

\+ **new Domain**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig)): *[Domain](domain.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) |

**Returns:** *[Domain](domain.md)*

## Properties

### `Protected` config

• **config**: *[FieldTypeConfig](../overview.md#fieldtypeconfig)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: string, `customType?`: undefined | string): *object*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/base-type.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |
`customType?` | undefined &#124; string |

**Returns:** *object*

___

###  toESMapping

▸ **toESMapping**(`_version?`: undefined | number): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/versions/v1/domain.ts:6](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/v1/domain.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`_version?` | undefined &#124; number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/domain.ts:46](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/v1/domain.ts#L46)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/domain.ts:50](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/types/versions/v1/domain.ts#L50)*

**Returns:** *object*
