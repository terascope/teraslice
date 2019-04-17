import { debugLogger, Logger, TSError } from '@terascope/utils';
import engine, { Tracer } from './engine';
import * as i from './interfaces';
import * as utils from './utils';

const _logger = debugLogger('xlucene-parser');

export class Parser {
    readonly ast: i.AST;
    readonly query: string;
    logger: Logger;

    constructor(query: string, logger?: Logger) {
        this.logger = logger != null ? logger.child({ module: 'xlucene-parser' }) : _logger;
        this.query = query;

        const tracer = new Tracer(this.query, {
            showTrace: false,
        });
        try {
            this.ast = engine.parse(this.query, {
                tracer,
            });
            this.logger.trace(`parsed ${this.query} to `, this.ast);
        } catch (err) {
            if (err && err.message.includes('Expected ,')) {
                err.message = err.message.replace('Expected ,', 'Expected');
            }

            throw new TSError(err, {
                reason: `Failure to parse xlucene query "${this.query}"`
            });
        } finally {
            if (process.env.DEBUG_LUCENE === '1')  {
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
