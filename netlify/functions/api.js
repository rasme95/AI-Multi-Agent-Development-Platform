import serverless from "serverless-http";

import { createApp } from "../../src/index.js";

const app = createApp();

export const handler = serverless(app);
