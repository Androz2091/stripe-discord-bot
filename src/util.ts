import { EmbedBuilder } from "discord.js";

export const errorEmbed = (message: string) => {
    return {
        embeds: [
            new EmbedBuilder()
                .setDescription(`❌ | ${message}`)
                .setColor(process.env.EMBED_COLOR)
        ]
    }
}

export const successEmbed = (message: string) => {
    return {
        embeds: [
            new EmbedBuilder()
                .setDescription(`✅ | ${message}`)
                .setColor(process.env.EMBED_COLOR)
        ]
    }
}

export const replyEmbed = (message: string) => {
    return {
        embeds: [
            new EmbedBuilder()
                .setDescription(message)
                .setColor(process.env.EMBED_COLOR)
        ]
    }
}

export const generateId = () => {
    return Math.random().toString(36).slice(2, 12);
}

export const generateEmbeds = ({ entries, generateEmbed, generateEntry }: {
    entries: any[],
    generateEmbed: (idx: number) => EmbedBuilder,
    generateEntry: (entry: any) => string
}) => {
    const embeds: EmbedBuilder[] = [];
    entries.forEach((entry) => {
        const entryContent = generateEntry(entry);
        const lastEmbedTooLong = !embeds.length || (embeds.at(-1)!.data.description!.length + entryContent.length) >= 2048;
        if (lastEmbedTooLong) {
            const newEmbed = generateEmbed(embeds.length);
            embeds.push(newEmbed);
        }
        const lastEmbed = embeds.at(-1)!;
        lastEmbed.data.description += entryContent;
    });
    return embeds;
};
