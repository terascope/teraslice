---
title: xLucene Parser: `Term`
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

*Defined in [packages/xlucene-parser/src/interfaces.ts:40](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L40)*

___

###  field_type

• **field_type**: *XluceneFieldType*

*Inherited from [AnyDataType](anydatatype.md).[field_type](anydatatype.md#field_type)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:71](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L71)*

The field type here may be the field type specified
in the type_config

___

### `Optional` tokenizer

• **tokenizer**? : *undefined | false | true*

*Inherited from [TermLikeAST](termlikeast.md).[tokenizer](termlikeast.md#optional-tokenizer)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:41](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L41)*

___

###  type

• **type**: *[Term](../enums/asttype.md#term)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:158](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L158)*

___

###  value

• **value**: *string | number | boolean | any*

*Inherited from [AnyDataType](anydatatype.md).[value](anydatatype.md#value)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:72](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L72)*
