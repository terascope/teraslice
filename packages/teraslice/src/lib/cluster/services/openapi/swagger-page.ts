/**
 * Minimal standalone HTML page that renders the OpenAPI spec with Swagger UI.
 * The Swagger UI assets are served by Teraslice itself (from the bundled
 * `swagger-ui-dist` dependency, see api.ts) so the page needs no internet access.
 *
 * This exists alongside the RapiDoc page (docs-page.ts) purely to compare the two
 * renderers; both read the same `/v1/openapi.json`.
 */
export function swaggerDocsPage(): string {
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Teraslice API</title>
    <link rel="stylesheet" href="/v1/swagger/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="/v1/swagger/swagger-ui-bundle.js"></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: '/v1/openapi.json',
                dom_id: '#swagger-ui'
            });
        };
    </script>
</body>
</html>
`;
}
