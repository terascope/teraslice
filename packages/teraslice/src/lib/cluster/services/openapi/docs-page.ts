/**
 * Minimal standalone HTML page that renders the OpenAPI spec with RapiDoc.
 * RapiDoc is a single web component; its script is served by Teraslice itself
 * (from the bundled `rapidoc` dependency, see api.ts) so the page needs no
 * internet access and works in air-gapped clusters.
 */
export function openapiDocsPage(): string {
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1">
    <title>Teraslice API</title>
    <script type="module" src="/v1/api-docs/rapidoc-min.js"></script>
</head>
<body>
    <rapi-doc
        spec-url="/v1/openapi.json"
        render-style="read"
        theme="light"
        show-header="false"
        allow-authentication="false"
        allow-server-selection="false"
        sort-endpoints-by="path"
        regular-font="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    ></rapi-doc>
</body>
</html>
`;
}
