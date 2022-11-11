import { SlashCommandRunFunction } from "../handlers/commands";
import fetch from 'node-fetch';
import { errorEmbed, successEmbed } from "../util";
import { DiscordCustomer, Postgres } from "../database";
import { ApplicationCommandOptionType, CommandInteractionOptionResolver, GuildMember, PermissionsBitField } from "discord.js";
import { findActiveSubscriptions, findSubscriptionsFromCustomerId, getCustomerPayments, getLifetimePaymentDate, resolveCustomerIdFromEmail } from "../integrations/stripe";

export const commands = [
    {
        name: "admin-access",
        description: "Give admin access to a user",
        options: [
            {
                name: "enable",
                description: "Enable access for the user",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "user",
                        description: "The user you want to give access to",
                        type: ApplicationCommandOptionType.User,
                        required: true
                    }
                ]
            },
            {
                name: "disable",
                description: "Disable access for the user",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "user",
                        description: "The user you want to remove access from",
                        type: ApplicationCommandOptionType.User,
                        required: true
                    }
                ]
            }
        ]
    }
];

export const run: SlashCommandRunFunction = async (interaction) => {

    await interaction.deferReply();

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
        return void interaction.followUp(errorEmbed("This command needs privileged access and can only be used by administrators."));
    }

    const subCommand = (interaction.options as CommandInteractionOptionResolver).getSubcommand()!;
    const user = (interaction.options as CommandInteractionOptionResolver).getUser("user")!;

    const userCustomer = await Postgres.getRepository(DiscordCustomer).findOne({
        where: {
            discordUserId: interaction.user.id
        }
    });

    if (userCustomer) await Postgres.getRepository(DiscordCustomer).update(userCustomer.id, {
        adminAccessEnabled: subCommand === "enable"
    });
    else await Postgres.getRepository(DiscordCustomer).insert({
        discordUserId: user.id,
        adminAccessEnabled: subCommand === "enable"
    });

    const member = interaction.guild?.members.cache.get(user.id);

    if (subCommand === "enable") {
        if (member) await member.roles.add(process.env.ADMIN_ROLE_ID!);
    } else {
        if (member) await member.roles.remove(process.env.ADMIN_ROLE_ID!);
    }

    return void interaction.followUp(successEmbed(`Successfully ${subCommand === "enable" ? "enabled" : "disabled"} access for ${user.tag}.`));
    
}
