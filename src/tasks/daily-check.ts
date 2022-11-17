import { EmbedBuilder, Guild, GuildMember, TextChannel } from "discord.js";
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
const makeMemberExpire = async (customer: DiscordCustomer, member: GuildMember, guild: Guild) => {
    await Postgres.getRepository(DiscordCustomer).update(customer.id, {
        hadActiveSubscription: false,
        // @ts-ignore
        firstReminderSentDayCount: null
    });
    member?.roles.remove(process.env.PAYING_ROLE_ID!);
    member?.roles.remove(process.env.LIFETIME_PAYING_ROLE_ID!);
    (guild.channels.cache.get(process.env.LOGS_CHANNEL_ID) as TextChannel).send(`**${member?.user?.tag || 'Unknown#0000'}** (${customer.discordUserId}) has completely lost access. Customer email is ${customer.email}.`);
}

export const run = async () => {
  
    const customers = await Postgres.getRepository(DiscordCustomer).find({});
    const guild = client.guilds.cache.get(process.env.GUILD_ID!)!;
    await guild.members.fetch();

    for (const customer of customers) {

        if (!customer.email || customer.adminAccessEnabled) continue;

        console.log(`[Daily Check] Checking ${customer.email}`);
        const customerId = await resolveCustomerIdFromEmail(customer.email);
        if (!customerId) {
            console.log(`[Daily Check] Could not find customer id for ${customer.email}`);
            continue;
        }

        const subscriptions = await findSubscriptionsFromCustomerId(customerId);
        const activeSubscriptions = findActiveSubscriptions(subscriptions) || [];

        const userPayments = await getCustomerPayments(customerId);
        const hasLifetime = !!(await getLifetimePaymentDate(userPayments));

        if (activeSubscriptions.length > 0 || hasLifetime) {

            console.log(`${customer.email} has active subscriptions or a lifetime one.`);
            
            if (!customer.hadActiveSubscription || customer.firstReminderSentDayCount) {
                await Postgres.getRepository(DiscordCustomer).update(customer.id, {
                    hadActiveSubscription: true,
                    // @ts-ignore
                    firstReminderSentDayCount: null
                });
            }

            const member = guild.members.cache.get(customer.discordUserId);
            if (member) {
                member.roles.add(process.env.PAYING_ROLE_ID!);
                if (hasLifetime) member.roles.add(process.env.LIFETIME_PAYING_ROLE_ID!);
            }

            continue;
        }

        // if the customer no had any active subscription, no need to send reminders
        if (!customer.hadActiveSubscription) continue;
        
        if (!subscriptions.some((sub: any) => sub.status === 'unpaid')) {
            const member = guild.members.cache.get(customer.discordUserId);
            console.log(`[Daily Check] Unpaid ${customer.email}`);
            member?.send({ embeds: [getExpiredEmbed(0)] });
            makeMemberExpire(customer, member!, guild);
            continue;
        }

        if (!customer.firstReminderSentDayCount) {

            console.log(`[Daily Check] Sending first reminder to ${customer.email}`);
            const member = guild.members.cache.get(customer.discordUserId);
            member?.send({ embeds: [getExpiredEmbed(2)] });
            await Postgres.getRepository(DiscordCustomer).update(customer.id, {
                firstReminderSentDayCount: 2
            });
            continue;
        }

        if (customer.firstReminderSentDayCount === 2) {

            console.log(`[Daily Check] Sending second reminder to ${customer.email}`);
            const member = guild.members.cache.get(customer.discordUserId);
            member?.send({ embeds: [getExpiredEmbed(1)] });
            await Postgres.getRepository(DiscordCustomer).update(customer.id, {
                firstReminderSentDayCount: 1
            });
            continue;
        }

        if (customer.firstReminderSentDayCount === 1) {

            console.log(`[Daily Check] Sending third reminder to ${customer.email}`);
            const member = guild.members.cache.get(customer.discordUserId);
            member?.send({ embeds: [getExpiredEmbed(0)] });
            makeMemberExpire(customer, member!, guild);
            continue;
        }

    }
    
};
