import { SlashCommandRunFunction } from "../handlers/commands";
import fetch from 'node-fetch';
import { errorEmbed, successEmbed } from "../util";
import { DiscordCustomer, Postgres } from "../database";
import { ApplicationCommandOptionType, CommandInteractionOptionResolver, EmbedBuilder, GuildMember, TextChannel } from "discord.js";
import { findActiveSubscriptions, findSubscriptionsFromCustomerId, getCustomerPayments, getLifetimePaymentDate, resolveCustomerIdFromEmail } from "../integrations/stripe";
import { Not } from "typeorm";

export const commands = [
    {
        name: "subscribe",
        description: "Subscribe or claim your active subscription!",
        options: [
            {
                name: "email",
                description: "Your email address",
                type: ApplicationCommandOptionType.String,
                required: false
            }
        ]
    }
];

export const run: SlashCommandRunFunction = async (interaction) => {

    if (interaction.channelId !== process.env.SUBSCRIBE_CHANNEL_ID) {
        return void interaction.reply({
            content: `This command can only be used in <#${process.env.SUBSCRIBE_CHANNEL_ID}>. Please go there and try again.`,
            ephemeral: true
        });
    }

    const email = (interaction.options as CommandInteractionOptionResolver).getString("email")!;

    const userCustomer = await Postgres.getRepository(DiscordCustomer).findOne({
        where: {
            discordUserId: interaction.user.id
        }
    });

    if (userCustomer && !email) {
        return void interaction.reply({
            ephemeral: true,
            embeds: [
                new EmbedBuilder()
                    .setColor(process.env.EMBED_COLOR)
                    .setDescription(`Hey **${interaction.user.username}**, you already have an active subscription linked to your account. You can update it by specifying your email again.`)
            ]
        });
    }

    if (!email) {
        return void interaction.reply({
            ephemeral: true,
            embeds: [
                new EmbedBuilder()
                    .setColor(process.env.EMBED_COLOR)
                    .setDescription(`Hey **${interaction.user.username}**, you can purchase a new subscription at ${process.env.STRIPE_PAYMENT_LINK} or claim your active subscription by using this command with the email parameter.`)
            ]
        })
    }

    const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;

    if (!emailRegex.test(email)) {
        return void interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(process.env.EMBED_COLOR)
                    .setDescription(`Hey **${interaction.user.username}**, this email is not subscribed yet. You can purchase a new subscription at ${process.env.STRIPE_PAYMENT_LINK} and run this command again.`)
            ],
            ephemeral: true
        });
    }

    const existingEmailCustomer = await Postgres.getRepository(DiscordCustomer).findOne({
        where: {
            email,
            discordUserId: Not(interaction.user.id)
        }
    });

    if (existingEmailCustomer) {
        return void interaction.reply({
            embeds: errorEmbed(`This email address is already in use by another user. Please use a different email address or contact us if you think this is an error.`).embeds,
            ephemeral: true
        });
    }

    const customerId = await resolveCustomerIdFromEmail(email);

    if (!customerId) return void interaction.reply({
        embeds: errorEmbed(`You do not have an active subscription. Please buy one at ${process.env.STRIPE_PAYMENT_LINK} to access the server.`).embeds,
        ephemeral: true
    });
    
    const subscriptions = await findSubscriptionsFromCustomerId(customerId);
    const activeSubscriptions = findActiveSubscriptions(subscriptions);

    if (!(activeSubscriptions.length > 0)) {
        return void interaction.reply({
            embeds: errorEmbed(`You do not have an active subscription. Please buy one at ${process.env.STRIPE_PAYMENT_LINK} to access the server.`).embeds,
            ephemeral: true
        });
    }

    const customer: Partial<DiscordCustomer> = {
        hadActiveSubscription: true,
        // @ts-ignore
        firstReminderSentDayCount: null,
        email,
        discordUserId: interaction.user.id,
    }

    if (userCustomer) await Postgres.getRepository(DiscordCustomer).update(userCustomer.id, customer);
    else await Postgres.getRepository(DiscordCustomer).insert(customer);

    const member = await interaction.guild?.members.fetch(interaction.user.id)?.catch(() => {});
    await (member as GuildMember)?.roles.add(process.env.PAYING_ROLE_ID);

    (member?.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID) as TextChannel).send(`:arrow_upper_right: **${member?.user?.tag || 'Unknown#0000'}** (${customer.discordUserId}, <@${customer.discordUserId}>) has been linked to \`${customer.email}\`.`);

    return void interaction.reply({
        ephemeral: true,
        embeds: successEmbed(`Welcome, you are eligible to the exclusive Discord access!`).embeds
    });
    
}
