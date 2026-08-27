/**
 * A LATENCY-INJECTING HTTP PROXY — to put a real S3's round trip in front of localhost minio.
 *
 * **Why this exists.** Every remote number in `PERFORMANCE.md` was taken against minio on
 * localhost, where the round trip is sub-millisecond. That deliberately removes the network to
 * isolate protocol and CPU cost - but it also removes the single term that decides the storage
 * design, because real same-region S3 adds **20-100 ms per cold GET** and Parquet issues 2-5
 * requests per file per query. At 500 objects that is 1,000-2,500 requests for one query. The docs
 * record this as **UNDETERMINED** rather than guessing at it. This proxy makes it measurable
 * without credentials: the same corpus, the same protocol, with a known delay per request.
 *
 * **It is a MODEL, not real S3.** It injects a fixed per-request delay. Real S3 additionally has
 * variable latency, per-prefix rate limits, TLS handshakes and cross-AZ effects. Report anything
 * measured through it as "modelled at N ms RTT", never as "measured on S3".
 *
 * **The one thing that makes it work with SigV4.** AWS signatures cover the `Host` header, so a
 * proxy that rewrites Host breaks every signed request. This forwards **every header verbatim**,
 * including Host, and only changes the TCP destination - so minio recomputes the same signature
 * over the same bytes and the request validates.
 *
 * Usage:
 *   const proxy = await startProxy({ targetPort: 49000, delayMs: 20 });
 *   // point DuckDB's s3_endpoint at `localhost:${proxy.port}`
 *   proxy.stats();   // { requests, bytesOut }
 *   await proxy.close();
 */
import http from 'node:http';

export async function startProxy({
    targetHost = '127.0.0.1',
    targetPort = 49000,
    delayMs = 0,
    port = 0,
} = {}) {
    let requests = 0;
    let bytesOut = 0;

    const server = http.createServer((clientReq, clientRes) => {
        requests += 1;

        const forward = () => {
            const proxyReq = http.request({
                host: targetHost,
                port: targetPort,
                method: clientReq.method,
                path: clientReq.url,
                // verbatim, Host included - the signature is computed over these
                headers: clientReq.headers,
            }, (proxyRes) => {
                clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
                proxyRes.on('data', (chunk) => { bytesOut += chunk.length; });
                proxyRes.pipe(clientRes);
            });

            proxyReq.on('error', (err) => {
                if (!clientRes.headersSent) clientRes.writeHead(502);
                clientRes.end(String(err.message));
            });

            clientReq.pipe(proxyReq);
        };

        // The delay models the round trip: the request is held before it is issued, so every
        // request pays it once, which is what a cold GET against a remote endpoint costs.
        if (delayMs > 0) setTimeout(forward, delayMs);
        else forward();
    });

    // A long keep-alive matters: without it the proxy closes idle sockets and DuckDB's connection
    // caching has nothing to cache, which would silently turn the caching axis into noise.
    server.keepAliveTimeout = 120_000;
    server.headersTimeout = 130_000;
    server.maxRequestsPerSocket = 0;

    await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

    return {
        port: server.address().port,
        stats: () => ({ requests, bytesOut }),
        reset: () => { requests = 0; bytesOut = 0; },
        close: () => new Promise((resolve) => {
            server.closeAllConnections?.();
            server.close(resolve);
        }),
    };
}
