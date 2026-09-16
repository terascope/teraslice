# Ceph test service

A single-node Ceph cluster (1 mon, 1 mgr, 1 OSD, 1 RGW) providing an
S3-compatible endpoint for tests. The OSD is a BlueStore store on a sparse file,
so there are no loop devices, no `--privileged`, and nothing touching the host's
disks.

## Under `ts-scripts test`

The `opensearch` suite runs Ceph. Any other package opts in by setting
`TEST_CEPH='true'` in its `test` script.

`ensureCeph()` (`src/helpers/test-runner/services.ts`) generates the `.env` file
in this directory from `src/helpers/config.ts`, runs `up -d`, waits for the
`setup` script to exit 0, and runs `down -v` on teardown. Tests read
`CEPH_HOST`, `CEPH_ACCESS_KEY`, and `CEPH_SECRET_KEY` from the environment.

It also generates `docker-compose.osds.yml`, an override holding an `osd1`,
`osd2`... service per `CEPH_OSD_COUNT`, each cloned from the `osd0` block, and
runs compose with both files. `CEPH_OSD_COUNT=1` (the default) deletes the
override and runs the base file alone, so there is nothing to generate for the
common case. Edit `osd0` to change what every OSD gets.

**No bucket is pre-created.** The stack gives you an S3 user; every test makes
whatever buckets it needs and cleans them up.

Every `CEPH_*` key in `config.ts` is overridable by an env var of the same name,
except `CEPH_HOST` and `CEPH_PROTOCOL`, which are derived — set `CEPH_HOSTNAME`
and `CEPH_PORT` instead.

## Standalone

```sh
cp .env.example .env
docker compose up -d
docker compose run --rm toolbox   # a shell with ceph / radosgw-admin / rados
docker compose down -v
```

Use **path-style** S3 addressing — virtual-host style needs wildcard DNS.

## How addressing works

Nothing here pins an IP or a subnet. `mon.sh` reads the monitor's own address
off its interface at runtime, writes it into `ceph.conf` and the monmap, and
every other daemon finds the monitor through that shared `ceph.conf`. Docker is
therefore free to allocate whatever range is available, and this stack can never
collide with an existing network.

If docker hands out a different address on a later `up`, `mon.sh` notices that
the stored monmap disagrees, rewrites it in place (preserving the fsid and map
epoch) and carries on.

The one case this does not cover is the docker daemon reassigning addresses
underneath containers that keep running — the monitor recovers, but an OSD that
was never restarted will still be pointed at the old address. Restart the stack.

## Things to be aware of when using this docker compose

**`down` without `-v` keeps the cluster.** The named volumes hold the fsid,
keyrings, monmap, and OSD stores, and every script is idempotent, so a plain
`down`/`up` deliberately reuses the existing cluster. A config that gets applied at
creation time, like `osd_pool_default_size` set by `OSD_COUNT`, will not change
until you `down -v`.

**Changing `OSD_COUNT` requires `down -v`.** `osd.sh` skips provisioning when it
finds a `ready` marker, so going 3→1 on existing volumes leaves osd.1 and osd.2
in the osdmap with no daemons behind them — degraded forever. Under
`ts-scripts test` that is covered: `ensureCeph()` runs `down -v` before every
`up`.

**The count is structural in the YAML.** `rgw.sh` blocks until `OSD_COUNT` OSDs
are up, and compose can't template a service, so the service blocks have to
exist. `ts-scripts test` generates them (see above); standalone, add matching
`osd1`, `osd2`... blocks yourself. Each OSD provisions itself, so such a block
is a copy of `osd0` with a different `OSD_ID` and `hostname`.

**No `container_name:` keys.** Container names are globally unique in Docker, so
hardcoding them would stop two stacks coexisting even under different project
names. Containers are `<project>-<service>-1`, and in-network addressing uses
the compose service name (`rgw`, `mon`).

**Export `CEPH_*`, never the container-side names.** Compose's precedence is
`environment:` > shell env (for `${VAR}` interpolation only) > `env_file`, and
the scripts inside the containers read their values from `env_file` — so a
shell export reaches interpolation but not the containers.

Under `ts-scripts test` that is already handled: the `CEPH_*` vars go through
`config.ts`, which writes both sides of the `.env` file, so `CEPH_PORT=9000
ts-scripts test` publishes *and* binds 9000. Exporting the container-side name
is what breaks — `.env` is regenerated on every run, so `RGW_PORT=9000` is
overwritten in the file while your shell value still wins for interpolation,
publishing one port while RGW listens on another.

Standalone, there is no generator, so change the `.env` file rather than your
shell.

**Readiness is `setup` exiting, not the containers starting.** `up -d` already
blocks on the `depends_on` chain, so it returns with the cluster healthy and RGW
serving; the only thing still outstanding is `setup`, which creates the S3 user.
`up --wait` doesn't cover it — `setup` has no healthcheck and nothing depends on
it, so `--wait` only requires that it started — and `docker compose wait setup`
errors with "no containers for project" once that container has exited. Use
`docker compose ps -a setup` instead, which keeps listing it after it exits.

## Planned Improvements

TLS on the RGW endpoint. `rgw.sh` starts a plain beast frontend; beast supports
`ssl_port=`/`ssl_certificate=`, but it needs a cert minted for the hostname
clients actually connect on. MinIO still covers the encrypted e2e target until
then.
