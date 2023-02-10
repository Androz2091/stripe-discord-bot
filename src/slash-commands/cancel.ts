import { SlashCommandRunFunction } from "../handlers/commands";
import { errorEmbed, successEmbed } from "../util";
import { Postgres, DiscordCustomer } from "../database";
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, PermissionsBitField } from "discord.js";
import { cancelSubscription, findActiveSubscriptions, findSubscriptionsFromCustomerId, getCustomerPayments, getLifetimePaymentDate, resolveCustomerIdFromEmail } from "../integrations/stripe";

export const commands = [
    {
        name: "cancel",
        description: "Cancel your current subscription",
        options: [
            {
                name: "user",
                description: "The user you want to cancel the subscription for",
                type: ApplicationCommandOptionType.User,
                required: false
            }
        ]
    }
];

export const run: SlashCommandRunFunction = async (interaction) => {

    if (interaction.channelId !== process.env.CANCEL_CHANNEL_ID) {
        return void interaction.reply({
            content: `This command can only be used in <#${process.env.CANCEL_CHANNEL_ID}>. Please go there and try again.`,
            ephemeral: true
        });
    }

    const user = interaction.options.getUser("user") || interaction.user;

    if (interaction.options.getUser("user") && !interaction.memberPermissions!.has(PermissionsBitField.Flags.Administrator)) {
        return void interaction.reply({
            content: `You don't have the permission to cancel someone else's subscription.`,
            ephemeral: true
        });
    }

    const discordCustomer = await Postgres.getRepository(DiscordCustomer).findOne({
        where: {
            discordUserId: user.id
        }
    });

    if (!discordCustomer) {
        return void interaction.reply({
            ephemeral: true,
            embeds: errorEmbed(`There is no email linked to your account!`).embeds
        });
    }

    const customerId = await resolveCustomerIdFromEmail(discordCustomer.email);

    const subscriptions = await findSubscriptionsFromCustomerId(customerId);
    const actives = findActiveSubscriptions(subscriptions);

    const cancelled = actives[0];

    if (!cancelled) {
        return void interaction.reply({
            ephemeral: true,
            embeds: errorEmbed(`You don't have an active subscription!`).embeds
        });
    }

    const confirmEmbed = new EmbedBuilder()
        .setAuthor({
            name: `${user.tag} cancellation`,
            iconURL: user.displayAvatarURL()
        })
        .setDescription(`Are you sure you want to cancel your subscription?`)
        .setColor(process.env.EMBED_COLOR);

    const random3DigitsId = Math.floor(Math.random() * 900) + 10;

    const components = [
        new ActionRowBuilder<ButtonBuilder>()
            .addComponents([
                new ButtonBuilder()
                    .setCustomId(`cancel-confirm-${user.id}-${random3DigitsId}`)
                    .setLabel("Confirm")
                    .setStyle(ButtonStyle.Danger)
            ])
    ];

    await interaction.reply({
        ephemeral: true,
        embeds: [confirmEmbed],
        components
    });

    const collector = interaction.channel!.createMessageComponentCollector({
        filter: (i) => (i as ButtonInteraction)?.customId === `cancel-confirm-${user.id}-${random3DigitsId}`,
        time: 1000 * 60 * 5
    });

    collector.on('collect', (_i) => {

        const i = _i as ButtonInteraction;

        if (i.isButton()) {

            if (i.customId === `cancel-confirm-${user.id}-${random3DigitsId}`) {
                const embed = new EmbedBuilder()
                .setAuthor({
                    name: `${user.tag} cancellation`,
                    iconURL: user.displayAvatarURL()
                })
                .setDescription(`We're sorry to see you go! Your subscription has been cancelled.`)
                .setColor(process.env.EMBED_COLOR);

                i.reply({
                    ephemeral: true,
                    embeds: [embed],
                    components: []
                });

                cancelSubscription(cancelled.id);
            }

        }

    });

    collector.on('end', () => {
        interaction.editReply({
            embeds: [confirmEmbed],
            components: []
        });
    });

}
