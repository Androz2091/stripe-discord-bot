import { SlashCommandRunFunction } from "../handlers/commands";
import fetch from 'node-fetch';
import { errorEmbed, successEmbed } from "../util";
import { DiscordCustomer, Postgres } from "../database";
import { ApplicationCommandOptionType, CommandInteractionOptionResolver, GuildMember } from "discord.js";
import { findActiveSubscriptions, findSubscriptionsFromCustomerId, getCustomerPayments, getLifetimePaymentDate, resolveCustomerIdFromEmail } from "../integrations/stripe";

export const commands = [
    {
        name: "email",
        description: "Get your exclusive access by providing your email!",
        options: [
            {
                name: "email",
                description: "Your email address",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    }
];

export const run: SlashCommandRunFunction = async (interaction) => {

    await interaction.deferReply();

    const email = (interaction.options as CommandInteractionOptionResolver).getString("email")!;

    const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;

    if (!emailRegex.test(email)) {
        return void interaction.followUp(errorEmbed("This email address is not valid and can not be used to access the server."));
    }

    const customerId = await resolveCustomerIdFromEmail(email);

    if (!customerId) return void interaction.followUp(errorEmbed("This email address is not part of our database."));
    
    const subscriptions = await findSubscriptionsFromCustomerId(customerId);
    const activeSubscriptions = findActiveSubscriptions(subscriptions);

    const userPayments = await getCustomerPayments(customerId);
    const hasLifetime = !!(await getLifetimePaymentDate(userPayments));

    if (!(activeSubscriptions.length > 0 || hasLifetime)) {
        return void interaction.followUp(errorEmbed(`You do not have an active subscription or lifetime access. Please buy one at ${process.env.STRIPE_PAYMENT_LINK} to access the server.`));
    }

    const userCustomer = await Postgres.getRepository(DiscordCustomer).findOne({
        where: {
            discordUserId: interaction.user.id
        }
    });

    const customer: Partial<DiscordCustomer> = {
        hadActiveSubscription: true,
        firstReminderSentDayCount: null,
        email,
        discordUserId: interaction.user.id,
    }

    if (userCustomer) await Postgres.getRepository(DiscordCustomer).update(userCustomer.id, customer);
    else await Postgres.getRepository(DiscordCustomer).insert(customer);

    await (interaction.member as GuildMember).roles.add(process.env.PAYING_ROLE_ID);

    return void interaction.followUp(successEmbed(`Welcome, you are eligible to the exclusive Discord access!`));
    
}
