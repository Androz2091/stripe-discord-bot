# Discord Bot Template

Your bot has been delivered! Here is the repository with the source code. As a reminder, here are the features of the bot:

* Feature 1
* Feature 2
* Feature 3

## Installation

You can install and host this bot on your own server. Here are the main steps:

* Download and install [Node.js](https://nodejs.org) v16 or higher.
* Download and install [PostgreSQL](https://www.postgresql.org) v13 or higher.
* Create a new database and a new role that has access to the database.
* Install the dependencies of the project by running `yarn install`.
* Run `yarn build` to get the JavaScript output of the project.
* Install PM2 or another process manager to keep your bot alive, or run `yarn start`.
* You are done!

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

## Bugs or questions

If you have any issue or bug with this bot, you can contact me using Discord, `Androz#2091`.

## Detailed installation on Debian 11

### Getting started
```sh
sudo apt-get update
```

### Install tools
```sh
sudo apt-get install git gnupg2 wget curl software-properties-common build-essential ffmpeg -y
```

### Install PostgreSQL
```sh
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get -y install postgresql
```

### Configure PostgreSQL
```sh
sudo -u postgres psql
```
Commands to run on the PSQL shell:
```sh
CREATE DATABASE bot;
CREATE USER my_bot WITH PASSWORD 'heythere';
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO my_bot;
```

### Open PostgreSQL connections (optional)
```sh
nano /etc/postgresql/14/main/postgresql.conf # listen_adresses = '*'
nano /etc/postgresql/14/main/pg_hba.conf # host all all 0.0.0.0/0 scram-sha-256
```

### Install node
```
curl -sL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install nodejs -y
sudo npm i -g pm2 yarn typescript
```

### Create an account for the bot
```sh
adduser bot
su bot
```

### Add your GitHub SSH KEY
```sh
ssh-keygen -t ed25519 -C "androz2091@gmail.com" # this is an example, replace with your email
cat .ssh/id_ed25519.pub # add the result at https://github.com/settings/keys
```

## Clone the repository
```sh
git clone git@github.com:Name/Repo
```

## Finish the installation
```sh
cd repo
yarn
yarn build
pm2 start dist/index.js --name bot
```
