---
title: Operations Overview
sidebar_label: Overview
---

> Operations within [Teraslice Job](../overview.md) are designed to read, transform, write, or monitor data within a Teraslice job.

## Types

There are a few different operation types:

### Reader

A `Reader` is in-charge of distributing and reading partitions of data across many nodes. A `Reader` has two main components, a [Slicer](#slicer) and a [Fetcher](#fetcher).

#### Slicer

A `Slicer` runs on the [Execution Controller](../../nodes/execution-controller.md) and its primary function to create [Slice Requests](../../packages/job-components/api/interfaces/slicerequest.md) which will wrapped into [Slices](../../packages/job-components/api/interfaces/slice.md) and dispatched to [Workers](../../nodes/worker.md).
