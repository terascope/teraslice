---
title: Getting Started
---

Teraslice is a distributed data processing platform designed to run in kubernetes. There is also a [native clustering mode](./development/overview.md) used for development. You can interact with Teraslice using [curl](./management-apis/overview.md) or the [teraslice CLI client](./packages/teraslice-cli/overview.md). Once running, see the [Using Teraslice](#using-teraslice) section for details on how to run your first [job](./jobs/overview.md).

## Setup Teraslice

The quickest way to launch Teraslice locally is with the `k8s` command, which uses [Kind](https://kind.sigs.k8s.io/) to run a full Kubernetes environment in Docker. This command handles cluster creation, deploys OpenSearch, builds a Teraslice Docker image, and starts the Teraslice master automatically.

### Required Dependencies

- [Docker](https://www.docker.com/get-started/) - Application Containerization Platform
- [Kubectl](https://kubernetes.io/docs/reference/kubectl/) v1.34.2 - Kubernetes command-line tool (`brew install kubectl`)
- [Kind](https://kind.sigs.k8s.io/) v0.30.0 - Kubernetes in Docker (`brew install kind`)
- [Helm](https://helm.sh/docs/intro/install/) v4 - The package manager for Kubernetes
- [helm-diff](https://github.com/databus23/helm-diff) - Helm plugin required by helmfile (`helm plugin install https://github.com/databus23/helm-diff`)
- [helmfile](https://helmfile.readthedocs.io/en/latest/#installation) v1.2.2 - Deploy Kubernetes Helm Charts
- [Node.js](https://nodejs.org/) >= 22.0.0
- [pnpm](https://pnpm.io/) >= 10.25.0 — install via [Corepack](./development/pnpm.md#installing-pnpm) (`corepack enable`)
- [curl](https://curl.se/download.html) - Command-line tool for making HTTP requests
- [teraslice-cli](https://www.npmjs.com/package/teraslice-cli) - A CLI tool for managing Teraslice (`npm i -g teraslice-cli`)

> **Note:** Helm and helmfile introduce breaking changes between major/minor versions. If you encounter issues, verify you are using the versions listed above.

### Migrating from helm v3 to v4 diff plugin bug

Theres an issue when updating from helm v3 to helm v4 where the diff plugin get corrupted. Delete and reinstall the plugin to ensure things are correct.

### Clone and Build Teraslice

```sh
git clone https://github.com/terascope/teraslice.git
cd teraslice
# You only need to enable corepack once
corepack enable
pnpm run setup
```

### Launch Teraslice

From the teraslice root directory, run:

```sh
pnpm k8s
```

This will take a few minutes. It will:

- Create a Kind Kubernetes cluster
- Deploy OpenSearch
- Build and load a Teraslice Docker image from your local repository
- Start the Teraslice master

After the command completes, Teraslice will be running on port `5678` and OpenSearch on port `9200`.

> For additional options such as using a specific Teraslice image, adding Kafka, or rebuilding after code changes, see the [Kubernetes Development Environment](./development/k8s.md) docs.

Configure a `local` alias for use with the CLI:

```sh
earl aliases add local http://localhost:5678
```

## Using Teraslice

See the [overview](overview.md) and [terminology](./terminology.md) pages for details on how teraslice works. See the [management APIs](./management-apis/overview.md) or the [teraslice CLI client](./packages/teraslice-cli/overview.md) for useful commands.

To ensure teraslice is running make a curl request to the API

```sh
curl localhost:5678
{
    "arch": "x64",
    "clustering_type": "kubernetesV2",
    "name": "teraslice",
    "node_version": "v22.14.0",
    "platform": "linux",
    "teraslice_version": "v2.14.1"
}
```

### Deploy Needed Assets

Asset bundles are collection of processors or files that can be loaded and used within a [Job](./jobs/overview.md).

There are public asset bundles available for:

- [elasticsearch](https://terascope.github.io/elasticsearch-assets)
- [Kafka](https://terascope.github.io/kafka-assets)
- [Files](https://terascope.github.io/file-assets) - Amazon S3, local filesystem
- [Standard](https://terascope.github.io/standard-assets) - library of data transformation tools

The example job below requires standard-assets and elasticsearch-assets to be available in the cluster for successful execution. Use the teraslice-cli tool to deploy these assets:

```sh
teraslice-cli assets deploy localhost terascope/standard-assets
```

```sh
teraslice-cli assets deploy localhost terascope/elasticsearch-assets
```

### Submitting and Starting a Test Job

This example job generates 10,000 records using the standard-assets [data generator](https://github.com/terascope/standard-assets/blob/master/docs/operations/data_generator.md) and writes them to an Opensearch index named random-data-1. Submit the job to the Teraslice API using the following command:

```sh
curl -XPOST 'localhost:5678/v1/jobs' -H "Content-Type: application/json" -d '{
    "name": "data-to-es",
    "lifecycle": "once",
    "workers": 1,
    "assets": [
        "standard",
        "elasticsearch"
    ],
    "operations": [
        {
            "_op": "data_generator",
            "size": 10000
        },
        {
            "_op": "elasticsearch_bulk",
            "size": 10000,
            "index": "random-data-1"
        }
    ]
}'
```

### Check the status of the job execution

```sh
curl localhost:5678/txt/ex
```

Run the command several times to see the execution status move from initializing to running to completed.

### Viewing results in opensearch

Once the job completes, query Opensearch to verify that the documents have been written successfully to the `random-data-1` index. Use the following command to view the index information:

```sh

curl 'localhost:9200/_cat/indices?v&h=index,status,docs.count,docs.deleted,store.size,pri.store.size'
```

Results:

```sh
index                        status docs.count docs.deleted store.size pri.store.size
teraslice__assets            open            2            0      2.8mb          2.8mb
teraslice__state-2024.11     open            1            0     28.8kb         28.8kb
teraslice__ex                open            1            0     49.1kb         49.1kb
teraslice__jobs              open            1            0      5.6kb          5.6kb
random-data-1                open        10000            0        7mb            7mb
teraslice__analytics-2024.11 open            4            0     23.9kb         23.9kb
```

## Teardown

When you're done, delete the Kind cluster to clean up all resources:

```sh
kind delete cluster --name k8s-env
```
