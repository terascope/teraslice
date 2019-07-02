---
title: Utils Errors Tserror
sidebar_label: Errors Tserror
---

> Errors Tserror for @terascope/utils

[Globals](../overview.md) / ["errors"](../modules/_errors_.md) / [TSError](_errors_.tserror.md) /

# Class: TSError

A custom Error class with additional properties,
like statusCode and fatalError

## Hierarchy

* `Error`

  * **TSError**

### Index

#### Constructors

* [constructor](_errors_.tserror.md#constructor)

#### Properties

* [code](_errors_.tserror.md#code)
* [context](_errors_.tserror.md#context)
* [fatalError](_errors_.tserror.md#fatalerror)
* [message](_errors_.tserror.md#message)
* [name](_errors_.tserror.md#name)
* [retryable](_errors_.tserror.md#optional-retryable)
* [stack](_errors_.tserror.md#optional-stack)
* [statusCode](_errors_.tserror.md#statuscode)
* [Error](_errors_.tserror.md#static-error)

#### Methods

* [cause](_errors_.tserror.md#cause)

## Constructors

###  constructor

\+ **new TSError**(`input`: *any*, `config`: *[TSErrorConfig](../interfaces/_errors_.tserrorconfig.md)*): *[TSError](_errors_.tserror.md)*

*Defined in [errors.ts:37](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L37)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`config` | [TSErrorConfig](../interfaces/_errors_.tserrorconfig.md) |  {} |

**Returns:** *[TSError](_errors_.tserror.md)*

## Properties

###  code

• **code**: *string*

*Defined in [errors.ts:15](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L15)*

An descriptive error code that specifies the error type, this follows more
node convention

___

###  context

• **context**: *[TSErrorContext](../interfaces/_errors_.tserrorcontext.md)*

*Defined in [errors.ts:37](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L37)*

Additional context metadata

___

###  fatalError

• **fatalError**: *boolean*

*Defined in [errors.ts:25](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L25)*

Used to indicate the an error is fatal

___

###  message

• **message**: *string*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:974](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L974)*

___

###  name

• **name**: *string*

*Inherited from void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:973](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L973)*

___

### `Optional` retryable

• **retryable**? : *undefined | false | true*

*Defined in [errors.ts:32](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L32)*

Used sometimes to indicate whether an error is retryable

If this is not set then it is better not to assume either way

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from void*

*Overrides void*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:975](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L975)*

___

###  statusCode

• **statusCode**: *number*

*Defined in [errors.ts:20](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L20)*

A HTTP status code for easy use

___

### `Static` Error

▪ **Error**: *`ErrorConstructor`*

*Defined in [/Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:984](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils//Users/peter/Projects/teraslice/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts#L984)*

## Methods

###  cause

▸ **cause**(): *any*

*Defined in [errors.ts:67](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/errors.ts#L67)*

**Returns:** *any*
