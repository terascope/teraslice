---
title: Development Overview
sidebar_label: Overview
---

### Setup

```sh
# Clone the package
git clone https://github.com/terascope/teraslice.git && cd teraslice
# Install, link and compile packages together
yarn && yarn setup
```

### Running Teraslice

```sh
yarn start -c path/to/config.yaml
```

### Running Teraslice in Docker

#### Building the Docker Image

```sh
docker build -t teraslice .
```

#### Starting the container

```sh
docker run -it --rm -v ./teraslice-master.yaml:/app/config/teraslice.yml teraslice
```

TODO
- BUILD STEP
- ADDING A PACKAGE
