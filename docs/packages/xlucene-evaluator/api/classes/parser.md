---
title: Xlucene Evaluator: `Parser`
sidebar_label: Parser
---

# Class: Parser

## Hierarchy

* **Parser**

## Index

### Constructors

* [constructor](parser.md#constructor)

### Properties

* [ast](parser.md#ast)
* [logger](parser.md#logger)
* [query](parser.md#query)

### Methods

* [forTermTypes](parser.md#fortermtypes)
* [forTypes](parser.md#fortypes)

## Constructors

###  constructor

\+ **new Parser**(`query`: string, `options`: [ParserOptions](../interfaces/parseroptions.md)): *[Parser](parser.md)*

*Defined in [parser/parser.ts:16](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/parser.ts#L16)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | string | - |
`options` | [ParserOptions](../interfaces/parseroptions.md) |  {} |

**Returns:** *[Parser](parser.md)*

## Properties

###  ast

• **ast**: *i.AST*

*Defined in [parser/parser.ts:14](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/parser.ts#L14)*

___

###  logger

• **logger**: *Logger*

*Defined in [parser/parser.ts:16](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/parser.ts#L16)*

___

###  query

• **query**: *string*

*Defined in [parser/parser.ts:15](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/parser.ts#L15)*

## Methods

###  forTermTypes

▸ **forTermTypes**(`cb`: function): *void*

*Defined in [parser/parser.ts:80](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/parser.ts#L80)*

**Parameters:**

▪ **cb**: *function*

▸ (`node`: i.TermLike): *void*

**Parameters:**

Name | Type |
------ | ------ |
`node` | i.TermLike |

**Returns:** *void*

___

###  forTypes

▸ **forTypes**<**T**>(`types`: T, `cb`: function): *void*

*Defined in [parser/parser.ts:52](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/parser.ts#L52)*

**Type parameters:**

▪ **T**: *[ASTType](../enums/asttype.md)[]*

**Parameters:**

▪ **types**: *T*

▪ **cb**: *function*

▸ (`node`: i.AnyAST): *void*

**Parameters:**

Name | Type |
------ | ------ |
`node` | i.AnyAST |

**Returns:** *void*
