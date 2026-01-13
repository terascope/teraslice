#!/usr/bin/env node
import {
    toTitleCase, isEmpty, flatten,
    flattenDeep, firstToUpper, uniq,
    isPlainObject, trim, trimEnd,
} from '@terascope/core-utils';
import { inspect } from 'node:util';
import { functionConfigRepository } from '../dist/src/index.js';

function prettyPrint(input) {
    if (isPlainObject(input) && !Object.keys(input).length) {
        return '';
    }
    return inspect(input, { depth: 10 });
}

function desc(input, prefix = '') {
    if (!input.description) return '';
    return prefix + firstToUpper(trimEnd(input.description.trim(), '.'));
}

/**
 * @param example {import('..').FunctionDefinitionExample}
*/
function getExampleOutput(example) {
    if (example.fails) {
        if (!example.output) {
            return '<small>Throws</small>';
        }
        return `<small>Throws:</small>
\`${example.output}\``;
    }
    if (example.serialize_output == null) {
        return `<small>Output:</small>

\`\`\`ts
${prettyPrint(example.output)}
\`\`\``;
    }
    return `<small>Output:</small>

\`\`\`ts
${prettyPrint(example.serialize_output(example.output))}
\`\`\``;
}

/**
 * @param fnDef {import('..').FunctionDefinitionConfig}
*/
function generateExample(fnDef) {
    /**
     * @param example {import('..').FunctionDefinitionExample}
    */
    return function _generateExample(example, index) {
        return `
${desc(example)}

**# Example (${index + 1})**

\`\`\`ts
${fnDef.name}(${prettyPrint(example.args)})
\`\`\`

<small>Input:</small>

\`\`\`ts
${prettyPrint(example.input)}
\`\`\`

${getExampleOutput(example)}
        `.trim();
    };
}

/**
 * @param examples {readonly import('..').FunctionDefinitionExample[]}
*/
function generateExamples(fnDef, examples) {
    if (!examples || !examples.length) return [];
    return [
        '#### Examples',
        ...uniq(examples.filter((ex) => !ex.test_only).map(generateExample(fnDef)))
    ];
}

/**
 * @param fnDef {import('..').FunctionDefinitionConfig}
*/
function generateArgDocs(fnDef) {
    if (isEmpty(fnDef.argument_schema)) return [];

    function isRequired(field) {
        if (!fnDef.required_arguments || !fnDef.required_arguments.length) return false;
        return fnDef.required_arguments.includes(field);
    }

    return [
        '#### Arguments',
        ...Object.entries(fnDef.argument_schema).map(([field, fieldConfig]) => {
            const typeVal = fieldConfig.array ? `${fieldConfig.type}[]` : fieldConfig.type;
            return ` - **${field}**: ${isRequired(field) ? '(required)' : ''} \`${typeVal}\`${desc(fieldConfig, ' - ')}`;
        })
    ];
}

/**
 * @param fnDef {import('..').FunctionDefinitionConfig}
*/
function generateAccepts(fnDef) {
    if (!fnDef.accepts || !fnDef.accepts.length) return [];
    return [
        '#### Accepts',
        fnDef.accepts.map((type) => `- \`${type}\``).join('\n'),
    ];
}

/**
 * @param fnDef {import('..').FunctionDefinitionConfig}
*/
function generateAliases(fnDef) {
    if (!fnDef.aliases || !fnDef.aliases.length) return '';
    return `**Aliases:** ${fnDef.aliases.map((alias) => `\`${alias}\``).join(', ')}\n`;
}

/**
 * @param fnDef {import('..').FunctionDefinitionConfig}
*/
function generateFunctionDoc(fnDef) {
    const trimmedDesc = trimEnd(trim(fnDef.description), '.');
    const fnDescription = firstToUpper(trimmedDesc)
        .split('\n')
        .join('\n>');

    return [
        `
### \`${fnDef.name}\`

**Type:** \`${fnDef.type}\`
${generateAliases(fnDef)}
> ${fnDescription}`.trim(),
        ...generateArgDocs(fnDef),
        ...generateAccepts(fnDef),
        ...generateExamples(fnDef, fnDef.examples)
    ];
}

function generateDocsForCategory([category, fnsByType]) {
    const fns = flatten(Object.values(fnsByType));

    return [
        `## CATEGORY: ${category === 'JSON'
            ? category
            : toTitleCase(category.toLowerCase())}`,
        ...fns.map(generateFunctionDoc)
    ];
}

function generateAllFunctionsDocs() {
    const categories = new Map();

    for (const fnDef of Object.values(functionConfigRepository)) {
        const cat = fnDef.category || 'MISC';
        const fnsByType = categories.has(cat) ? categories.get(cat) : {};
        if (fnsByType[fnDef.type] == null) {
            fnsByType[fnDef.type] = [];
        }
        fnsByType[fnDef.type].push(fnDef);
        categories.set(cat, fnsByType);
    }

    return [...categories].map(generateDocsForCategory);
}

function generateHeader() {
    return `
---
title: "Data-Mate Functions"
sidebar_label: Functions
---
    `.trim();
}

function generateDocs() {
    return `${[
        generateHeader(),
        ...flattenDeep(generateAllFunctionsDocs()),
        '',
    ].join('\n\n').trim()}\n`;
}

process.stdout.write(generateDocs());
