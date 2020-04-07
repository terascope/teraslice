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

*Defined in [packages/job-components/src/interfaces/operations.ts:88](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/operations.ts#L88)*

___

###  request

• **request**: *[SliceRequest](slicerequest.md)*

*Defined in [packages/job-components/src/interfaces/operations.ts:87](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/operations.ts#L87)*

___

###  slice_id

• **slice_id**: *string*

*Defined in [packages/job-components/src/interfaces/operations.ts:78](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/operations.ts#L78)*

A unique identifier for the slice

___

###  slicer_id

• **slicer_id**: *number*

*Defined in [packages/job-components/src/interfaces/operations.ts:82](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/operations.ts#L82)*

A reference to the slicer that created the slice.

___

###  slicer_order

• **slicer_order**: *number*

*Defined in [packages/job-components/src/interfaces/operations.ts:86](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/interfaces/operations.ts#L86)*

A reference to the slicer
