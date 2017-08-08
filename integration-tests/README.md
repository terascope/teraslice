# teraslice-integration-tests

Teraslice integration test suite

## Dependencies

* Make (>= 3.81)
* Docker (not sure about minimal version but tested with 17.06.1-ce-rc1)
* Docker Compose (not sure about minimal version but tested with 1.14.0)

# General Notes

Unless specified, all commands are assumed to be run from this integration-tests
directory - utils like `make` & `docker-compose` look for files in current dir.

Look to `make help` for interesting build targets & usage. You can `make test`
to test the latest stable row from the version matrix.

There are currently two supported "modes": developer mode & QA/CI mode. The
default dev. To override, `export MODE=qa` in your environment.

## Dev Mode

When in dev mode, the teraslice project root and any npm-linked dependencies
will be bind-mounted into the test image to avoid rebuilds between edits. The
recommended workflow is:

1. Make edits to teraslice and any npm-linked modules.

1. From the teraslice project root, `make integration-tests` will run
   the test suite against latest stable versions.

1. Repeat as needed.

# Trouble-Shooting

If the test suite appears to be running with unexpected results and you suspect
that the state of the docker containers are a factor, you can `make clean` to
tear down the environment and have it recreated from scratch.

The environment is managed by `docker-compose`. See the `ps` & `log`
sub-commands to diagnose potential issues in the containers. Here is a recipe to
prettify the teraslice logs:
```
docker-compose logs --no-color teraslice-worker | awk -F' [|] ' '{print $2}' | bunyan -o short
```

## Notes

- Teraslice will attempt to listen on port 45678, make sure to stop an local instance to prevent port collisions

- The port for docker's elasticsearch instance listens on 49200, so you can check it at localhost:49200

# Version Matrix

The matrix of supported versions can be tested with `make test-all`. Currently,
only multiple versions of Elasticsearch are tested. Eventually, we will test
combinations of Teraslice, Elasticsearch, and Kafka, etc.

| Teraslice | Elasticsearch |
| --------- | -----------   |
| latest    | 2.3           |
| latest    | 5.5           |
