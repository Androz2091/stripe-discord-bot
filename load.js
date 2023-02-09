const fs = require('fs');

const csvPath = './data.csv';
const csv = fs.readFileSync(csvPath, 'utf8');

const papa = require('papaparse');

const data = papa.parse(csv, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
});

const sqlQuery = `INSERT INTO discord_customer ("discordUserId", "email", "hadActiveSubscription") VALUES `
const values = [];

for (let row of data.data) {
    values.push(`('${row.id}', '${row.email}', true)`);
}

const sql = sqlQuery + values.join(', ');

fs.writeFileSync('./dump.sql', sql);
