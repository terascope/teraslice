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
* [type](regexp.md#type)
* [value](regexp.md#value)

## Properties

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [parser/interfaces.ts:46](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L46)*

___

###  field_type

• **field_type**: *[String](../enums/fieldtype.md#string)*

*Inherited from [StringDataType](stringdatatype.md).[field_type](stringdatatype.md#field_type)*

*Defined in [parser/interfaces.ts:86](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L86)*

___

###  quoted

• **quoted**: *boolean*

*Inherited from [StringDataType](stringdatatype.md).[quoted](stringdatatype.md#quoted)*

*Defined in [parser/interfaces.ts:88](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L88)*

___

### `Optional` restricted

• **restricted**? : *undefined | false | true*

*Inherited from [StringDataType](stringdatatype.md).[restricted](stringdatatype.md#optional-restricted)*

*Defined in [parser/interfaces.ts:89](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L89)*

___

###  type

• **type**: *[Regexp](../enums/asttype.md#regexp)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [parser/interfaces.ts:155](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L155)*

___

###  value

• **value**: *string*

*Inherited from [StringDataType](stringdatatype.md).[value](stringdatatype.md#value)*

*Defined in [parser/interfaces.ts:87](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L87)*
