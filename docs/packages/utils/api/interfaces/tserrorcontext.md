---
title: Utils: `TSErrorContext`
sidebar_label: TSErrorContext
---

# Interface: TSErrorContext

## Hierarchy

* [AnyObject](anyobject.md)

  * **TSErrorContext**

## Indexable

● \[▪ **prop**: *string*\]: any

### Index

#### Properties

* [_cause](tserrorcontext.md#_cause)
* [_createdAt](tserrorcontext.md#_createdat)
* [safe](tserrorcontext.md#optional-safe)

## Properties

###  _cause

• **_cause**: *any*

*Defined in [errors.ts:111](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/utils/src/errors.ts#L111)*

___

###  _createdAt

• **_createdAt**: *string*

*Defined in [errors.ts:110](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/utils/src/errors.ts#L110)*

ISO Date string

___

### `Optional` safe

• **safe**? : *undefined | false | true*

*Defined in [errors.ts:115](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/utils/src/errors.ts#L115)*

Used to indicate the error message is safe to log and send to the user
