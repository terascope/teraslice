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

* [analyzed](term.md#optional-analyzed)
* [field](term.md#field)
* [field_type](term.md#field_type)
* [type](term.md#type)
* [value](term.md#value)

## Properties

### `Optional` analyzed

• **analyzed**? : *undefined | false | true*

*Inherited from [TermLikeAST](termlikeast.md).[analyzed](termlikeast.md#optional-analyzed)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:41](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/interfaces.ts#L41)*

___

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:40](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/interfaces.ts#L40)*

___

###  field_type

• **field_type**: *xLuceneFieldType*

*Inherited from [AnyDataType](anydatatype.md).[field_type](anydatatype.md#field_type)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:71](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/interfaces.ts#L71)*

The field type here may be the field type specified
in the type_config

___

###  type

• **type**: *[Term](../enums/asttype.md#term)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:158](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/interfaces.ts#L158)*

___

###  value

• **value**: *string | number | boolean | any*

*Inherited from [AnyDataType](anydatatype.md).[value](anydatatype.md#value)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:72](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/interfaces.ts#L72)*
