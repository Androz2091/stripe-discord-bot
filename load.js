const { config } = require('dotenv');
config();

const fs = require('fs');

const csvPath = './data.csv';
const csv = fs.readFileSync(csvPath, 'utf8');

const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        Discord.IntentsBitField.Flags.GuildMembers,
        Discord.IntentsBitField.Flags.Guilds,
    ]
});

client.login(process.env.DISCORD_CLIENT_TOKEN);

const papa = require('papaparse');

const data = papa.parse(csv, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
});

const members = [];

client.on('ready', async () => {

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    await guild.members.fetch();

    const sqlQuery = `INSERT INTO discord_customer ("discordUserId", "email", "hadActiveSubscription") VALUES `
    const values = [];

    console.log(data.data)
    
    for (let row of data.data) {
        const member = guild.members.cache.find((m) => m.user.tag === row['Discord name with #']);
        if (!member) {
            members.push(row['Discord name with #'])
        } else values.push(`('${member.id}', '${row['Buyer E-mail']}', true)`);
    }
    
    const sql = sqlQuery + values.join(',\n');
    
    fs.writeFileSync('./dump.sql', sql);
    fs.writeFileSync('./members.json', JSON.stringify(members, null, 2));

});

