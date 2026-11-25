import { z } from 'zod';
import type { SchemaObject } from 'openapi3-ts/oas31';
import { TerasliceApiV2 } from '@terascope/types';
import type { ApiService } from '../api.js';
import type { AnyRouteDef, ParamsSchema } from '../../../../utils/v2_routes.js';
import { createV2Registry } from './routes.js';
import { createV2AssetRegistry } from './asset-routes.js';
import {
    convertToOpenAPIPath, fromZod, v2Tags, type Components, type Schema
} from './openapi.js';

/*
 * Generates the tables in docs/management-apis/endpoints-v2.md. `pnpm sync`
 * (in @terascope/scripts) loads this file from dist and writes each table
 * between the doc's markers for it.
 *
 * Everything comes from the registered route defs. Each route holds its
 * method, path, summary and tag, and the zod schemas for its query, body and
 * response, so no schema is looked up on its own.
 */

/** A query or response schema, and the routes that use it */
interface SchemaUse {
    schema: z.ZodType;
    usedBy: string[];
}

/**
 * The tables, keyed by marker name: `V2 ROUTES`, plus `V2 SCHEMA <name>` for
 * each query and response schema, e.g. `V2 SCHEMA StopJobQuery`.
 *
 * @param routes - defaults to the real routes: the master's and the asset
 * routes, in the order the OpenAPI spec lists them. Handlers aren't called,
 * so the registries are built with stubs.
 */
export function generateV2DocTables(
    routes: readonly AnyRouteDef[] = defaultRoutes()
): Record<string, string> {
    const components: Components = {};
    const queries = new Map<string, SchemaUse>();
    const responses = new Map<string, SchemaUse>();

    for (const route of routes) {
        const label = routeLabel(route);
        if (route.query) addUse(queries, route.query, label);
        addUse(responses, route.response, label);
    }

    const tables: Record<string, string> = {
        'V2 ROUTES': renderRouteTables(routes),
    };

    for (const [name, { schema, usedBy }] of queries) {
        tables[`V2 SCHEMA ${name}`] = [
            usedByLine(usedBy),
            renderQueryTable(schema as ParamsSchema, components),
        ].join('\n\n');
    }

    for (const [name, { schema, usedBy }] of responses) {
        if (queries.has(name)) {
            throw new Error(`v2 schema ${name} is used as both a query and a response`);
        }
        tables[`V2 SCHEMA ${name}`] = [
            usedByLine(usedBy),
            ...renderResponse(schema, components),
        ].join('\n\n');
    }

    return tables;
}

function defaultRoutes(): AnyRouteDef[] {
    const assetRoutes = createV2AssetRegistry(() => {
        throw new Error('The doc tables never call the asset route handlers');
    }).routes;
    return [...createV2Registry({} as ApiService).routes, ...assetRoutes];
}

function routeLabel(route: AnyRouteDef): string {
    return `${route.method.toUpperCase()} ${convertToOpenAPIPath(route.path)}`;
}

function addUse(uses: Map<string, SchemaUse>, schema: z.ZodType, label: string): void {
    const name = schemaName(schema);
    const use = uses.get(name);
    if (use) {
        use.usedBy.push(label);
    } else {
        uses.set(name, { schema, usedBy: [label] });
    }
}

/**
 * The schema's `TerasliceApiV2` export name without `Schema`, e.g.
 * `StopJobQuery`. Used because query and list schemas have no `.meta({ id })`.
 */
function schemaName(schema: z.ZodType): string {
    const entry = Object.entries(TerasliceApiV2).find(([, value]) => value === schema);
    if (!entry) {
        throw new Error('Every v2 route schema must be exported from TerasliceApiV2');
    }
    return entry[0].replace(/Schema$/, '');
}

function usedByLine(usedBy: string[]): string {
    const labels = usedBy.map((label) => `\`${label}\``);
    const list = labels.length > 1
        ? `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
        : labels[0];
    return `Used by ${list}.`;
}

/** One table per tag, in the spec's tag order, each in registration order */
function renderRouteTables(routes: readonly AnyRouteDef[]): string {
    const byTag = new Map<string, AnyRouteDef[]>(v2Tags.map(({ name }) => [name, []]));
    for (const route of routes) {
        const tag = route.tags?.[0];
        if (!tag) throw new Error(`v2 route ${routeLabel(route)} has no tag`);
        byTag.get(tag)!.push(route);
    }

    const tables = [...byTag].filter(([, tagRoutes]) => tagRoutes.length);
    return tables.map(([tag, tagRoutes]) => [
        `### ${tag}`,
        '',
        table(
            ['Method', 'Path', 'Query and body', 'Description'],
            tagRoutes.map((route) => [
                route.method.toUpperCase(),
                `\`${convertToOpenAPIPath(route.path)}\``,
                queryAndBody(route),
                route.summary,
            ])
        ),
    ].join('\n')).join('\n\n');
}

