import { SlashCommandRunFunction } from "../handlers/commands";
import { errorEmbed, successEmbed } from "../util";
import { Postgres, DiscordCustomer } from "../database";
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { findActiveSubscriptions, findSubscriptionsFromCustomerId, getCustomerPayments, getLifetimePaymentDate, resolveCustomerIdFromEmail } from "../integrations/stripe";

export const commands = [
    {
        name: "status",
        description: "Get your exclusive access status!",
        options: [
            {
                name: "user",
                description: "The user you want to get the status of",
                type: ApplicationCommandOptionType.User,
                required: false
            }
        ]
    }
];

export const run: SlashCommandRunFunction = async (interaction) => {

    const user = interaction.options.getUser("user") || interaction.user;

    const discordCustomer = await Postgres.getRepository(DiscordCustomer).findOne({
        where: {
            discordUserId: user.id
        }
    });

    if (!discordCustomer) {
        return void interaction.reply(errorEmbed(`There is no email linked to your account!`));
    }

    const customerId = await resolveCustomerIdFromEmail(discordCustomer.email);

    const subscriptions = await findSubscriptionsFromCustomerId(customerId);

    const payments = await getCustomerPayments(customerId);
    const lifetimePaymentDate = await getLifetimePaymentDate(payments);

    const embed = new EmbedBuilder()
        .setAuthor({
            name: `${user.tag}'s access`,
            iconURL: user.displayAvatarURL()
        })
        .setDescription(`Here are all the ${process.env.SUBSCRIPTION_NAME} subscriptions 👑`)
        .setColor(process.env.EMBED_COLOR)
        .addFields([
            {
                name: 'Subscriptions',
                value: subscriptions.length > 0 ? subscriptions.map((subscription: any) => {
                    return `${subscription.items.data[0]?.plan.nickname} (${subscription.status === 'active' ? "✅ Active" : ((subscription.cancel_at && subscription.current_period_end > Date.now() / 1000) ? "❌ Cancelled (not expired yet)" : "❌ Cancelled")})`
                }).join('\n') : "There is no subscription for this account."
            },
            {
                name: 'Lifetime',
                value: lifetimePaymentDate ? `✅ Lifetime access since ${new Date(lifetimePaymentDate).toDateString()}` : '❌ No lifetime access'
            },
            {
                name: 'Access given by the admins',
                value: discordCustomer.adminAccessEnabled ? '✅ Access' : '❌ No access'
            }
        ]);

    return void interaction.reply({
        ephemeral: true,
        embeds: [embed]
    });

}
