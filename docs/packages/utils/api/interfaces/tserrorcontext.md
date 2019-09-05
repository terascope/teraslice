---
title: Utils: `TSErrorContext`
sidebar_label: TSErrorContext
---

# Interface: TSErrorContext

## Hierarchy

* [AnyObject](anyobject.md)

  * **TSErrorContext**

## Indexable

* \[ **prop**: *string*\]: any

## Index

### Properties

* [_cause](tserrorcontext.md#_cause)
* [_createdAt](tserrorcontext.md#_createdat)
* [safe](tserrorcontext.md#optional-safe)

## Properties

###  _cause

• **_cause**: *any*

*Defined in [errors.ts:120](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/errors.ts#L120)*

___

###  _createdAt

• **_createdAt**: *string*

*Defined in [errors.ts:119](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/errors.ts#L119)*

ISO Date string

___

### `Optional` safe

• **safe**? : *undefined | false | true*

*Defined in [errors.ts:124](https://github.com/terascope/teraslice/blob/0ae31df4/packages/utils/src/errors.ts#L124)*

Used to indicate the error message is safe to log and send to the user
