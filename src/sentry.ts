import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";

global.__rootdir__ = __dirname || process.cwd();
declare global {
    var __rootdir__: string;
}

if (process.env.SENTRY_API_KEY) {
    Sentry.init({
        dsn: process.env.SENTRY_API_KEY,
        tracesSampleRate: 1.0,
        integrations: [
            new RewriteFrames({
                root: global.__rootdir__
            })
        ]
    });
}
