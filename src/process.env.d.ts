// eslint-disable-next-line no-unused-vars
declare namespace NodeJS {
    
    import { ColorResolvable } from "discord.js";

    export interface ProcessEnv {
        DISCORD_CLIENT_TOKEN: string;

        DB_NAME: string;
        DB_HOST: string;
        DB_USERNAME: string;
        DB_PASSWORD: string;

        EMBED_COLOR: ColorResolvable;

        COMMAND_PREFIX: string;

        GUILD_ID: string|undefined;

        SPREADSHEET_ID: string|undefined;

        ENVIRONMENT: string;

        ADMINJS_PORT: number|undefined;
        ADMINJS_COOKIE_HASH: string|undefined;
        ADMINJS_PASSWORD: string|undefined;

        EMAIL_COMMAND_CHANNEL_ID: string;
        STRIPE_API_KEY: string;
        PAYING_ROLE_ID: string;
        LIFETIME_PAYING_ROLE_ID: string;
        LIFETIME_INVOICE_LABEL_KEYWORD: string;
        STRIPE_PAYMENT_LINK: string;
        LOGS_CHANNEL_ID: string;
        SUBSCRIPTION_NAME: string;
    }
}