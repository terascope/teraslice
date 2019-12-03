import {
    debugLogger,
    Logger,
    TSError,
    trim
} from '@terascope/utils';
import { parse } from './peg-engine';
import * as i from './interfaces';
import * as utils from './utils';

const _logger = debugLogger('xlucene-parser');

export class Parser {
    readonly ast: i.AST;
    readonly query: string;
    logger: Logger;

    constructor(query: string, options: i.ParserOptions = {}) {
        this.logger = options.logger != null
            ? options.logger.child({ module: 'xlucene-parser' })
            : _logger;

        this.query = trim(query || '');

        const variables = options.variables ? utils.validateVariables(options.variables) : {};
        const contextArg = {
            typeConfig: options.type_config,
            variables,
            logger: this.logger
        };

        try {
            this.ast = parse(this.query, {
                // pass in a context the certian variables
                // and functions can be passed in
                // in the parser as options.typeConfig
                // @ts-ignore
                contextArg,
            });
            const astJSON = JSON.stringify(this.ast, null, 4);
            this.logger.trace(`parsed ${this.query ? this.query : "''"} to `, astJSON);
        } catch (err) {
            console.error(err);
            if (err && err.message.includes('Expected ,')) {
                err.message = err.message.replace('Expected ,', 'Expected');
            }

            throw new TSError(err, {
                reason: `Failure to parse xlucene query "${this.query}"`,
            });
        }
    }

    forTypes<T extends i.ASTType[]>(types: T, cb: (node: i.AnyAST) => void) {
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

    forTermTypes(cb: (node: i.TermLike) => void) {
        this.forTypes(utils.termTypes, cb as (node: i.AnyAST) => void);
    }
}
