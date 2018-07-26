# Terminology

This provides a high level summary of the terminology used within Teraslice.

### Asset Bundle

An `Asset Bundle` is the mechanism used to deploy custom code used in Teraslice jobs. The bundle includes all the custom code and dependencies and is registered with the cluster as a zip file. An asset can also be used to distribute small amounts of data, like lookup tables, that will be copied to each node and used by the `Workers` for the job.

### Cluster Master

The `Cluster Master` manages the jobs that are deployed on the cluster. It performs this roll regardless of the underlying clustering system.

### Cluster System

The `Cluster System` is the clustering mechanism that is used to deploy jobs. Currently native clustering is the primary way jobs are run but Kubernetes clustering will be available soon. Other clustering systems may follow in the future.

### Execution Context

The `Execution Context` is an instance of a job that is running on the cluster. Each time a job runs it will run with a new `Execution Context`.

### Execution Controller

The `Execution Controller` is the process that controls the execution of a `Job`. It is responsible for running the `Slicer` to determine the `Slices` that will be processed by the `Workers`. All workers communicate with the `Execution Controller` and receive work based on the slices determined by the `Slicer`.

### Job

A Teraslice Job is a JSON document that defines how the cluster should execute a `Processing Pipeline`. It contains the configuration for the job and all operations that will be required for the job. It is registered with the cluster and can be instantiated in an `Execution Context` to run on the cluster. The same job can be run many times and each run gets a new `Exection Context`.

### Node Master

In Teraslice native clustering The `Node Master` is the process deployed on each node that manages the node. It's responsible for handling communications with the `Cluster Master` to manage the workers on the node.

### Operation

An `Operation` is the general term for the software components that are used to process data. `Operations` are implemented in JavaScript and deployed as `Asset Bundles`. There are two major types of operations, `Reader` and `Processor` which are explained below. A third

### Processor

A `Processor` is a type of Operation that processes data. It can do what ever is required with the data but operations are things like validation, transformation, enrichment and aggregation.

### Processing Pipeline

The `Processing Pipeline` is the section of a job that defines the set of operations that will be applied to data as it flows through the system. Each operation is applied in the order as defined in the `operations` array on the job.

### Reader

A `Reader` is an `Operation` that integrates with an external data source and reads data from it. It consists of two pieces a `Slicer` and a `Reader` that work together to read the data for further processing.

### Sender

A `Sender` is a specialized type of `Processor` that sends data to another system. In most cases the last step in a processing pipeline will be a `Sender` but that's not a hard requirement. The API for a `Sender` and the API for regular processors are exactly the same it's just a detail of what they do that defines the difference.

### Slice

A `Slice` is the unit of work in Teraslice. The exact definition of what makes up a slice is determined by the specific reader being used. For instance on the `elasticsearch_reader` a slice will be a set of records for a particular time range.

### Slicer

The `Slicer` is the component of a reader that determines the work that needs to be done. In the `elasticsearch_reader` the slicer is what looks at an index and determines how to "slice" it down to reasonably sized chunks of data.

### State Store

The state store is an Elasticsearch cluster where Teraslice stores the state it tracks for its operations. The state of all slices and analytics about those slices are stored in the state store along with information about all registered jobs, execution contexts and deployed assets.

### Terafoundation

Teraslice is built on top of the `Terafoundation` library. From a users perspective the most notable aspect of this is that the Teraslice configuration file will have a terafoundation section that defines all the connectors for data sources within the system.

### Worker

A Teraslice worker is an independent OS process that receives `Slice` descriptions from a slicer and then processes the data. A Teraslice job will have at least one worker and a large job can have many more.
