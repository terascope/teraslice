---
title: xLucene Parser: `Range`
sidebar_label: Range
---

# Interface: Range

## Hierarchy

* [TermLikeAST](termlikeast.md)

  ↳ **Range**

## Index

### Properties

* [analyzed](range.md#optional-analyzed)
* [field](range.md#field)
* [field_type](range.md#field_type)
* [left](range.md#left)
* [right](range.md#optional-right)
* [type](range.md#type)

## Properties

### `Optional` analyzed

• **analyzed**? : *undefined | false | true*

*Inherited from [TermLikeAST](termlikeast.md).[analyzed](termlikeast.md#optional-analyzed)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:41](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L41)*

___

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:40](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L40)*

___

###  field_type

• **field_type**: *xLuceneFieldType*

*Defined in [packages/xlucene-parser/src/interfaces.ts:119](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L119)*

___

###  left

• **left**: *[RangeNode](rangenode.md)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:120](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L120)*

___

### `Optional` right

• **right**? : *[RangeNode](rangenode.md)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:121](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L121)*

___

###  type

• **type**: *[Range](../enums/asttype.md#range)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:118](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L118)*
