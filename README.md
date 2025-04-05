# Stripe Discord Bot

This Stripe Discord bot is useful to put a Discord server behind a paywall. It makes direct requests to Stripe, meaning there is no other fees (like when using Donatebot.io) to manage roles. Users have to provide their email using /email and they get instant access. There is a daily check to make sure their subscriptions are still active.

## [Sublyna](https://sublyna.com)

This Stripe Discord Bot will remain **free and open source**. However, hosting and configuring it can be challenging for beginners, and issues may arise if you're not familiar with the setup. Since I receive a lot of questions that I can't always answer individually, I recommend using [Sublyna](https://sublyna.com) — a new service packed with features that lets you turn your community into a paid one in just a few clicks, with low fees.

## Installation

You can install and host this bot on your own server. Here are the main steps:

* Download and install [Node.js](https://nodejs.org) v16 or higher.
* Download and install [PostgreSQL](https://www.postgresql.org) v13 or higher.
* Create a new database and a new role that has access to the database.
* Install the dependencies of the project by running `yarn install`.
* Run `yarn build` to get the JavaScript output of the project.
* Install PM2 or another process manager to keep your bot alive, or run `yarn start`.
* You are done!

## Bugs or questions

If you have any issue or bug with this bot, you can contact me using Discord, `Androz#2091` or `@androz2091`.

## Configuration 
All configuration for this template can be made in the `.env` file found in the root directory. Below will be details about each setting.  
  
`DISCORD_CLIENT_TOKEN:` Your Discord Bot's token which you can find [Here](https://discord.com/developers/applications).  
  
`DB_NAME:` The name of the [PostgreSQL](https://www.postgresql.org) database you created.  
`DB_USERNAME:` The username of the role with read and write access to the database.  
`DB_PASSWORD:` The password of the role.
  
`EMBED_COLOR:` The color which you would like your embed's side bar to be. (BLUE, #FF0000, Ect.)  
  
`COMMAND_PREFIX:` The prefix before the command name to execute that command.  
  
`GUILD_ID:` This is optional. In the case that your bot runs on a private server, it should be the ID of the server. Otherwise, leave empty (if this field is filled, it will be faster to create Slash Commands).
  
`ENVIRONMENT:` Can be `ENVIRONMENT` or `PRODUCTION`. Defines whether some scripts or things should be run or not. For example, the database schemas will not be modified in production, even to synchronize them, because we may loose data.

`STRIPE_API_KEY`: Your Stripe account API Key.

`EMAIL_COMMAND_CHANNEL_ID`: The ID of the channel in which members will enter their Stripe email.

`PAYING_ROLE_ID`/`LIFETIME_PAYING_ROLE_ID`: The ID of the role members will get of they pay.

`LIFETIME_INVOICE_LABEL_KEYWORD`: The keyword that will be used to detect a lifetime invoice (searching for this keyword in the label).

`STRIPE_PAYMENT_LINK`: The link for the users to buy a new subscription.

`LOGS_CHANNEL_ID`: The ID of the channel used as admin logs.

`SUBSCRIPTION_NAME`: The display name of the subscription you are selling. Ex: `Super Premium`
