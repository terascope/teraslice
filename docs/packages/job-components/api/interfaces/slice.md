---
title: Job Components: `Slice`
sidebar_label: Slice
---

# Interface: Slice

A trackable set of work to be preformed by a "Worker"

## Hierarchy

* **Slice**

## Index

### Properties

* [_created](slice.md#_created)
* [request](slice.md#request)
* [slice_id](slice.md#slice_id)
* [slicer_id](slice.md#slicer_id)
* [slicer_order](slice.md#slicer_order)

## Properties

###  _created

• **_created**: *string*

*Defined in [interfaces/operations.ts:68](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/interfaces/operations.ts#L68)*

___

###  request

• **request**: *[SliceRequest](slicerequest.md)*

*Defined in [interfaces/operations.ts:67](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/interfaces/operations.ts#L67)*

___

###  slice_id

• **slice_id**: *string*

*Defined in [interfaces/operations.ts:58](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/interfaces/operations.ts#L58)*

A unique identifier for the slice

___

###  slicer_id

• **slicer_id**: *number*

*Defined in [interfaces/operations.ts:62](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/interfaces/operations.ts#L62)*

A reference to the slicer that created the slice.

___

###  slicer_order

• **slicer_order**: *number*

*Defined in [interfaces/operations.ts:66](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/interfaces/operations.ts#L66)*

A reference to the slicer
