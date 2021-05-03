#!/usr/bin/env node

'use strict';

const {
    isString,
    isPrimitiveValue,
    primitiveToString,
    toTitleCase,
    isEmpty,
    flatten,
    flattenDeep,
    firstToUpper
} = require('@terascope/utils');
const { functionConfigRepository } = require('..');

function prettyPrint(input) {
    if (input == null) return 'null';
    if (isString(input)) return `"${input}"`;
    if (isPrimitiveValue(input)) return `${primitiveToString(input)}`;
    if (Array.isArray(input)) return `[${input.map(prettyPrint).join(', ')}]`;
    return Object.entries(input).map(([key, value]) => (
        `${key}: ${prettyPrint(value)}`
    )).join(', ');
}

/**
 * @param fnDef {import('..').FunctionDefinitionConfig}
*/
function generateExample(fnDef) {
    /**
     * @param example {import('..').FunctionDefinitionExample}
    */
    return function _generateExample(example) {
        const out = example.fails ? `throws ${example.output}` : `outputs ${prettyPrint(example.output)}`;
        return `
${example.description || ''}
\`\`\`ts
${prettyPrint(example.input)} => ${fnDef.name}(${prettyPrint(example.args)}) // ${out}
\`\`\`
        `.trim();
    };
}

/**
 * @param examples {readonly import('..').FunctionDefinitionExample[]}
*/
function generateExamples(fnDef, examples) {
    if (!examples || !examples.length) return [];
    return [
        '##### Examples',
        ...examples.map(generateExample(fnDef))
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
        '##### Arguments',
        ...Object.entries(fnDef.argument_schema).map(([field, fieldConfig]) => {
            const typeVal = fieldConfig.array ? `${fieldConfig.type}[]` : fieldConfig.type;
            const desc = fieldConfig.description ? ` - ${fieldConfig.description}` : '';
            return ` - **${field}**: ${isRequired(field) ? '(required)' : ''} \`${typeVal}\`${desc}`;
        })
    ];
}

/**
 * @param fnDef {import('..').FunctionDefinitionConfig}
*/
function generateAccepts(fnDef) {
    if (!fnDef.accepts || !fnDef.accepts.length) return [];
    return [
        '##### Accepts',
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
    return [
        `
#### \`${fnDef.name}\` (${fnDef.type})
${generateAliases(fnDef)}
> ${firstToUpper(fnDef.description)}`.trim(),
        ...generateArgDocs(fnDef),
        ...generateAccepts(fnDef),
        ...generateExamples(fnDef, fnDef.examples)
    ];
}

function generateDocsForCategory([category, fnsByType]) {
    const fns = flatten(Object.values(fnsByType));

    return [
        `### CATEGORY: ${toTitleCase(category.toLowerCase())}`,
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
title: Data-Mate Functions
sidebar_label: Functions
---
    `.trim();
}

function generateDocs() {
    return [
        generateHeader(),
        ...flattenDeep(generateAllFunctionsDocs()),
        '',
    ].join('\n\n');
}

// eslint-disable-next-line no-console
console.log(generateDocs());
