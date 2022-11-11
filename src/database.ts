import { Entity, Column, DataSource, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { Database, Resource } from '@adminjs/typeorm';
import { validate } from 'class-validator';

import AdminJS from 'adminjs';
import AdminJSFastify from '@adminjs/fastify';
import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { join } from "path";

Resource.validate = validate;
AdminJS.registerAdapter({ Database, Resource });

@Entity()
export class DiscordCustomer extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        length: 32
    })
    discordUserId!: string;

    @Column({
        nullable: true // can be null when only admin access is true
    })
    email!: string;

    @Column({
        default: false
    })
    hadActiveSubscription!: boolean; // whether the member had an active subscription during last daily check

    @Column({
        nullable: true
    })
    firstReminderSentDayCount!: number; // 0 = first day, 1 = second day, 2 = third day, null = no reminder sent

    @Column({
        default: false
    })
    adminAccessEnabled!: boolean;

}

const entities = [DiscordCustomer];

export const Postgres = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    entities,
    synchronize: process.env.ENVIRONMENT === 'development',
});

export const initialize = () => Postgres.initialize().then(async () => {
    if (process.env.ADMINJS_PORT) {
        const app = fastify();
        const admin = new AdminJS({
            branding: {
                companyName: 'Discord Bot'
            },
            resources: entities
        });
        app.register(fastifyStatic, {
            root: join(__dirname, '../public'),
            prefix: '/public/',
        });
        await AdminJSFastify.buildAuthenticatedRouter(admin, {
            cookiePassword: process.env.ADMINJS_COOKIE_HASH!,
            cookieName: 'adminjs',
            authenticate: async (_email, password) => {
                if (_email) return false;
                if (password === process.env.ADMINJS_PASSWORD!) {
                    return true;
                }
            }
        }, app);
        app.listen({
            port: process.env.ADMINJS_PORT
        }, () => {
            console.log(`AdminJS is listening at http://localhost:${process.env.ADMINJS_PORT}`)
        });
    }

});
