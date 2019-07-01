> **[utils](../README.md)**

[Globals](../README.md) / ["errors"](../modules/_errors_.md) / [TSErrorContext](_errors_.tserrorcontext.md) /

# Interface: TSErrorContext

## Hierarchy

* [AnyObject](_interfaces_.anyobject.md)

  * **TSErrorContext**

## Indexable

● \[▪ **prop**: *string*\]: any

### Index

#### Properties

* [_cause](_errors_.tserrorcontext.md#_cause)
* [_createdAt](_errors_.tserrorcontext.md#_createdat)
* [safe](_errors_.tserrorcontext.md#optional-safe)

## Properties

###  _cause

• **_cause**: *any*

*Defined in [errors.ts:111](https://github.com/terascope/teraslice/tree/683dac73cdbcf5a70581ac5c9ea14ddddf69eb91/packages/utils/errors.ts#L111)*

___

###  _createdAt

• **_createdAt**: *string*

*Defined in [errors.ts:110](https://github.com/terascope/teraslice/tree/683dac73cdbcf5a70581ac5c9ea14ddddf69eb91/packages/utils/errors.ts#L110)*

ISO Date string

___

### `Optional` safe

• **safe**? : *undefined | false | true*

*Defined in [errors.ts:115](https://github.com/terascope/teraslice/tree/683dac73cdbcf5a70581ac5c9ea14ddddf69eb91/packages/utils/errors.ts#L115)*

Used to indicate the error message is safe to log and send to the user