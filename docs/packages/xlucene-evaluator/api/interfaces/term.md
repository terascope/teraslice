---
title: Xlucene Evaluator: `Term`
sidebar_label: Term
---

# Interface: Term

## Hierarchy

* [AnyDataType](anydatatype.md)

* [TermLikeAST](termlikeast.md)

  * **Term**

## Index

### Properties

* [field](term.md#field)
* [field_type](term.md#field_type)
* [type](term.md#type)
* [value](term.md#value)

## Properties

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [parser/interfaces.ts:54](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L54)*

___

###  field_type

• **field_type**: *[FieldType](../enums/fieldtype.md)*

*Inherited from [AnyDataType](anydatatype.md).[field_type](anydatatype.md#field_type)*

*Defined in [parser/interfaces.ts:83](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L83)*

The field type here may be the field type specified
in the type_config

___

###  type

• **type**: *[Term](../enums/asttype.md#term)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [parser/interfaces.ts:166](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L166)*

___

###  value

• **value**: *string | number | boolean*

*Inherited from [AnyDataType](anydatatype.md).[value](anydatatype.md#value)*

*Defined in [parser/interfaces.ts:84](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L84)*
