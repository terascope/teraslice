---
title: Data Types: `Hostname`
sidebar_label: Hostname
---

# Class: Hostname

## Hierarchy

* [BaseType](basetype.md)

  * **Hostname**

## Index

### Constructors

* [constructor](hostname.md#constructor)

### Properties

* [config](hostname.md#protected-config)
* [field](hostname.md#protected-field)

### Methods

* [_formatGql](hostname.md#protected-_formatgql)
* [toESMapping](hostname.md#toesmapping)
* [toGraphQL](hostname.md#tographql)
* [toXlucene](hostname.md#toxlucene)

## Constructors

###  constructor

\+ **new Hostname**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig)): *[Hostname](hostname.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) |

**Returns:** *[Hostname](hostname.md)*

## Properties

### `Protected` config

• **config**: *[FieldTypeConfig](../overview.md#fieldtypeconfig)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: string, `customType?`: undefined | string): *object*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:21](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/base-type.ts#L21)*

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

*Defined in [types/versions/v1/hostname.ts:6](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/v1/hostname.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`_version?` | undefined \| number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/hostname.ts:39](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/v1/hostname.ts#L39)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/hostname.ts:43](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/v1/hostname.ts#L43)*

**Returns:** *object*
