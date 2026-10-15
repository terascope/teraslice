import { createWriteStream } from 'node:fs';
import { once } from 'node:events';

/** Helpers over a stream of rendered JSON lines, shared by `ndjson`, `rows` and `writeNDJSON`. */

/**
 * Yields each distinct line once, in order. Backs `rowsWithoutDuplicates`, which compares
 * whole rendered rows. Keeps every distinct line in memory.
*/
export async function* distinctLines(lines: AsyncIterable<string>): AsyncIterableIterator<string> {
    const seen = new Set<string>();
    for await (const line of lines) {
        if (seen.has(line)) continue;
        seen.add(line);
        yield line;
    }
}

export async function* parseLines(
    lines: AsyncIterable<string>
): AsyncIterableIterator<Record<string, unknown>> {
    for await (const line of lines) yield JSON.parse(line) as Record<string, unknown>;
}

/** Writes lines to a file, each followed by a newline, matching what `COPY` writes. */
export async function writeLines(path: string, lines: AsyncIterable<string>): Promise<void> {
    const out = createWriteStream(path);
    try {
        for await (const line of lines) {
            if (!out.write(`${line}\n`)) await once(out, 'drain');
        }
    } finally {
        out.end();
        await once(out, 'close');
    }
}
