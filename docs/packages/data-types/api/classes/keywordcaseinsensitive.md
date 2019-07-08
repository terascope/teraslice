---
title: Data Types: `KeywordCaseInsensitive`
sidebar_label: KeywordCaseInsensitive
---

# Class: KeywordCaseInsensitive

## Hierarchy

* [BaseType](basetype.md)

  * **KeywordCaseInsensitive**

### Index

#### Constructors

* [constructor](keywordcaseinsensitive.md#constructor)

#### Properties

* [config](keywordcaseinsensitive.md#protected-config)
* [field](keywordcaseinsensitive.md#protected-field)

#### Methods

* [_formatGql](keywordcaseinsensitive.md#protected-_formatgql)
* [toESMapping](keywordcaseinsensitive.md#toesmapping)
* [toGraphQL](keywordcaseinsensitive.md#tographql)
* [toXlucene](keywordcaseinsensitive.md#toxlucene)

## Constructors

###  constructor

\+ **new KeywordCaseInsensitive**(`field`: *string*, `config`: *[Type](../overview.md#type)*): *[KeywordCaseInsensitive](keywordcaseinsensitive.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [Type](../overview.md#type) |

**Returns:** *[KeywordCaseInsensitive](keywordcaseinsensitive.md)*

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

*Defined in [types/versions/v1/keyword-case-insensitive.ts:6](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/v1/keyword-case-insensitive.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined \| number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/keyword-case-insensitive.ts:24](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/v1/keyword-case-insensitive.ts#L24)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/keyword-case-insensitive.ts:28](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-types/src/types/versions/v1/keyword-case-insensitive.ts#L28)*

**Returns:** *object*
