import { config } from 'dotenv';
config();

import './sentry';

import { initialize as initializeDatabase } from './database';
import { loadContextMenus, loadMessageCommands, loadSlashCommands, synchronizeSlashCommands } from './handlers/commands';

import { syncSheets } from './integrations/sheets';

import { Client, IntentsBitField, PermissionsBitField } from 'discord.js';
import { errorEmbed } from './util';
import { loadTasks } from './handlers/tasks';
export const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers
    ]
});

const { slashCommands, slashCommandsData } = loadSlashCommands(client);
const { contextMenus, contextMenusData } = loadContextMenus(client);
const messageCommands = loadMessageCommands(client);
const tasks = loadTasks(client);

synchronizeSlashCommands(client, [...slashCommandsData, ...contextMenusData], {
    debug: true,
    guildId: process.env.GUILD_ID
});

client.on('interactionCreate', async (interaction) => {

    if (interaction.isCommand()) {

        const isContext = interaction.isContextMenuCommand();
        if (isContext) {
            const run = contextMenus.get(interaction.commandName);
            if (!run) return;
            run(interaction, interaction.commandName);
        } else {
            const run = slashCommands.get(interaction.commandName);
            if (!run) return;
            run(interaction, interaction.commandName);
        }
    }

});

client.on('messageCreate', (message) => {

    if (message.author.bot) return;

    if (!process.env.COMMAND_PREFIX) return;

    if ((message.channelId === process.env.STATUS_CHANNEL_ID || message.channelId === process.env.SUBSCRIBE_CHANNEL_ID || message.channelId === process.env.CANCEL_CHANNEL_ID) && !message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        message.delete();
    }
    
    const args = message.content.slice(process.env.COMMAND_PREFIX.length).split(/ +/);
    const commandName = args.shift();

    if (!commandName) return;

    const run = messageCommands.get(commandName);
    
    if (!run) return;

    run(message, commandName);

});

client.on('ready', () => {
    console.log(`Logged in as ${client.user!.tag}. Ready to serve ${client.users.cache.size} users in ${client.guilds.cache.size} servers 🚀`);

    if (process.env.DB_NAME) {
        initializeDatabase().then(() => {
            console.log('Database initialized 📦');

            if (process.argv.includes('--sync')) {
                tasks.tasks.first()?.run();
            }
        });
    } else {
        console.log('Database not initialized, as no keys were specified 📦');
    }

    if (process.env.SPREADSHEET_ID) {
        syncSheets();
    }
});

client.login(process.env.DISCORD_CLIENT_TOKEN);
