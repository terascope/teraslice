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

*Defined in [packages/utils/src/errors.ts:91](https://github.com/terascope/teraslice/blob/f95bb5556/packages/utils/src/errors.ts#L91)*

An descriptive error code that specifies the error type, this follows more
node convention

___

### `Optional` context

• **context**? : *[AnyObject](anyobject.md)*

*Defined in [packages/utils/src/errors.ts:121](https://github.com/terascope/teraslice/blob/f95bb5556/packages/utils/src/errors.ts#L121)*

Attach any context metadata to the error

___

### `Optional` defaultErrorMsg

• **defaultErrorMsg**? : *undefined | string*

*Defined in [packages/utils/src/errors.ts:124](https://github.com/terascope/teraslice/blob/f95bb5556/packages/utils/src/errors.ts#L124)*

___

### `Optional` defaultStatusCode

• **defaultStatusCode**? : *undefined | number*

*Defined in [packages/utils/src/errors.ts:123](https://github.com/terascope/teraslice/blob/f95bb5556/packages/utils/src/errors.ts#L123)*

___

### `Optional` fatalError

• **fatalError**? : *undefined | false | true*

*Defined in [packages/utils/src/errors.ts:101](https://github.com/terascope/teraslice/blob/f95bb5556/packages/utils/src/errors.ts#L101)*

Used to indicate the an error is fatal

___

### `Optional` message

• **message**? : *undefined | string*

*Defined in [packages/utils/src/errors.ts:116](https://github.com/terascope/teraslice/blob/f95bb5556/packages/utils/src/errors.ts#L116)*

Override the message when given an error

___

### `Optional` reason

• **reason**? : *undefined | string*

*Defined in [packages/utils/src/errors.ts:111](https://github.com/terascope/teraslice/blob/f95bb5556/packages/utils/src/errors.ts#L111)*

Prefix the error message with a reason

___

### `Optional` retryable

• **retryable**? : *undefined | false | true*

*Defined in [packages/utils/src/errors.ts:106](https://github.com/terascope/teraslice/blob/f95bb5556/packages/utils/src/errors.ts#L106)*

Used sometimes to indicate whether an error is retryable

___

### `Optional` statusCode

• **statusCode**? : *undefined | number*

*Defined in [packages/utils/src/errors.ts:96](https://github.com/terascope/teraslice/blob/f95bb5556/packages/utils/src/errors.ts#L96)*

A HTTP status code for easy use
