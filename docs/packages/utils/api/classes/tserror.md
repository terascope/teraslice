---
title: Utils: `TSError`
sidebar_label: TSError
---

# Class: TSError

A custom Error class with additional properties,
like statusCode and fatalError

## Hierarchy

* Error

  ↳ **TSError**

## Index

### Constructors

* [constructor](tserror.md#constructor)

### Properties

* [code](tserror.md#code)
* [context](tserror.md#context)
* [fatalError](tserror.md#fatalerror)
* [message](tserror.md#message)
* [name](tserror.md#name)
* [retryable](tserror.md#optional-retryable)
* [stack](tserror.md#optional-stack)
* [statusCode](tserror.md#statuscode)
* [Error](tserror.md#static-error)

### Methods

* [cause](tserror.md#cause)
* [[Symbol.hasInstance]](tserror.md#static-[symbol.hasinstance])

## Constructors

###  constructor

\+ **new TSError**(`input`: any, `config`: [TSErrorConfig](../interfaces/tserrorconfig.md)): *[TSError](tserror.md)*

*Defined in [packages/utils/src/errors.ts:49](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L49)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`config` | [TSErrorConfig](../interfaces/tserrorconfig.md) |  {} |

**Returns:** *[TSError](tserror.md)*

## Properties

###  code

• **code**: *string*

*Defined in [packages/utils/src/errors.ts:19](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L19)*

An descriptive error code that specifies the error type, this follows more
node convention

___

###  context

• **context**: *[TSErrorContext](../interfaces/tserrorcontext.md)*

*Defined in [packages/utils/src/errors.ts:41](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L41)*

Additional context metadata

___

###  fatalError

• **fatalError**: *boolean*

*Defined in [packages/utils/src/errors.ts:29](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L29)*

Used to indicate the an error is fatal

___

###  message

• **message**: *string*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es5.d.ts:974

___

###  name

• **name**: *string*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es5.d.ts:973

___

### `Optional` retryable

• **retryable**? : *undefined | false | true*

*Defined in [packages/utils/src/errors.ts:36](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L36)*

Used sometimes to indicate whether an error is retryable

If this is not set then it is better not to assume either way

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from void*

Defined in node_modules/typescript/lib/lib.es5.d.ts:975

___

###  statusCode

• **statusCode**: *number*

*Defined in [packages/utils/src/errors.ts:24](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L24)*

A HTTP status code for easy use

___

### `Static` Error

▪ **Error**: *ErrorConstructor*

Defined in node_modules/typescript/lib/lib.es5.d.ts:984

## Methods

###  cause

▸ **cause**(): *any*

*Defined in [packages/utils/src/errors.ts:81](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L81)*

**Returns:** *any*

___

### `Static` [Symbol.hasInstance]

▸ **[Symbol.hasInstance]**(`instance`: any): *boolean*

*Defined in [packages/utils/src/errors.ts:43](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/errors.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`instance` | any |

**Returns:** *boolean*
