---
title: Jobs Overview
sidebar_label: Overview
---

> Teraslice Jobs are application specific distributed [extract, transform, load (ETL)](https://en.wikipedia.org/wiki/Extract,_transform,_load) pipelines.


## Pipeline

The first operation in the `operations` list, (see the [configuration](./configuration.md)) reads from a particular source, [see "Reader"](./operations/overview.md#Reader). The "Reader" will creates [Slices](../packages/job-components/api/interfaces/slice.md) which goes through the pipeline of operations specified on the job.
