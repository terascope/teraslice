import { debugLogger, Logger, TSError, trim, toBoolean } from '@terascope/utils';
import { TypeConfig } from '../interfaces';
import engine, { Tracer } from './engine';
import * as i from './interfaces';
import * as utils from './utils';

const _logger = debugLogger('xlucene-parser');
const debugLucene = toBoolean(process.env.DEBUG_LUCENE);

export class Parser {
    readonly ast: i.AST;
    readonly query: string;
    logger: Logger;

    constructor(query: string, typeConfig: TypeConfig = {}, logger?: Logger) {
        this.logger = logger != null ? logger.child({ module: 'xlucene-parser' }) : _logger;
        this.query = trim(query || '');

        const tracer = new Tracer(this.query, {
            showTrace: false,
        });
        try {
            this.ast = engine.parse(this.query, {
                tracer,
                // pass in the type config so it is available
                // in the parser as options.typeConfig
                // @ts-ignore
                typeConfig,
            });
            const astJSON = JSON.stringify(this.ast, null, 4);
            this.logger.trace(`parsed ${this.query ? this.query : "''"} to `, astJSON);
        } catch (err) {
            if (err && err.message.includes('Expected ,')) {
                err.message = err.message.replace('Expected ,', 'Expected');
            }

            throw new TSError(err, {
                reason: `Failure to parse xlucene query "${this.query}"`,
            });
        } finally {
            if (debugLucene) {
                // tslint:disable-next-line no-console
                console.error(tracer.getBacktraceString());
            }
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
                return;
            }
        };

        walkNode(this.ast);
    }

    forTermTypes(cb: (node: i.TermLike) => void) {
        this.forTypes(utils.termTypes, cb as (node: i.AnyAST) => void);
    }
}
