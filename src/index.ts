import { config } from 'dotenv';
config();

import { initialize as initializeDatabase } from './database';
import { loadContextMenus, loadMessageCommands, loadSlashCommands, synchronizeSlashCommands } from './handlers/commands';

import { syncSheets } from './integrations/sheets';

import { Client, IntentsBitField } from 'discord.js';
import { errorEmbed } from './util';
import { loadTasks } from './handlers/tasks';
export const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages
    ]
});

const { slashCommands, slashCommandsData } = loadSlashCommands(client);
const { contextMenus, contextMenusData } = loadContextMenus(client);
const messageCommands = loadMessageCommands(client);
loadTasks(client);

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
        });
    } else {
        console.log('Database not initialized, as no keys were specified 📦');
    }

    if (process.env.SPREADSHEET_ID) {
        syncSheets();
    }
});

client.login(process.env.DISCORD_CLIENT_TOKEN);
