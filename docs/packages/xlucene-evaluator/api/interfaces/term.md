---
title: xLucene Evaluator: `Term`
sidebar_label: Term
---

# Interface: Term

## Hierarchy

* [AnyDataType](anydatatype.md)

* [TermLikeAST](termlikeast.md)

  ↳ **Term**

## Index

### Properties

* [field](term.md#field)
* [field_type](term.md#field_type)
* [tokenizer](term.md#optional-tokenizer)
* [type](term.md#type)
* [value](term.md#value)

## Properties

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:47](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L47)*

___

###  field_type

• **field_type**: *[FieldType](../enums/fieldtype.md)*

*Inherited from [AnyDataType](anydatatype.md).[field_type](anydatatype.md#field_type)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:78](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L78)*

The field type here may be the field type specified
in the type_config

___

### `Optional` tokenizer

• **tokenizer**? : *undefined | false | true*

*Inherited from [TermLikeAST](termlikeast.md).[tokenizer](termlikeast.md#optional-tokenizer)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:48](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L48)*

___

###  type

• **type**: *[Term](../enums/asttype.md#term)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:165](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L165)*

___

###  value

• **value**: *string | number | boolean | any*

*Inherited from [AnyDataType](anydatatype.md).[value](anydatatype.md#value)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:79](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L79)*
