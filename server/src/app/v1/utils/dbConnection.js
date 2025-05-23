import logger from "../../../../../logger.js";
import config from "../../../../../config.js";

const DbConfig = {
    
};

const poolPromise = (async () => {
    try {
       
    } catch (err) {
        logger.info('Database Connection Failed! Bad Config: ', err);
        // throw err;
    }
})();

export {  poolPromise };
