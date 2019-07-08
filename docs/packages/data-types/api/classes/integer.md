---
title: Data Types: `Integer`
sidebar_label: Integer
---

# Class: Integer

## Hierarchy

* [BaseType](basetype.md)

  * **Integer**

### Index

#### Constructors

* [constructor](integer.md#constructor)

#### Properties

* [config](integer.md#protected-config)
* [field](integer.md#protected-field)

#### Methods

* [_formatGql](integer.md#protected-_formatgql)
* [toESMapping](integer.md#toesmapping)
* [toGraphQL](integer.md#tographql)
* [toXlucene](integer.md#toxlucene)

## Constructors

###  constructor

\+ **new Integer**(`field`: *string*, `config`: *[Type](../overview.md#type)*): *[Integer](integer.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [Type](../overview.md#type) |

**Returns:** *[Integer](integer.md)*

## Properties

### `Protected` config

• **config**: *[Type](../overview.md#type)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: *string*): *string*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:19](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/base-type.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |

**Returns:** *string*

___

###  toESMapping

▸ **toESMapping**(`version?`: *undefined | number*): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/versions/v1/integer.ts:7](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/v1/integer.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined \| number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/integer.ts:11](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/v1/integer.ts#L11)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/integer.ts:15](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/v1/integer.ts#L15)*

**Returns:** *object*
