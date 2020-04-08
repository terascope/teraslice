---
title: Utils: `PRetryConfig`
sidebar_label: PRetryConfig
---

# Interface: PRetryConfig

## Hierarchy

* **PRetryConfig**

## Index

### Properties

* [backoff](pretryconfig.md#backoff)
* [delay](pretryconfig.md#delay)
* [endWithFatal](pretryconfig.md#endwithfatal)
* [logError](pretryconfig.md#logerror)
* [matches](pretryconfig.md#optional-matches)
* [maxDelay](pretryconfig.md#maxdelay)
* [reason](pretryconfig.md#optional-reason)
* [retries](pretryconfig.md#retries)

## Properties

###  backoff

• **backoff**: *number*

*Defined in [packages/utils/src/promises.ts:55](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L55)*

The backoff multiplier

**`default`** 2

___

###  delay

• **delay**: *number*

*Defined in [packages/utils/src/promises.ts:41](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L41)*

The initial time to delay before retrying the function

**`default`** 500

___

###  endWithFatal

• **endWithFatal**: *boolean*

*Defined in [packages/utils/src/promises.ts:60](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L60)*

If set to true, this will set fail with fatalError to true

___

###  logError

• **logError**: *function*

*Defined in [packages/utils/src/promises.ts:70](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L70)*

Log function for logging any errors that occurred

#### Type declaration:

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

___

### `Optional` matches

• **matches**? : *string | RegExp‹›[]*

*Defined in [packages/utils/src/promises.ts:77](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L77)*

If this not specified or is empty, all errors will be treated as retryable.
If any of the items in the array match the error message,
it will be considered retryable

___

###  maxDelay

• **maxDelay**: *number*

*Defined in [packages/utils/src/promises.ts:48](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L48)*

The maximum time to delay when retrying in milliseconds

**`default`** 60000

___

### `Optional` reason

• **reason**? : *undefined | string*

*Defined in [packages/utils/src/promises.ts:65](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L65)*

Set a error message prefix

___

###  retries

• **retries**: *number*

*Defined in [packages/utils/src/promises.ts:34](https://github.com/terascope/teraslice/blob/b843209f9/packages/utils/src/promises.ts#L34)*

The number of retries to attempt before failing.
This does not include the initial attempt

**`default`** 3
