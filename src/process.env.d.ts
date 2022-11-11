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
    }
}