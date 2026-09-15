#!/usr/bin/env bash
# Registers this OSD with the monitor and lays down its BlueStore store on a
# sparse file, then runs it. Idempotent: a store that is already provisioned is
# reused as-is.
#
# Each OSD provisions itself rather than sharing a single osd-init container, so
# adding a second OSD is a copy of the osd0 service block with a different
# OSD_ID and nothing else has to change.
ROLE=osd.${OSD_ID:-?}
source /scripts/common.sh

OSD_ID=${OSD_ID:?OSD_ID must be set}
OSD_SIZE=${OSD_SIZE:-10G}
OSD_DATA=/var/lib/ceph/osd/ceph-${OSD_ID}

wait_for_conf
wait_for_mon

if [ ! -f "${OSD_DATA}/ready" ]; then
  # A half-built store from an interrupted run would confuse --mkfs.
  rm -rf "$OSD_DATA"
  mkdir -p "$OSD_DATA"

  uuid=$(uuidgen)
  secret=$(ceph-authtool --gen-print-key)

  log "registering osd.${OSD_ID} (uuid ${uuid})"
  assigned=$(echo "{\"cephx_secret\": \"${secret}\"}" \
    | ceph osd new "$uuid" "$OSD_ID" -i - -n client.admin)
  [ "$assigned" = "$OSD_ID" ] || die "monitor assigned osd.${assigned}, expected osd.${OSD_ID}"

  log "creating ${OSD_SIZE} sparse BlueStore device for osd.${OSD_ID}"
  truncate -s "$OSD_SIZE" "${OSD_DATA}/block"

  ceph-authtool --create-keyring "${OSD_DATA}/keyring" \
    --name "osd.${OSD_ID}" --add-key "$secret"

  fix_perms "$OSD_DATA"
  ceph-osd -i "$OSD_ID" --mkfs --osd-uuid "$uuid" --setuser ceph --setgroup ceph

  touch "${OSD_DATA}/ready"
  log "osd.${OSD_ID} provisioned"
fi

fix_perms /etc/ceph "$OSD_DATA"

log "starting ceph-osd id=${OSD_ID}"
exec ceph-osd -f -i "$OSD_ID" --setuser ceph --setgroup ceph
