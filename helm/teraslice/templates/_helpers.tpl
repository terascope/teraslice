{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "teraslice.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "teraslice.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "teraslice.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "teraslice.labels" -}}
helm.sh/chart: {{ include "teraslice.chart" . }}
{{ include "teraslice.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "teraslice.selectorLabels" -}}
app.kubernetes.io/name: {{ include "teraslice.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Master common labels
*/}}
{{- define "teraslice.master.labels" -}}
{{ include "teraslice.labels" . }}
app.kubernetes.io/component: master
{{- end -}}

{{/*
Master selector labels
*/}}
{{- define "teraslice.master.selectorLabels" -}}
{{ include "teraslice.selectorLabels" . }}
app.kubernetes.io/component: master
{{- end -}}

{{/*
Worker common labels
*/}}
{{- define "teraslice.worker.labels" -}}
{{ include "teraslice.labels" . }}
app.kubernetes.io/component: worker
{{- end -}}

{{/*
Worker selector labels
*/}}
{{- define "teraslice.worker.selectorLabels" -}}
{{ include "teraslice.selectorLabels" . }}
app.kubernetes.io/component: worker
{{- end -}}

{{/*
Create the name of the service account to use
*/}}
{{- define "teraslice.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
    {{ default (include "teraslice.fullname" .) .Values.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Return the appropriate apiVersion for PriorityClass.
*/}}
{{- define "PriorityClass.apiVersion" -}}
{{- if semverCompare ">=1.8-0, <1.11-0" .Capabilities.KubeVersion.Version -}}
{{- print "v1alpha1" -}}
{{- else if semverCompare ">=1.11-0, <1.14-0" .Capabilities.KubeVersion.Version -}}
{{- print "v1beta1" -}}
{{- else if semverCompare ">=1.14-0" .Capabilities.KubeVersion.Version -}}
{{- print "v1" -}}
{{- end -}}
{{- end -}}

{{/*
Compose an fully qualified image. example: ghcr.io/teraslice:v0.87.0-nodev18.16.0
*/}}
{{- define "teraslice.image" -}}
{{- if .Values.image.tag -}}
{{ .Values.image.repository }}:{{ .Values.image.tag }}
{{- else -}}
{{ .Values.image.repository }}:{{ .Chart.AppVersion }}-node{{ .Values.image.nodeVersion }}
{{- end -}}
{{- end -}}


{{/*
Create teraslice master base config
*/}}
{{- define "teraslice.masterConfig" -}}
{{- with .Values.terafoundation }}
terafoundation:
  {{- $filtered := omit . "prom_metrics_display_url" }}
  {{- toYaml $filtered | nindent 2 }}
  {{- if hasKey . "prom_metrics_display_url" }}
  prom_metrics_display_url: {{ .prom_metrics_display_url }}
  {{- else if and ($.Values.ingress.enabled) (not (empty $.Values.ingress.hosts)) }}
  prom_metrics_display_url: {{ (index $.Values.ingress.hosts 0).host }}
  {{- end }}
{{- end }}


{{- with .Values.stats }}
stats:
  {{- toYaml . | nindent 2 }}
{{- end }}

teraslice:
  state:
    connection: {{ .Values.stateConnection }}
  master: true
  master_hostname: {{ template "teraslice.fullname" . }}
  name: {{ .Release.Name }}
  kubernetes_namespace: {{ .Release.Namespace }}
  kubernetes_image: {{ include "teraslice.image" . }}
  kubernetes_config_map_name: {{ template "teraslice.fullname" . }}-worker
  {{- if and .Values.priorityClass.create (not .Values.master.teraslice.kubernetes_priority_class_name) }}
  kubernetes_priority_class_name: {{ template "teraslice.fullname" . }}
  {{- end }}
  {{- if .Values.persistence.enabled }}
  assets_volume: {{ template "teraslice.fullname" . }}-assets
  {{- end }}
{{- end -}}


{{/*
Create teraslice master config user overrides
*/}}
{{- define "teraslice.masterConfigUser" -}}
teraslice:
{{- with .Values.master.teraslice }}
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- end -}}


{{/*
Create teraslice worker base config
*/}}
{{- define "teraslice.workerConfig" -}}
{{- with .Values.terafoundation }}
terafoundation:
  {{- $filtered := omit . "prom_metrics_display_url" }}
  {{- toYaml $filtered | nindent 2 }}
  {{- if hasKey . "prom_metrics_display_url" }}
  prom_metrics_display_url: {{ .prom_metrics_display_url }}
  {{- else if and ($.Values.ingress.enabled) (not (empty $.Values.ingress.hosts)) }}
  prom_metrics_display_url: {{ (index $.Values.ingress.hosts 0).host }}
  {{- end }}
{{- end }}

{{- with .Values.stats }}
stats:
  {{- toYaml . | nindent 2 }}
{{- end }}

teraslice:
  state:
    connection: {{ .Values.stateConnection }}
  master: false
  master_hostname: {{ template "teraslice.fullname" . }}
  name: {{ .Release.Name }}
  kubernetes_namespace: {{ .Release.Namespace }}
  kubernetes_image: {{ include "teraslice.image" . }}
{{- end -}}

{{/*
Create teraslice worker config user overrides
*/}}
{{- define "teraslice.workerConfigUser" -}}
teraslice:
{{- with .Values.worker.teraslice }}
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- end -}}
