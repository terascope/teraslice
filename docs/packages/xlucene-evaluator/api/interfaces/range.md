---
title: Xlucene Evaluator: `Range`
sidebar_label: Range
---

# Interface: Range

## Hierarchy

* [TermLikeAST](termlikeast.md)

  * **Range**

## Index

### Properties

* [field](range.md#field)
* [field_type](range.md#field_type)
* [left](range.md#left)
* [right](range.md#optional-right)
* [type](range.md#type)

## Properties

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [parser/interfaces.ts:54](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L54)*

___

###  field_type

• **field_type**: *[FieldType](../enums/fieldtype.md)*

*Defined in [parser/interfaces.ts:129](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L129)*

___

###  left

• **left**: *[RangeNode](rangenode.md)*

*Defined in [parser/interfaces.ts:130](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L130)*

___

### `Optional` right

• **right**? : *[RangeNode](rangenode.md)*

*Defined in [parser/interfaces.ts:131](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L131)*

___

###  type

• **type**: *[Range](../enums/asttype.md#range)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [parser/interfaces.ts:128](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L128)*
