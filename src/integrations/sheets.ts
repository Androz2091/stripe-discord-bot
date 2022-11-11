import { google } from 'googleapis';
import { parse } from 'date-format-parse';
import { join } from 'path';

const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

const auth = new google.auth.GoogleAuth({
    keyFilename: join(__dirname, '..', '..', 'google-creds.json'),
    scopes
});

export interface ParameterData {
    key: string;
    value: string;
}

export let parameters: ParameterData[] = [];

export const getParameters = () => parameters;

export const syncSheets = () => {
    return new Promise((resolve) => {
        google.sheets('v4').spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            auth,
            includeGridData: true
        }).then((res) => {
            const parameterData = res.data.sheets![0]!.data![0].rowData;
            const newParameters: ParameterData[] = [];
            for (let i = 1; i < parameterData!.length; i++) {
                const row = parameterData![i].values!;
                const key = row[0].formattedValue!;
                if (!key) continue;
                const value = row[1].formattedValue!;
                newParameters.push({
                    key,
                    value
                });
            }
            const data = { newParameters };
            console.log(data);
            resolve(data);
        });
    });
};
