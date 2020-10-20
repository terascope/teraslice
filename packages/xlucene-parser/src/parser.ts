import {
    TSError,
    trim
} from '@terascope/utils';
import { xLuceneVariables } from '@terascope/types';
import { parse } from './peg-engine';
import * as i from './interfaces';
import * as utils from './utils';

export class Parser {
    readonly ast: i.AST;
    readonly query: string;
    readonly variables: xLuceneVariables;

    constructor(query: string, options: i.ParserOptions = {}) {
        this.query = trim(query || '');

        this.variables = options.variables ? utils.validateVariables(options.variables) : {};
        const contextArg: i.ContextArg = {
            typeConfig: options.type_config,
            variables: this.variables,
        };

        try {
            this.ast = parse(this.query, { contextArg });

            if (utils.logger.level() === 10) {
                const astJSON = JSON.stringify(this.ast, null, 4);
                utils.logger.trace(`parsed ${this.query ? this.query : "''"} to `, astJSON);
            }
        } catch (err) {
            if (err && err.message.includes('Expected ,')) {
                err.message = err.message.replace('Expected ,', 'Expected');
            }

            throw new TSError(err, {
                reason: `Failure to parse xLucene query "${this.query}"`,
            });
        }
    }

    forTypes<T extends i.ASTType[]>(types: T, cb: (node: i.AnyAST) => void): void {
        const walkNode = (node: i.AnyAST) => {
            if (types.includes(node.type)) {
                cb(node);
            }

            if (utils.isNegation(node)) {
                walkNode(node.node);
                return;
            }

            if (utils.isGroupLike(node)) {
                for (const conj of node.flow) {
                    walkNode(conj);
                }
                return;
            }

            if (utils.isConjunction(node)) {
                for (const conj of node.nodes) {
                    walkNode(conj);
                }
            }
        };

        walkNode(this.ast);
    }

    forTermTypes(cb: (node: i.TermLike) => void): void {
        this.forTypes(utils.termTypes, cb as (node: i.AnyAST) => void);
    }
}
