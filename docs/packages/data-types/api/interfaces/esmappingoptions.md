---
title: Data Types: `ESMappingOptions`
sidebar_label: ESMappingOptions
---

# Interface: ESMappingOptions

## Hierarchy

* **ESMappingOptions**

## Index

### Properties

* [overrides](esmappingoptions.md#optional-overrides)
* [typeName](esmappingoptions.md#optional-typename)
* [version](esmappingoptions.md#optional-version)

## Properties

### `Optional` overrides

• **overrides**? : *Partial‹[ESMapping](esmapping.md)›*

*Defined in [interfaces.ts:160](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/interfaces.ts#L160)*

Any elasitcsearch mapping overrides,
uses a deep assignment so nested fields can be overwritten.

___

### `Optional` typeName

• **typeName**? : *undefined | string*

*Defined in [interfaces.ts:155](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/interfaces.ts#L155)*

The elasticsearch index type

___

### `Optional` version

• **version**? : *undefined | number*

*Defined in [interfaces.ts:166](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/interfaces.ts#L166)*

The version of the elasticsearch cluster

**`default`** 6
