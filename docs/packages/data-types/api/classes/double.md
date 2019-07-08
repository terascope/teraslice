---
title: Data Types: `Double`
sidebar_label: Double
---

# Class: Double

## Hierarchy

* [BaseType](basetype.md)

  * **Double**

### Index

#### Constructors

* [constructor](double.md#constructor)

#### Properties

* [config](double.md#protected-config)
* [field](double.md#protected-field)

#### Methods

* [_formatGql](double.md#protected-_formatgql)
* [toESMapping](double.md#toesmapping)
* [toGraphQL](double.md#tographql)
* [toXlucene](double.md#toxlucene)

## Constructors

###  constructor

\+ **new Double**(`field`: *string*, `config`: *[Type](../overview.md#type)*): *[Double](double.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/a3992c27/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [Type](../overview.md#type) |

**Returns:** *[Double](double.md)*

## Properties

### `Protected` config

• **config**: *[Type](../overview.md#type)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/a3992c27/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/a3992c27/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: *string*): *string*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:19](https://github.com/terascope/teraslice/blob/a3992c27/packages/data-types/src/types/versions/base-type.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |

**Returns:** *string*

___

###  toESMapping

▸ **toESMapping**(`version?`: *undefined | number*): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/versions/v1/double.ts:6](https://github.com/terascope/teraslice/blob/a3992c27/packages/data-types/src/types/versions/v1/double.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined \| number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/double.ts:10](https://github.com/terascope/teraslice/blob/a3992c27/packages/data-types/src/types/versions/v1/double.ts#L10)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/double.ts:14](https://github.com/terascope/teraslice/blob/a3992c27/packages/data-types/src/types/versions/v1/double.ts#L14)*

**Returns:** *object*
