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

if [ "${RGW_SSL:-false}" = "true" ]; then
  RGW_SSL_CERT=${RGW_SSL_CERT:-/opt/certs/ceph-keypair.pem}
  [ -s "$RGW_SSL_CERT" ] || die "RGW_SSL is true but ${RGW_SSL_CERT} is missing or empty"
  FRONTEND="beast ssl_port=${RGW_PORT} ssl_certificate=${RGW_SSL_CERT} ssl_private_key=${RGW_SSL_CERT}"
else
  FRONTEND="beast port=${RGW_PORT}"
fi

log "starting radosgw ${NAME} with frontend: ${FRONTEND}"
exec radosgw -f -n "$NAME" -k "$KEYRING" \
  --setuser ceph --setgroup ceph \
  --rgw-frontends="$FRONTEND" \
  --rgw-run-sync-thread=false \
  --rgw-relaxed-s3-bucket-names=true
