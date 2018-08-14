'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const path = require("path");
const fs = require("fs-extra");
class LoadOperation {
    constructor(context, terasliceOpPath) {
        this.terasliceOpPath = terasliceOpPath;
        this.opPath = lodash_1.get(context, 'context.sysconfig.teraslice.ops_directory', '');
    }
    find(name, assetsPath, executionAssets) {
        let filePath = '';
        let codeName = '';
        if (!name.match(/.js/)) {
            codeName = `${name}.js`;
        }
        function findCode(rootDir) {
            fs.readdirSync(rootDir).forEach((filename) => {
                const nextPath = path.join(rootDir, filename);
                // if name is same as filename/dir then we found it
                if (filename === name || filename === codeName) {
                    filePath = nextPath;
                }
                if (filePath || filename === 'node_modules')
                    return;
                if (fs.statSync(nextPath).isDirectory()) {
                    findCode(nextPath);
                }
            });
        }
        function findCodeByConvention(basePath, subfolders) {
            if (!basePath)
                return;
            if (!fs.pathExistsSync(basePath))
                return;
            subfolders.forEach((folder) => {
                const pathType = path.resolve(path.join(basePath, folder));
                if (!filePath && fs.pathExistsSync(pathType)) {
                    findCode(pathType);
                }
            });
        }
        findCodeByConvention(assetsPath, executionAssets);
        // if found, don't do extra searches
        if (filePath)
            return filePath;
        findCodeByConvention(this.terasliceOpPath, ['readers', 'processors']);
        // if found, don't do extra searches
        if (filePath)
            return filePath;
        findCodeByConvention(this.opPath, ['readers', 'processors']);
        return filePath;
    }
    load() {
    }
}
exports.default = LoadOperation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZC1vcGVyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9wYWNrYWdlcy90ZXJhc2xpY2Utb3BlcmF0aW9ucy9zcmMvbG9hZC1vcGVyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOztBQUViLG1DQUE2QjtBQUM3Qiw2QkFBNkI7QUFDN0IsK0JBQStCO0FBRy9CLE1BQXFCLGFBQWE7SUFJOUIsWUFBWSxPQUFnQixFQUFFLGVBQXVCO1FBQ2pELElBQUksQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLEdBQUcsWUFBRyxDQUFDLE9BQU8sRUFBRSwyQ0FBMkMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNoRixDQUFDO0lBRUQsSUFBSSxDQUFDLElBQVksRUFBRSxVQUFrQixFQUFFLGVBQXlCO1FBQzVELElBQUksUUFBUSxHQUFXLEVBQUUsQ0FBQztRQUMxQixJQUFJLFFBQVEsR0FBVyxFQUFFLENBQUM7UUFFMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDcEIsUUFBUSxHQUFHLEdBQUcsSUFBSSxLQUFLLENBQUM7U0FDM0I7UUFFRCxTQUFTLFFBQVEsQ0FBQyxPQUFlO1lBQzdCLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBZ0IsRUFBRSxFQUFFO2dCQUNqRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFFOUMsbURBQW1EO2dCQUNuRCxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxLQUFLLFFBQVEsRUFBRTtvQkFDNUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztpQkFDdkI7Z0JBQ0QsSUFBSSxRQUFRLElBQUksUUFBUSxLQUFLLGNBQWM7b0JBQUUsT0FBTztnQkFFcEQsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFO29CQUNyQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQ3RCO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxRQUFnQixFQUFFLFVBQW9CO1lBQ2hFLElBQUksQ0FBQyxRQUFRO2dCQUFFLE9BQU87WUFDdEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDO2dCQUFFLE9BQU87WUFFekMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQWMsRUFBRSxFQUFFO2dCQUNsQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQzNELElBQUksQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDMUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUN0QjtZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUVELG9CQUFvQixDQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUVsRCxvQ0FBb0M7UUFDcEMsSUFBSSxRQUFRO1lBQUUsT0FBTyxRQUFRLENBQUM7UUFFOUIsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBRXRFLG9DQUFvQztRQUNwQyxJQUFJLFFBQVE7WUFBRSxPQUFPLFFBQVEsQ0FBQztRQUU5QixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFFN0QsT0FBTyxRQUFRLENBQUM7SUFDcEIsQ0FBQztJQUVELElBQUk7SUFFSixDQUFDO0NBQ0o7QUEvREQsZ0NBK0RDIn0=