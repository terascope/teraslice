/**
 * Standalone HTML page that renders the /v2 OpenAPI spec with RapiDoc. The
 * RapiDoc script is served by Teraslice itself (see api.ts), so the page
 * works without internet access.
 */
export function v2DocsPage(): string {
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1">
    <title>Teraslice API</title>
    <script type="module" src="/v2/api-docs/rapidoc-min.js"></script>
</head>
<body>
    <rapi-doc
        spec-url="/v2/openapi.json"
        render-style="read"
        show-header="false"
        allow-authentication="false"
        allow-server-selection="false"
        sort-endpoints-by="path"
    ></rapi-doc>
</body>
</html>
`;
}
