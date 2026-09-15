#!/usr/bin/env bash
ROLE=rgw
source /scripts/common.sh

RGW_ID=${RGW_ID:-test}
RGW_PORT=${RGW_PORT:-8000}
OSD_COUNT=${OSD_COUNT:-1}
NAME="client.rgw.${RGW_ID}"
KEYRING="/etc/ceph/ceph.${NAME}.keyring"

wait_for_conf
wait_for_mon
# RGW creates its pools on startup, which needs OSDs to actually accept writes.
wait_for_osds "$OSD_COUNT"

if [ ! -s "$KEYRING" ]; then
  log "creating keyring for ${NAME}"
  ceph auth get-or-create "$NAME" \
    mon 'allow rw' osd 'allow rwx' mgr 'allow rw' \
    -o "$KEYRING"
fi
fix_perms "$KEYRING"

log "starting radosgw ${NAME} on port ${RGW_PORT}"
exec radosgw -f -n "$NAME" -k "$KEYRING" \
  --setuser ceph --setgroup ceph \
  --rgw-frontends="beast port=${RGW_PORT}" \
  --rgw-run-sync-thread=false \
  --rgw-relaxed-s3-bucket-names=true
