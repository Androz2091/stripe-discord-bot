import { Client, ApplicationCommand, ApplicationCommandData, CommandInteraction, Message, ChatInputApplicationCommandData, ContextMenuCommandInteraction } from "discord.js";
import { Collection } from '@discordjs/collection';
import { readdirSync } from "fs";
import { join } from "path";

interface SynchronizeSlashCommandOptions {
    guildId?: null|string;
    debug?: boolean;
}

export const synchronizeSlashCommands = async (client: Client, commands: ChatInputApplicationCommandData[], options: SynchronizeSlashCommandOptions = {}) => {

    const log = (message: string) => options.debug && console.log(message);

    const ready = client.readyAt ? Promise.resolve() : new Promise(resolve => client.once('ready', resolve));
    await ready;
    const currentCommands = options.guildId ? await client.application!.commands.fetch({
        guildId: options.guildId,
    }) : await client.application!.commands.fetch();

    log(`Synchronizing commands...`);
    log(`Currently ${currentCommands.size} commands.`);

    const newCommands = commands.filter((command) => !currentCommands.some((c) => c.name === command.name));
    for (let newCommand of newCommands) {
        if (options.guildId) await client.application!.commands.create(newCommand, options.guildId);
        else await client.application!.commands.create(newCommand);
    }

    log(`Created ${newCommands.length} commands!`);

    const deletedCommands = currentCommands.filter((command) => !commands.some((c) => c.name === command.name)).toJSON();
    for (let deletedCommand of deletedCommands) {
        await deletedCommand.delete();
    }

    log(`Deleted ${deletedCommands.length} commands!`);

    const updatedCommands = commands.filter((command) => currentCommands.some((c) => c.name === command.name));
    let updatedCommandCount = 0;
    for (let updatedCommand of updatedCommands) {
        const newCommand = updatedCommand;
        const previousCommand = currentCommands.find((c) => c.name === updatedCommand.name);
        let modified = false;
        if (previousCommand?.description !== newCommand?.description) modified = true;
        if (!ApplicationCommand.optionsEqual(previousCommand!.options ?? [], newCommand.options ?? [])) modified = true;
        if (modified) {
            await previousCommand!.edit(newCommand as unknown as ApplicationCommandData);
            updatedCommandCount++;
        }
    }

    log(`Updated ${updatedCommandCount} commands!`);

    log(`Commands synchronized!`);

    return {
        currentCommandCount: currentCommands.size,
        newCommandCount: newCommands.length,
        deletedCommandCount: deletedCommands.length,
        updatedCommandCount
    };

};

export interface SlashCommandRunFunction {
    (interaction: CommandInteraction, commandName: string): void;
}

export interface MessageCommandRunFunction {
    (message: Message, commandName: string): void;
}

export interface ContextMenuRunFunction {
    (interaction: ContextMenuCommandInteraction, contextMenuName: string): void;
}

export const loadSlashCommands = (client: Client) => {
    const commands = new Collection<string, SlashCommandRunFunction>();
    const commandsData: ChatInputApplicationCommandData[] = [];
    
    try {
        readdirSync(join(__dirname, '..', 'slash-commands')).forEach(file => {
            if (file.endsWith('.js')) {
                const command = require(join(__dirname, '..', 'slash-commands', file));
                if (!command.commands) return console.log(`${file} has no commands`);
                commandsData.push(...command.commands);
                command.commands.forEach((commandData: ChatInputApplicationCommandData) => {
                    commands.set(commandData.name, command.run);
                    console.log(`Loaded slash command ${commandData.name}`);
                });
            }
        });
    } catch {
        console.log(`No slash commands found`);
    }

    return {
        slashCommands: commands,
        slashCommandsData: commandsData
    };
}

export const loadMessageCommands = (client: Client) => {
    const commands = new Collection<string, MessageCommandRunFunction>();
    
    try {
        readdirSync(join(__dirname, '..', 'commands')).forEach(file => {
            if (file.endsWith('.js')) {
                const command = require(join(__dirname, '..', 'commands', file));
                if (!command.commands) return console.log(`${file} has no commands`);
                command.commands.forEach((commandName: string) => {
                    commands.set(commandName, command.run);
                    console.log(`Loaded message command ${commandName}`);
                });
            }
        });
    } catch {
        console.log(`No message commands found`);
    }

    return commands;
}

export const loadContextMenus = (client: Client) => {
    const contextMenus = new Collection<string, ContextMenuRunFunction>();
    const contextMenusData: ChatInputApplicationCommandData[] = [];

    try {
        readdirSync(join(__dirname, '..', 'context-menus')).forEach(file => {
            if (file.endsWith('.js')) {
                const contextMenu = require(join(__dirname, '..', 'context-menus', file));
                if (!contextMenu.contextMenus) return console.log(`${file} has no menus`);
                contextMenusData.push(...contextMenu.contextMenus);
                contextMenu.contextMenus.forEach((contextMenuData: ChatInputApplicationCommandData) => {
                    contextMenus.set(contextMenuData.name, contextMenu.run);
                    console.log(`Loaded context menu ${contextMenuData.name}`);
                });
            }
        });
    } catch {
        console.log(`No context menus found`);
    }

    return {
        contextMenus,
        contextMenusData
    };
};
