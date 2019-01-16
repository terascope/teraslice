# Teraslice Base Image

This is used to speed up builds in CI and the e2e tests. It includes the following modules:

- bunyan
- terafoundation_kafka_connector
- terascope/teraslice_kafka_reader
- terascope/teraslice_kafka_sender

For a list available tags, see: [hub.docker.com/r/terascope/teraslice-base/tags](https://hub.docker.com/r/terascope/teraslice-base/tags/)

## Making changes

Once you make changes to the Dockerfile, you have to manually publish it. I have created a script to make it easier. Before building and pushing, change the version in this directories package.json.

**IMPORTANT** Make sure you are logged in to docker hub with permission to push to `terascope/teraslice-base`, i.e. `docker login`

```sh
cd ./docker-base
./build-and-push.sh
```

Make sure to update the tereslice Dockerfile in the root of this repo with the new tag.
