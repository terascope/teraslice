---
title: xLucene Evaluator: `Wildcard`
sidebar_label: Wildcard
---

# Interface: Wildcard

## Hierarchy

* [StringDataType](stringdatatype.md)

* [TermLikeAST](termlikeast.md)

  ↳ **Wildcard**

## Index

### Properties

* [field](wildcard.md#field)
* [field_type](wildcard.md#field_type)
* [quoted](wildcard.md#quoted)
* [restricted](wildcard.md#optional-restricted)
* [tokenizer](wildcard.md#optional-tokenizer)
* [type](wildcard.md#type)
* [value](wildcard.md#value)

## Properties

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:47](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L47)*

___

###  field_type

• **field_type**: *[String](../enums/fieldtype.md#string)*

*Inherited from [StringDataType](stringdatatype.md).[field_type](stringdatatype.md#field_type)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:88](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L88)*

___

###  quoted

• **quoted**: *boolean*

*Inherited from [StringDataType](stringdatatype.md).[quoted](stringdatatype.md#quoted)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:90](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L90)*

___

### `Optional` restricted

• **restricted**? : *undefined | false | true*

*Inherited from [StringDataType](stringdatatype.md).[restricted](stringdatatype.md#optional-restricted)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:91](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L91)*

___

### `Optional` tokenizer

• **tokenizer**? : *undefined | false | true*

*Inherited from [TermLikeAST](termlikeast.md).[tokenizer](termlikeast.md#optional-tokenizer)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:48](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L48)*

___

###  type

• **type**: *[Wildcard](../enums/asttype.md#wildcard)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:161](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L161)*

___

###  value

• **value**: *string*

*Inherited from [StringDataType](stringdatatype.md).[value](stringdatatype.md#value)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:89](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L89)*
