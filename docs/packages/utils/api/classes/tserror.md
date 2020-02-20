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

*Defined in [packages/utils/src/errors.ts:48](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L48)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`config` | [TSErrorConfig](../interfaces/tserrorconfig.md) |  {} |

**Returns:** *[TSError](tserror.md)*

## Properties

###  code

• **code**: *string*

*Defined in [packages/utils/src/errors.ts:18](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L18)*

An descriptive error code that specifies the error type, this follows more
node convention

___

###  context

• **context**: *[TSErrorContext](../interfaces/tserrorcontext.md)*

*Defined in [packages/utils/src/errors.ts:40](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L40)*

Additional context metadata

___

###  fatalError

• **fatalError**: *boolean*

*Defined in [packages/utils/src/errors.ts:28](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L28)*

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

*Defined in [packages/utils/src/errors.ts:35](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L35)*

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

*Defined in [packages/utils/src/errors.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L23)*

A HTTP status code for easy use

___

### `Static` Error

▪ **Error**: *ErrorConstructor*

Defined in node_modules/typescript/lib/lib.es5.d.ts:984

## Methods

###  cause

▸ **cause**(): *any*

*Defined in [packages/utils/src/errors.ts:80](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L80)*

**Returns:** *any*

___

### `Static` [Symbol.hasInstance]

▸ **[Symbol.hasInstance]**(`instance`: any): *boolean*

*Defined in [packages/utils/src/errors.ts:42](https://github.com/terascope/teraslice/blob/653cf7530/packages/utils/src/errors.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`instance` | any |

**Returns:** *boolean*
