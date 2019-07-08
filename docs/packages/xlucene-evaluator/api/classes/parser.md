---
title: Xlucene Evaluator: `Parser`
sidebar_label: Parser
---

# Class: Parser

## Hierarchy

* **Parser**

### Index

#### Constructors

* [constructor](parser.md#constructor)

#### Properties

* [ast](parser.md#ast)
* [logger](parser.md#logger)
* [query](parser.md#query)

#### Methods

* [forTermTypes](parser.md#fortermtypes)
* [forTypes](parser.md#fortypes)

## Constructors

###  constructor

\+ **new Parser**(`query`: *string*, `logger?`: *`Logger`*): *[Parser](parser.md)*

*Defined in [parser/parser.ts:11](https://github.com/terascope/teraslice/blob/a2250fb9/packages/xlucene-evaluator/src/parser/parser.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | string |
`logger?` | `Logger` |

**Returns:** *[Parser](parser.md)*

## Properties

###  ast

• **ast**: *`i.AST`*

*Defined in [parser/parser.ts:9](https://github.com/terascope/teraslice/blob/a2250fb9/packages/xlucene-evaluator/src/parser/parser.ts#L9)*

___

###  logger

• **logger**: *`Logger`*

*Defined in [parser/parser.ts:11](https://github.com/terascope/teraslice/blob/a2250fb9/packages/xlucene-evaluator/src/parser/parser.ts#L11)*

___

###  query

• **query**: *string*

*Defined in [parser/parser.ts:10](https://github.com/terascope/teraslice/blob/a2250fb9/packages/xlucene-evaluator/src/parser/parser.ts#L10)*

## Methods

###  forTermTypes

▸ **forTermTypes**(`cb`: *function*): *void*

*Defined in [parser/parser.ts:70](https://github.com/terascope/teraslice/blob/a2250fb9/packages/xlucene-evaluator/src/parser/parser.ts#L70)*

**Parameters:**

▪ **cb**: *function*

▸ (`node`: *`i.TermLike`*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`node` | `i.TermLike` |

**Returns:** *void*

___

###  forTypes

▸ **forTypes**<**T**>(`types`: *`T`*, `cb`: *function*): *void*

*Defined in [parser/parser.ts:41](https://github.com/terascope/teraslice/blob/a2250fb9/packages/xlucene-evaluator/src/parser/parser.ts#L41)*

**Type parameters:**

▪ **T**: *[ASTType](../enums/asttype.md)[]*

**Parameters:**

▪ **types**: *`T`*

▪ **cb**: *function*

▸ (`node`: *`i.AnyAST`*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`node` | `i.AnyAST` |

**Returns:** *void*
