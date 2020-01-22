---
title: xLucene Evaluator: `Regexp`
sidebar_label: Regexp
---

# Interface: Regexp

## Hierarchy

* [StringDataType](stringdatatype.md)

* [TermLikeAST](termlikeast.md)

  ↳ **Regexp**

## Index

### Properties

* [field](regexp.md#field)
* [field_type](regexp.md#field_type)
* [quoted](regexp.md#quoted)
* [restricted](regexp.md#optional-restricted)
* [tokenizer](regexp.md#optional-tokenizer)
* [type](regexp.md#type)
* [value](regexp.md#value)

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

• **type**: *[Regexp](../enums/asttype.md#regexp)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:157](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L157)*

___

###  value

• **value**: *string*

*Inherited from [StringDataType](stringdatatype.md).[value](stringdatatype.md#value)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:89](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L89)*
