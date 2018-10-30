"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const peg_engine_1 = __importDefault(require("../../../peg/peg_engine"));
class LuceneQueryParser {
    constructor() {
        this._ast = {};
    }
    parse(luceneStr) {
        try {
            this._ast = peg_engine_1.default.parse(luceneStr);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2x1Y2VuZS1xdWVyeS1wYXJzZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSx5RUFBNkM7QUFPN0MsTUFBcUIsaUJBQWlCO0lBRWxDO1FBQ0ksSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUNNLEtBQUssQ0FBQyxTQUFpQjtRQUMxQixJQUFJO1lBQ0EsSUFBSSxDQUFDLElBQUksR0FBRyxvQkFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUN2QztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1YsTUFBTSxJQUFJLEtBQUssQ0FBQyx5REFBeUQsU0FBUyxhQUFhLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1NBQ2pIO0lBQ0wsQ0FBQztJQUVNLGFBQWEsQ0FBQyxLQUFTLEVBQUUsTUFBVyxFQUFFLE9BQWE7UUFDdEQsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQztRQUN0QixNQUFNLEdBQUcsR0FBRyxPQUFPLElBQUksSUFBSSxDQUFDO1FBRTVCLFNBQVMsSUFBSSxDQUFDLElBQVMsRUFBRSxNQUFjLEVBQUUsS0FBYTtZQUNsRCxNQUFNLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBRW5GLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDWCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ3hDO1lBRUQsS0FBSyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFN0IsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUNaLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDekM7WUFDRCxJQUFJLE1BQU07Z0JBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDNUIsQ0FBQztDQUNKO0FBbENELG9DQWtDQyJ9