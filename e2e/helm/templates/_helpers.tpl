{{/*
Validate that the given currentPath (string) for currentKey is unique among
all other enabled components' hostVolumePath values.
Usage:
  {{- include "hostVolumePathCrossValidationPath" (dict
        "Values" .Values
        "currentKey" "opensearch1"
        "currentPath" $currentPath
  ) -}}

TODO: This currently does not work but the idea of helper functions is useful. Just taking to long
  to figure out for this PR. Keep getting:
  stringTemplate:41:31: executing "stringTemplate" at <.Values.opensearch1>: wrong type for value; expected string; got map[string]interface {}
*/}}
{{- define "hostVolumePathCrossValidationPath" -}}
  {{- $values     := .Values -}}
  {{- $currentKey := .currentKey -}}
  {{- $currentPath := .currentPath -}}

  {{ range $key, $service := $values }}
    {{- if not (eq $key $currentKey) }}
      {{- if eq ($service | get "enabled" false) true }}
        {{- if eq ($service | get "hostVolumePath" "") $currentPath }}
        
          {{- $error := (printf "%s.hostVolumePath is the same as %s's hostVolumePath. These Must be unique or else data corruption will occur. Change %s.hostVolumePath to something other than %s" $key $currentKey $key $service.hostVolumePath) -}}
          {{- fail $error -}}
        
        {{- end }}
      {{- end }}
    {{- end }}
  {{ end }}

{{- end -}}
