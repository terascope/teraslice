#!/usr/bin/env node

'use strict';

const { isPrimitiveValue, toTitleCase } = require('@terascope/utils');
/* @ts-check */

const _ = require('lodash');
const { functionConfigRepository } = require('..');

function prettyPrint(input) {
    if (input == null) return 'null';
    if (_.isString(input)) return `"${input}"`;
    if (isPrimitiveValue(input)) return `${toString(input)}`;
    if (Array.isArray(input)) return `[${input.map(prettyPrint)}]`;
    return Object.entries(input).map(([key, value]) => (
        `${key}: ${prettyPrint(value)}`
    )).join('\n');
}

/**
 * @param fnDef {import('..').FunctionDefinitionConfig}
*/
function generateExample(fnDef) {
    /**
     * @param example {import('..').FunctionDefinitionExample}
    */
    return function _generateExample(example) {
        return `
${example.description || ''}
\`\`\`ts
${prettyPrint(example.input)} => ${fnDef.name}(${prettyPrint(example.args)}) // outputs ${prettyPrint(example.output)}
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
        '#### Examples',
        ...examples.map(generateExample(fnDef))
    ];
}

/**
 * @param fnDef {import('..').FunctionDefinitionConfig}
*/
function generateFunctionDoc(fnDef) {
    return [
        `
### \`${fnDef.name}\`

> ${fnDef.description}`.trim(),
        ...generateExamples(fnDef, fnDef.examples)
    ];
}

function generateDocsForCategory([category, fnsByType]) {
    const fns = _.flatten(Object.values(fnsByType));

    return [
        `## ${toTitleCase(category.toLowerCase())}`,
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
        ..._.flattenDeep(generateAllFunctionsDocs()),
        '',
    ].join('\n\n');
}

// eslint-disable-next-line no-console
console.log(generateDocs());
