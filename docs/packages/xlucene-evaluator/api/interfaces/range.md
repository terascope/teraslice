---
title: xLucene Evaluator: `Range`
sidebar_label: Range
---

# Interface: Range

## Hierarchy

* [TermLikeAST](termlikeast.md)

  ↳ **Range**

## Index

### Properties

* [field](range.md#field)
* [field_type](range.md#field_type)
* [left](range.md#left)
* [right](range.md#optional-right)
* [tokenizer](range.md#optional-tokenizer)
* [type](range.md#type)

## Properties

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:47](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L47)*

___

###  field_type

• **field_type**: *[FieldType](../enums/fieldtype.md)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:126](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L126)*

___

###  left

• **left**: *[RangeNode](rangenode.md)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:127](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L127)*

___

### `Optional` right

• **right**? : *[RangeNode](rangenode.md)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:128](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L128)*

___

### `Optional` tokenizer

• **tokenizer**? : *undefined | false | true*

*Inherited from [TermLikeAST](termlikeast.md).[tokenizer](termlikeast.md#optional-tokenizer)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:48](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L48)*

___

###  type

• **type**: *[Range](../enums/asttype.md#range)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:125](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L125)*
