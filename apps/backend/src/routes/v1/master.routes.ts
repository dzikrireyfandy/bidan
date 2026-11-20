import { buildMasterRouter } from '../../controllers/master.controller';
import { MASTER_DEFINITIONS } from '../../validation/master';

export default buildMasterRouter(MASTER_DEFINITIONS);
