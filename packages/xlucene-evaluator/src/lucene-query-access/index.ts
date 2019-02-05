
import _ from 'lodash';
import { TSError } from '@terascope/utils';
import LuceneQueryParser from '../lucene-query-parser';
import { IMPLICIT } from '../constants';
import { AST } from '../interfaces';

interface Config {
    exclude?: string[];
    include?: string[];
}

export default class LuceneQueryAccess {
    public exclude: string[];
    public include: string[];
    private _parser: LuceneQueryParser;

    constructor(config: Config) {
        const { exclude = [], include = [] } = config;
        this.exclude = exclude;
        this.include = include;

        this._parser = new LuceneQueryParser();
    }

    restrict(query: string): string {
        if (this.include.length && !query.length) {
            throw new TSError('Empty queries are restricted', {
                statusCode: 403
            });
        }

        this._parser.parse(query);
        this._parser.walkLuceneAst((node: AST, field: string) => {
            // restrict when a term is specified without a field
            if (node.field && !field) {
                throw new TSError('Implicit queries are restricted', {
                    statusCode: 403
                });
            }

            if (!node.field || node.field === IMPLICIT) return;

            if (isFieldExcluded(this.exclude, node.field)) {
                throw new TSError(`Field ${node.field} is restricted`, {
                    statusCode: 403
                });
            }

            if (isFieldIncluded(this.include, node.field)) {
                throw new TSError(`Field ${node.field} is restricted`,  {
                    statusCode: 403
                });
            }
        });

        return query;
    }
}

function isFieldExcluded(exclude: string[], field: string): boolean {
    if (!exclude.length) return false;
    return _.some(exclude, (str) => _.startsWith(field, str));
}

function isFieldIncluded(include: string[], field: string): boolean {
    if (!include.length) return false;
    return !_.some(include, (str) => _.startsWith(field, str));
}
