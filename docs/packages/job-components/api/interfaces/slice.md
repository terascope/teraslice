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

*Defined in [interfaces/operations.ts:87](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L87)*

___

###  request

• **request**: *[SliceRequest](slicerequest.md)*

*Defined in [interfaces/operations.ts:86](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L86)*

___

###  slice_id

• **slice_id**: *string*

*Defined in [interfaces/operations.ts:77](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L77)*

A unique identifier for the slice

___

###  slicer_id

• **slicer_id**: *number*

*Defined in [interfaces/operations.ts:81](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L81)*

A reference to the slicer that created the slice.

___

###  slicer_order

• **slicer_order**: *number*

*Defined in [interfaces/operations.ts:85](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L85)*

A reference to the slicer
