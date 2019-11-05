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

*Defined in [errors.ts:89](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L89)*

An descriptive error code that specifies the error type, this follows more
node convention

___

### `Optional` context

• **context**? : *[AnyObject](anyobject.md)*

*Defined in [errors.ts:119](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L119)*

Attach any context metadata to the error

___

### `Optional` defaultErrorMsg

• **defaultErrorMsg**? : *undefined | string*

*Defined in [errors.ts:122](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L122)*

___

### `Optional` defaultStatusCode

• **defaultStatusCode**? : *undefined | number*

*Defined in [errors.ts:121](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L121)*

___

### `Optional` fatalError

• **fatalError**? : *undefined | false | true*

*Defined in [errors.ts:99](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L99)*

Used to indicate the an error is fatal

___

### `Optional` message

• **message**? : *undefined | string*

*Defined in [errors.ts:114](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L114)*

Override the message when given an error

___

### `Optional` reason

• **reason**? : *undefined | string*

*Defined in [errors.ts:109](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L109)*

Prefix the error message with a reason

___

### `Optional` retryable

• **retryable**? : *undefined | false | true*

*Defined in [errors.ts:104](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L104)*

Used sometimes to indicate whether an error is retryable

___

### `Optional` statusCode

• **statusCode**? : *undefined | number*

*Defined in [errors.ts:94](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L94)*

A HTTP status code for easy use
