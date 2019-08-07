---
title: Utils: `TSErrorConfig`
sidebar_label: TSErrorConfig
---

# Interface: TSErrorConfig

## Hierarchy

* **TSErrorConfig**

## Index

### Properties

* [code](tserrorconfig.md#optional-code)
* [context](tserrorconfig.md#optional-context)
* [defaultErrorMsg](tserrorconfig.md#optional-defaulterrormsg)
* [defaultStatusCode](tserrorconfig.md#optional-defaultstatuscode)
* [fatalError](tserrorconfig.md#optional-fatalerror)
* [message](tserrorconfig.md#optional-message)
* [reason](tserrorconfig.md#optional-reason)
* [retryable](tserrorconfig.md#optional-retryable)
* [statusCode](tserrorconfig.md#optional-statuscode)

## Properties

### `Optional` code

• **code**? : *undefined | string*

*Defined in [errors.ts:77](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/errors.ts#L77)*

An descriptive error code that specifies the error type, this follows more
node convention

___

### `Optional` context

• **context**? : *[AnyObject](anyobject.md)*

*Defined in [errors.ts:107](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/errors.ts#L107)*

Attach any context metadata to the error

___

### `Optional` defaultErrorMsg

• **defaultErrorMsg**? : *undefined | string*

*Defined in [errors.ts:110](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/errors.ts#L110)*

___

### `Optional` defaultStatusCode

• **defaultStatusCode**? : *undefined | number*

*Defined in [errors.ts:109](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/errors.ts#L109)*

___

### `Optional` fatalError

• **fatalError**? : *undefined | false | true*

*Defined in [errors.ts:87](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/errors.ts#L87)*

Used to indicate the an error is fatal

___

### `Optional` message

• **message**? : *undefined | string*

*Defined in [errors.ts:102](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/errors.ts#L102)*

Override the message when given an error

___

### `Optional` reason

• **reason**? : *undefined | string*

*Defined in [errors.ts:97](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/errors.ts#L97)*

Prefix the error message with a reason

___

### `Optional` retryable

• **retryable**? : *undefined | false | true*

*Defined in [errors.ts:92](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/errors.ts#L92)*

Used sometimes to indicate whether an error is retryable

___

### `Optional` statusCode

• **statusCode**? : *undefined | number*

*Defined in [errors.ts:82](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/utils/src/errors.ts#L82)*

A HTTP status code for easy use
