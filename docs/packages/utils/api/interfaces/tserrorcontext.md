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

*Defined in [packages/utils/src/errors.ts:129](https://github.com/terascope/teraslice/blob/78714a985/packages/utils/src/errors.ts#L129)*

___

###  _createdAt

• **_createdAt**: *string*

*Defined in [packages/utils/src/errors.ts:128](https://github.com/terascope/teraslice/blob/78714a985/packages/utils/src/errors.ts#L128)*

ISO Date string

___

### `Optional` safe

• **safe**? : *undefined | false | true*

*Defined in [packages/utils/src/errors.ts:133](https://github.com/terascope/teraslice/blob/78714a985/packages/utils/src/errors.ts#L133)*

Used to indicate the error message is safe to log and send to the user
