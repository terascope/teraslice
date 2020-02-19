---
title: xLucene Parser: `SyntaxError`
sidebar_label: SyntaxError
---

# Class: SyntaxError

## Hierarchy

* Error

  ↳ **SyntaxError**

## Index

### Constructors

* [constructor](syntaxerror.md#constructor)

### Properties

* [expected](syntaxerror.md#expected)
* [found](syntaxerror.md#found)
* [location](syntaxerror.md#location)
* [message](syntaxerror.md#message)
* [name](syntaxerror.md#name)
* [stack](syntaxerror.md#optional-stack)
* [Error](syntaxerror.md#static-error)

### Methods

* [buildMessage](syntaxerror.md#static-buildmessage)

## Constructors

###  constructor

\+ **new SyntaxError**(`message`: string, `expected`: [Expectation](../overview.md#expectation)[], `found`: string | null, `location`: [IFileRange](../interfaces/ifilerange.md)): *[SyntaxError](syntaxerror.md)*

Defined in packages/xlucene-parser/src/peg-engine.ts:147

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`expected` | [Expectation](../overview.md#expectation)[] |
`found` | string &#124; null |
`location` | [IFileRange](../interfaces/ifilerange.md) |

**Returns:** *[SyntaxError](syntaxerror.md)*

## Properties

###  expected

• **expected**: *[Expectation](../overview.md#expectation)[]*

Defined in packages/xlucene-parser/src/peg-engine.ts:144

___

###  found

• **found**: *string | null*

Defined in packages/xlucene-parser/src/peg-engine.ts:145

___

###  location

• **location**: *[IFileRange](../interfaces/ifilerange.md)*

Defined in packages/xlucene-parser/src/peg-engine.ts:146

___

###  message

• **message**: *string*

*Overrides void*

Defined in packages/xlucene-parser/src/peg-engine.ts:143

___

###  name

• **name**: *string*

*Overrides void*

Defined in packages/xlucene-parser/src/peg-engine.ts:147

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es5.d.ts:975

___

### `Static` Error

▪ **Error**: *ErrorConstructor*

Defined in node_modules/typescript/lib/lib.es5.d.ts:984

## Methods

### `Static` buildMessage

▸ **buildMessage**(`expected`: [Expectation](../overview.md#expectation)[], `found`: string | null): *string*

Defined in packages/xlucene-parser/src/peg-engine.ts:53

**Parameters:**

Name | Type |
------ | ------ |
`expected` | [Expectation](../overview.md#expectation)[] |
`found` | string &#124; null |

**Returns:** *string*
