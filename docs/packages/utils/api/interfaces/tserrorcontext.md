---
title: Utils Tserrorcontext
sidebar_label: Tserrorcontext
---

[TSErrorContext](tserrorcontext.md) /

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

*Defined in [src/errors.ts:111](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L111)*

___

###  _createdAt

• **_createdAt**: *string*

*Defined in [src/errors.ts:110](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L110)*

ISO Date string

___

### `Optional` safe

• **safe**? : *undefined | false | true*

*Defined in [src/errors.ts:115](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/utils/src/errors.ts#L115)*

Used to indicate the error message is safe to log and send to the user
