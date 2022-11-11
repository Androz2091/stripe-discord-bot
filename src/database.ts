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
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        length: 32
    })
    userId!: string;
    
    @Column()
    money!: number;

}

const entities = [User];

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
