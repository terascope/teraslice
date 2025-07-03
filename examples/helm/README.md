# Starting teraslice using helm and helmfile

## Prerequisites

The following dependencies are required to successfully deploy a basic instance of Teraslice and interact with its API. The examples provided use Homebrew (brew) and Node.js's (npm) for installation.

- Docker
- [Helm](https://helm.sh/docs/intro/install/)
    - `brew install helm`
- [helmfile](https://formulae.brew.sh/formula/helmfile)
    - `brew install helmfile`
- [Kubectl](https://kubernetes.io/docs/reference/kubectl/)
    - `brew install kubectl`
- [Kind](https://kind.sigs.k8s.io/) - Kubernetes in Docker
    - `brew install kind`
- [curl](https://formulae.brew.sh/formula/curl) - Command-line tool for making HTTP requests
    - `brew install curl`
- [teraslice-cli](https://www.npmjs.com/package/teraslice-cli) - A CLI tool for managing Teraslice
    - `npm install -g teraslice-cli`

## Quick Start

Start with being in the correct directory. Starting in the top level of the teraslice directory run:

```bash
cd ./examples/helm
```

Quickly build an launch teraslice with `opensearch2` as the state cluster, minio, utility pod, and kafka with the script below:

**NOTE:** _Ensure the directory at `teraslice/e2e/helm/utility/data` doesn't have large files in it or else the utility pod will fail to deploy running the script below. It's okay to move large files in the directory after the command below completes. More info about the [utility pod](#utility-pod-usage) is discussed below_

```bash
kind create cluster --config kindConfig.yaml
#### If these images already exist they can be skipped to stand up teraslice faster
docker build -t terascope/teraslice:dev ../../.
docker build -t teraslice-utility:0.0.1 ../../e2e/helm/utility/.
# If instead you'd rather pull a teraslice image you can pull it and retag it like below
# docker pull ghcr.io/terascope/teraslice:v2.16.4-nodev22.16.0
# docker tag ghcr.io/terascope/teraslice:v2.16.4-nodev22.16.0 terascope/teraslice:dev
kind load docker-image --name k8s-env terascope/teraslice:dev teraslice-utility:0.0.1
helmfile sync
```

Once completed, verify that teraslice is running by hitting the api:

```bash
curl localhost:5678
```

Also confirm that opensearch2 has all the teraslice state indices by running:

```bash
curl localhost:9202/_cat/indices
```

Ensure minio is running correctly logging into the the [Minio UI](http://localhost:9001) with the following username and password:

**Username:** _minioadmin_

**Password:** _minioadmin_

Kafka also has a UI by default, in the browser go to the [Kafka UI](http://localhost:8084) and ensure the `kafka-dev` cluster is present.

### Utility pod usage

The utility pod has useful tools to interact and load data into services. Services include:

- **kcat** a cli tool used to read, write, and interact with kafka
- **jq** a command-line tool for processing JSON data
- **fake_stream.sh** script, used for trickling data slowly in to a kafka topic to mimic streams of data
- **curl** a command-line tool for transferring data with URLs

We can open a bash shell into the utility container to use these tools with the command below:

```bash
kubectl -n services-dev1 exec -it $(kubectl -n services-dev1 get pod -l app=teraslice-utility -o jsonpath="{.items[0].metadata.name}") -- bash
```

The utility pod has a shared volume on the host machine to make moving files into the kind cluster easier. For example, a large ldjson file can be moved into the directory `teraslice/e2e/helm/utility/data` on the host machine. Then opening a shell with the command above and going to the `/app/data` directory, the file will now exist in the pod. If we wanted to quickly write this ldjson file into a kafka topic called `test-v1`, we could run:

```bash
kcat -b kafka-headless.services-dev1.svc.cluster.local:9092 -t test-v1 -P -l /app/data/<ldjson file name>
```

### Initial Setup

First you're going to want to be in the correct directory. Starting in the top level of the teraslice directory:

```bash
cd ./examples/helm
```

### Step 1: Creating a Kind Cluster

Create a single node Kubernetes cluster by running the following command:

```bash
kind create cluster --config kindConfig.yaml
```

### Step 2: Building the Teraslice Docker Image

Build the teraslice docker image using the following command:

```bash
docker build -t terascope/teraslice:dev ../../.
```

### Step 3: Loading the Teraslice Docker Image into the Kind Cluster

Load the Teraslice Docker image, built above, into the Kind cluster's control plane:

```bash
kind load docker-image --name k8s-env terascope/teraslice:dev
```

### Step 4: Verifying the Image Load

Confirm that the teraslice image has been successfully loaded into the cluster. The following command lists the images available in the clusters control plane:

```bash
docker exec -it k8s-env-control-plane crictl images
```

### Step 5: Verifying the Kubernetes Resource Configuration

Generate a preview of the Kubernetes resources that will be deployed. This step ensures that the `helmfile` is configured correctly:

```bash
helmfile diff
```

### Step 6: Deploying Resources

Lastly if there were no errors with the `diff` command, deploy teraslice and opensearch into the cluster by running:

```bash
helmfile sync
```

### Step 7: Deploying Assets

The example job requires the `standard-assets` and `elasticsearch-assets` to be available in the cluster for successful execution. Use the `teraslice-cli` tool to deploy these assets:

```bash
teraslice-cli assets deploy localhost terascope/standard-assets
```

```bash
teraslice-cli assets deploy localhost terascope/elasticsearch-assets
```

### Step 8: Submitting and Starting a Test Job

This example job generates `10,000` records and writes them to an Opensearch index named `random-data-1`. Submit the job to the Teraslice API using the following command:

```bash
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

### Step 9: Viewing results in opensearch

Once the job completes, query Opensearch to verify that the documents have been written successfully. Use the following command to view the index information:

```bash
curl 'localhost:9202/_cat/indices?v&h=index,status,docs.count,docs.deleted,store.size,pri.store.size'
```

Results:

```bash
index                        status docs.count docs.deleted store.size pri.store.size
teraslice__assets            open            2            0      2.8mb          2.8mb
teraslice__state-2024.11     open            1            0     28.8kb         28.8kb
teraslice__ex                open            1            0     49.1kb         49.1kb
teraslice__jobs              open            1            0      5.6kb          5.6kb
random-data-1                open        10000            0        7mb            7mb
teraslice__analytics-2024.11 open            4            0     23.9kb         23.9kb
```

## Advanced Setup

In the cases where a specific scenario is required, you can use a custom configuration file to deploy teraslice in a variety of ways. We can create a custom yaml file template based on the default config by running this command:

_**IMPORTANT:** in order to run the custom scenario correctly, the file MUST be named `custom.yaml` and be in the `teraslice/examples/helm` directory._

```sh
cp values.yaml custom.yaml
```

Once copied, modify the `custom.yaml` file to specific needs. All available options are already provided in the file. Afterwards you can launch it with the following command:

```sh
helmfile -e custom sync
```
