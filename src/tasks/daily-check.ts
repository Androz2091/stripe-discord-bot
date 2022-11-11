import { EmbedBuilder, GuildMember, TextChannel } from "discord.js";
import { client } from "..";
import { DiscordCustomer, Postgres } from "../database";
import { findActiveSubscriptions, findSubscriptionsFromCustomerId, getCustomerPayments, getLifetimePaymentDate, resolveCustomerIdFromEmail } from "../integrations/stripe";

export const crons = [
   '0 0 1 * * *'
];

const getExpiredEmbed = (daysLeft: 0 | 1 | 2): EmbedBuilder => {
    const title = daysLeft > 0 ? 'Your subscription is about to expire' : 'Your subscription is expired';
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setURL(process.env.STRIPE_PAYMENT_LINK)
        .setColor(process.env.EMBED_COLOR)
        .setDescription(`Please visit ${process.env.STRIPE_PAYMENT_LINK} to keep your exclusive access! ${daysLeft > 0 ? `Your subscription expires within ${daysLeft * 24} hours.` : ''}`);
    return embed;
}

/**
 * 1) Mark user as inactive
 * 2) Clear reminders
 * 3) Remove role
 * 4) Send logs
 */
const makeMemberExpire = async (customer: DiscordCustomer, member: GuildMember) => {
    await Postgres.getRepository(DiscordCustomer).update(customer.id, {
        hadActiveSubscription: false,
        firstReminderSentDayCount: null
    });
    member?.roles.remove(process.env.PAYING_ROLE_ID!);
    (member.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID) as TextChannel).send(`**${member?.user?.tag || 'Unknown#0000'}** (${customer.discordUserId}) has completely lost access. Customer email is ${customer.email}.`);
}

export const run = async () => {
  
    const customers = await Postgres.getRepository(DiscordCustomer).find({});
    const guild = client.guilds.cache.get(process.env.GUILD_ID!)!;
    await guild.members.fetch();

    for (const customer of customers) {

        if (!customer.email || customer.adminAccessEnabled) continue;

        console.log(`[Daily Check] Checking ${customer.email}`);
        const customerId = await resolveCustomerIdFromEmail(customer.email);
        if (!customerId) return console.log(`[Daily Check] Could not find customer id for ${customer.email}`);

        const subscriptions = await findSubscriptionsFromCustomerId(customerId);
        const activeSubscriptions = findActiveSubscriptions(subscriptions) || [];

        const userPayments = await getCustomerPayments(customerId);
        const hasLifetime = !!(await getLifetimePaymentDate(userPayments));

        if (activeSubscriptions.length > 0 || hasLifetime) {

            console.log(`${customer.email} has active subscriptions or a lifetime one.`);
            
            if (!customer.hadActiveSubscription || customer.firstReminderSentDayCount) {
                await Postgres.getRepository(DiscordCustomer).update(customer.id, {
                    hadActiveSubscription: true,
                    firstReminderSentDayCount: null
                });
            }

            continue;
        }
        
        // if the user has an unpaid subscription, we do not grant the 2 days grace period
        if (!subscriptions.some((sub: any) => sub.status === 'unpaid')) {
            const member = guild.members.cache.get(customer.discordUserId);
            member?.send({ embeds: [getExpiredEmbed(0)] });
            makeMemberExpire(customer, member!);
            continue;
        }

        // if the customer no had any active subscription, no need to send reminders
        if (!customer.hadActiveSubscription) continue;

        if (!customer.firstReminderSentDayCount) {
            const member = guild.members.cache.get(customer.discordUserId);
            member?.send({ embeds: [getExpiredEmbed(2)] });
            await Postgres.getRepository(DiscordCustomer).update(customer.id, {
                firstReminderSentDayCount: 2
            });
            continue;
        }

        if (customer.firstReminderSentDayCount === 2) {
            const member = guild.members.cache.get(customer.discordUserId);
            member?.send({ embeds: [getExpiredEmbed(1)] });
            await Postgres.getRepository(DiscordCustomer).update(customer.id, {
                firstReminderSentDayCount: 1
            });
            continue;
        }

        if (customer.firstReminderSentDayCount === 1) {
            const member = guild.members.cache.get(customer.discordUserId);
            member?.send({ embeds: [getExpiredEmbed(0)] });
            makeMemberExpire(customer, member!);
            continue;
        }

    }
    
};
