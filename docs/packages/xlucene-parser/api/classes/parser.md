---
title: xLucene Parser: `Parser`
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
* [variables](parser.md#variables)

### Methods

* [forTermTypes](parser.md#fortermtypes)
* [forTypes](parser.md#fortypes)

## Constructors

###  constructor

\+ **new Parser**(`query`: string, `options`: [ParserOptions](../interfaces/parseroptions.md)): *[Parser](parser.md)*

*Defined in [packages/xlucene-parser/src/parser.ts:18](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/parser.ts#L18)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | string | - |
`options` | [ParserOptions](../interfaces/parseroptions.md) |  {} |

**Returns:** *[Parser](parser.md)*

## Properties

###  ast

• **ast**: *i.AST*

*Defined in [packages/xlucene-parser/src/parser.ts:15](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/parser.ts#L15)*

___

###  logger

• **logger**: *Logger*

*Defined in [packages/xlucene-parser/src/parser.ts:18](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/parser.ts#L18)*

___

###  query

• **query**: *string*

*Defined in [packages/xlucene-parser/src/parser.ts:16](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/parser.ts#L16)*

___

###  variables

• **variables**: *xLuceneVariables*

*Defined in [packages/xlucene-parser/src/parser.ts:17](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/parser.ts#L17)*

## Methods

###  forTermTypes

▸ **forTermTypes**(`cb`: function): *void*

*Defined in [packages/xlucene-parser/src/parser.ts:84](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/parser.ts#L84)*

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

*Defined in [packages/xlucene-parser/src/parser.ts:56](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/parser.ts#L56)*

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
