---
title: Utils: `TSError`
sidebar_label: TSError
---

# Class: TSError

A custom Error class with additional properties,
like statusCode and fatalError

## Hierarchy

* `Error`

  * **TSError**

### Index

#### Constructors

* [constructor](tserror.md#constructor)

#### Properties

* [code](tserror.md#code)
* [context](tserror.md#context)
* [fatalError](tserror.md#fatalerror)
* [message](tserror.md#message)
* [name](tserror.md#name)
* [retryable](tserror.md#optional-retryable)
* [stack](tserror.md#optional-stack)
* [statusCode](tserror.md#statuscode)
* [Error](tserror.md#static-error)

#### Methods

* [cause](tserror.md#cause)

## Constructors

###  constructor

\+ **new TSError**(`input`: *any*, `config`: *[TSErrorConfig](../interfaces/tserrorconfig.md)*): *[TSError](tserror.md)*

*Defined in [errors.ts:37](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/utils/src/errors.ts#L37)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`config` | [TSErrorConfig](../interfaces/tserrorconfig.md) |  {} |

**Returns:** *[TSError](tserror.md)*

## Properties

###  code

• **code**: *string*

*Defined in [errors.ts:15](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/utils/src/errors.ts#L15)*

An descriptive error code that specifies the error type, this follows more
node convention

___

###  context

• **context**: *[TSErrorContext](../interfaces/tserrorcontext.md)*

*Defined in [errors.ts:37](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/utils/src/errors.ts#L37)*

Additional context metadata

___

###  fatalError

• **fatalError**: *boolean*

*Defined in [errors.ts:25](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/utils/src/errors.ts#L25)*

Used to indicate the an error is fatal

___

###  message

• **message**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:974

___

###  name

• **name**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:973

___

### `Optional` retryable

• **retryable**? : *undefined | false | true*

*Defined in [errors.ts:32](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/utils/src/errors.ts#L32)*

Used sometimes to indicate whether an error is retryable

If this is not set then it is better not to assume either way

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:975

___

###  statusCode

• **statusCode**: *number*

*Defined in [errors.ts:20](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/utils/src/errors.ts#L20)*

A HTTP status code for easy use

___

### `Static` Error

▪ **Error**: *`ErrorConstructor`*

Defined in /Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:984

## Methods

###  cause

▸ **cause**(): *any*

*Defined in [errors.ts:67](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/utils/src/errors.ts#L67)*

**Returns:** *any*

