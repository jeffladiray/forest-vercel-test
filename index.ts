import type { SslMode } from '@forestadmin/datasource-sql';

import 'dotenv/config';
import { createAgent } from '@forestadmin/agent';
import { createSqlDataSource, introspect } from '@forestadmin/datasource-sql';
import usersCustomization from './customizations/users';
import ticketsCustomization from './customizations/tickets';
import ordersCustomization from './customizations/orders';
import couponsCustomization from './customizations/coupons';
import pg from 'pg';
import type { Schema } from './typings';
import path from 'path';
import fs from 'fs';

import express from 'express';
const app = express();

async function buildServer() {
  const app = express();
  try {
    const dbCredentials = {
      uri: process.env.DATABASE_URL,
      schema: process.env.DATABASE_SCHEMA,
      sslMode: process.env.DATABASE_SSL_MODE as SslMode,
    };

    let introspection;
    try {
      // The introspection is JSON serializable. You can store it in a file.
      // Read it from the file if it exists.
      introspection = JSON.parse(fs.readFileSync(__dirname + '/my-database-introspection.json', 'utf-8'));
    } catch (e) {
      console.log('err', e);
    }
    
    const agent = createAgent<Schema>({
      authSecret: process.env.FOREST_AUTH_SECRET!,
      envSecret: process.env.FOREST_ENV_SECRET!,
    
      isProduction: process.env.NODE_ENV === 'production',
      schemaPath: __dirname + '/.forestadmin-schema.json',
      typingsPath: './typings.ts',
      typingsMaxDepth: 5,
    });
    
    agent
      .addDataSource(
        createSqlDataSource({
          ...dbCredentials,
          dialect: 'postgres',
          dialectModule: pg,
        }, { introspection }),
      )
      // .customizeCollection('users', usersCustomization)
      // .customizeCollection('tickets', ticketsCustomization)
      // .customizeCollection('orders', ordersCustomization)
      // .customizeCollection('coupons', couponsCustomization);
    
    agent.mountOnExpress(app);
    
    await agent.start();
    return app;
  } catch(err) {
    console.error(err);
  }
}

export default async function (req, res) {
  const server = await buildServer();
  return server(req, res);
}