/** e.g. `` `start`, job config body `` */
function queryAndBody(route: AnyRouteDef): string {
    const items = Object.keys(route.query?.shape ?? {}).map((key) => `\`${key}\``);
    if (route.body) {
        const words = schemaName(route.body).replace(/(?<=.)([A-Z])/g, ' $1');
        items.push(words.toLowerCase());
    } else if (route.bodyFormat === 'binary') {
        items.push('binary body');
    }
    return items.join(', ');
}

/**
 * Types come from the parsed (output) schema, so `z.stringbool()` shows as a
 * boolean, not the string it is sent as. Whether a param is required comes
 * from the input schema, where a param with a default is optional.
 */
function renderQueryTable(query: ParamsSchema, components: Components): string {
    const json = resolve(fromZod(query, 'output', components), components);
    const required = resolve(fromZod(query, 'input', components), components).required ?? [];

    return table(
        ['Field', 'Type', 'Default', 'Description'],
        Object.entries(json.properties ?? {}).map(([field, property]) => [
            `\`${field}\``,
            renderType(property, components),
            required.includes(field) ? 'required' : renderDefault(query.shape[field] as z.ZodType),
            (property as SchemaObject).description ?? '',
        ])
    );
}

/** Read from zod, because `toJSONSchema` drops the default of a union (the tap's `size`) */
function renderDefault(field: z.ZodType): string {
    const result = field.safeParse(undefined);
    if (!result.success || result.data === undefined) return '';
    return `\`${JSON.stringify(result.data)}\``;
}

/**
 * The response's description and fields. An array or record response
 * names its item schema and lists the item's fields instead.
 */
function renderResponse(schema: z.ZodType, components: Components): string[] {
    const parts: string[] = [];
    let json = resolve(fromZod(schema, 'output', components), components);
    if (json.description) parts.push(escapeMdx(json.description));

    if (json.type === 'array' && json.items) {
        parts.push(`An array of ${renderType(json.items, components)}.`);
        json = resolve(json.items, components);
        if (json.description) parts.push(escapeMdx(json.description));
    } else if (!json.properties && isSchema(json.additionalProperties)) {
        parts.push(`Each value is ${renderType(json.additionalProperties, components)}.`);
        json = resolve(json.additionalProperties, components);
        if (json.description) parts.push(escapeMdx(json.description));
    }

    if (json.properties) {
        parts.push(table(
            ['Field', 'Type', 'Description'],
            Object.entries(json.properties).map(([field, property]) => [
                `\`${field}\``,
                renderType(property, components),
                (property as SchemaObject).description ?? '',
            ])
        ));
        if (json.additionalProperties !== undefined && json.additionalProperties !== false) {
            parts.push('Can have fields not listed here.');
        }
    }

    return parts;
}

/**
 * A field's type for a table cell. Named object schemas show their name;
 * named enums show their values.
 */
function renderType(schemaOrRef: Schema, components: Components): string {
    const name = refName(schemaOrRef);
    if (name) {
        const target = components[name];
        if (target.enum || target.const !== undefined) return renderType(target, components);
        return `\`${name}\``;
    }

    const schema = schemaOrRef as SchemaObject;
    const union = schema.anyOf ?? schema.oneOf;
    if (union) return union.map((item) => renderType(item, components)).join(' | ');
    if (schema.const !== undefined) return `\`${JSON.stringify(schema.const)}\``;
    if (schema.enum) return schema.enum.map((value) => `\`${JSON.stringify(value)}\``).join(' | ');

    if (schema.type === 'array') {
        if (!schema.items) return 'array';
        const item = renderType(schema.items, components);
        return item.includes(' | ') ? `(${item})[]` : `${item}[]`;
    }
    if (schema.type === 'object' && !schema.properties && isSchema(schema.additionalProperties)) {
        return `object (${renderType(schema.additionalProperties, components)} values)`;
    }
    if (Array.isArray(schema.type)) return schema.type.join(' | ');
    return schema.type ?? 'any';
}

/** A `$ref` to a component is replaced by the component */
function resolve(schema: Schema, components: Components): SchemaObject {
    const name = refName(schema);
    return name ? components[name] : schema as SchemaObject;
}

/** `#/components/schemas/NodeState` → `NodeState` */
function refName(schema: Schema): string | undefined {
    return schema.$ref?.split('/').at(-1);
}

/** A schema with constraints; `{}` (any value) doesn't count */
function isSchema(value: unknown): value is Schema {
    return typeof value === 'object' && value !== null && Object.keys(value).length > 0;
}

function table(header: string[], rows: string[][]): string {
    return [
        `| ${header.join(' | ')} |`,
        `| ${header.map((title) => '-'.repeat(title.length)).join(' | ')} |`,
        ...rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`.replace(/ {2,}\|/g, ' |')),
    ].join('\n');
}

function escapeCell(text: string): string {
    return escapeMdx(text.replace(/\n/g, ' ').replace(/\|/g, '\\|'));
}

/**
 * The website reads docs as MDX, where `{`, `}` and `<` start an expression
 * or a tag. Escapes them outside code spans.
 */
function escapeMdx(text: string): string {
    return text.split('`')
        .map((part, i) => (i % 2 ? part : part.replace(/[{}<]/g, '\\$&')))
        .join('`');
}
