"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
function registerApis(context) {
    /*
     * This will request a connection based on the 'connection' attribute of
     * an opConfig. Intended as a context API endpoint.
     */
    function getClient(config, type) {
        const clientConfig = {
            type,
            cached: true,
            endpoint: 'default',
        };
        const events = context.apis.foundation.getSystemEvents();
        if (config && lodash_1.has(config, 'connection')) {
            clientConfig.endpoint = config.connection;
            const isCached = config.connection_cache != null;
            clientConfig.cached = isCached ? config.connection_cache : true;
        }
        else {
            clientConfig.endpoint = 'default';
            clientConfig.cached = true;
        }
        try {
            return context.apis.foundation.getConnection(clientConfig).client;
        }
        catch (err) {
            const error = new Error(`No configuration for endpoint ${clientConfig.endpoint} was found in the terafoundation connectors config`);
            context.logger.error(error);
            events.emit('client:initialization:error', { error: error.message });
            return null;
        }
    }
    context.apis.registerAPI('op_runner', {
        getClient,
    });
}
exports.registerApis = registerApis;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3BhY2thZ2VzL3RlcmFzbGljZS1vcGVyYXRpb25zL3NyYy9hcGlzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsbUNBQTZCO0FBUTdCLFNBQWdCLFlBQVksQ0FBQyxPQUFnQjtJQUN6Qzs7O09BR0c7SUFDSCxTQUFTLFNBQVMsQ0FBQyxNQUF1QixFQUFFLElBQVk7UUFDcEQsTUFBTSxZQUFZLEdBQXFCO1lBQ25DLElBQUk7WUFDSixNQUFNLEVBQUUsSUFBSTtZQUNaLFFBQVEsRUFBRSxTQUFTO1NBQ3RCLENBQUM7UUFDRixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUV6RCxJQUFJLE1BQU0sSUFBSSxZQUFHLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxFQUFFO1lBQ3JDLFlBQVksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUMxQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDO1lBQ2pELFlBQVksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztTQUNuRTthQUFNO1lBQ0gsWUFBWSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7WUFDbEMsWUFBWSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7U0FDOUI7UUFFRCxJQUFJO1lBQ0EsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUMsTUFBTSxDQUFDO1NBQ3JFO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDVixNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsWUFBWSxDQUFDLFFBQVEsb0RBQW9ELENBQUMsQ0FBQztZQUNwSSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3JFLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7SUFDTCxDQUFDO0lBRUQsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFO1FBQ2xDLFNBQVM7S0FDWixDQUFDLENBQUM7QUFDUCxDQUFDO0FBbkNELG9DQW1DQyJ9