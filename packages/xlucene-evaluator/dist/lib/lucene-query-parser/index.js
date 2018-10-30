"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser = require('../../../peg/peg_engine');
class LuceneQueryParser {
    constructor() {
        this._ast = {};
    }
    parse(luceneStr) {
        try {
            this._ast = parser.parse(luceneStr);
        }
        catch (err) {
            throw new Error(`error occured while attempting to parse lucene query: ${luceneStr} , error: ${err.message}`);
        }
    }
    walkLuceneAst(preCb, postCb, _argAst) {
        const { _ast } = this;
        const ast = _argAst || _ast;
        function walk(node, _field, depth) {
            const topField = (node.field && node.field !== "<implicit>") ? node.field : _field;
            if (node.left) {
                walk(node.left, topField, depth + 1);
            }
            preCb(node, topField, depth);
            if (node.right) {
                walk(node.right, topField, depth + 1);
            }
            if (postCb)
                postCb(node, topField, depth);
        }
        return walk(ast, '', 0);
    }
}
exports.default = LuceneQueryParser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2x1Y2VuZS1xdWVyeS1wYXJzZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxNQUFNLE1BQU0sR0FBSSxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQU9uRCxNQUFxQixpQkFBaUI7SUFFbEM7UUFDSSxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBQ00sS0FBSyxDQUFDLFNBQWlCO1FBQzFCLElBQUk7WUFDQSxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDdkM7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNWLE1BQU0sSUFBSSxLQUFLLENBQUMseURBQXlELFNBQVMsYUFBYSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztTQUNqSDtJQUNMLENBQUM7SUFFTSxhQUFhLENBQUMsS0FBUyxFQUFFLE1BQVcsRUFBRSxPQUFhO1FBQ3RELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDdEIsTUFBTSxHQUFHLEdBQUcsT0FBTyxJQUFJLElBQUksQ0FBQztRQUU1QixTQUFTLElBQUksQ0FBQyxJQUFTLEVBQUUsTUFBYyxFQUFFLEtBQWE7WUFDbEQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUVuRixJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ1gsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQzthQUN4QztZQUVELEtBQUssQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTdCLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDWixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ3pDO1lBQ0QsSUFBSSxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzVCLENBQUM7Q0FDSjtBQWxDRCxvQ0FrQ0MifQ==