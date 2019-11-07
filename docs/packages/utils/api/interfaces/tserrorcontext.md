---
title: Utils: `TSErrorContext`
sidebar_label: TSErrorContext
---

# Interface: TSErrorContext

## Hierarchy

* [AnyObject](anyobject.md)

  ↳ **TSErrorContext**

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

*Defined in [errors.ts:128](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L128)*

___

###  _createdAt

• **_createdAt**: *string*

*Defined in [errors.ts:127](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L127)*

ISO Date string

___

### `Optional` safe

• **safe**? : *undefined | false | true*

*Defined in [errors.ts:132](https://github.com/terascope/teraslice/blob/d8feecc03/packages/utils/src/errors.ts#L132)*

Used to indicate the error message is safe to log and send to the user
