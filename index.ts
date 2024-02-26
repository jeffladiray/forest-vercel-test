import type { SslMode } from '@forestadmin/datasource-sql';

import 'dotenv/config';
import { createAgent } from '@forestadmin/agent';
import { createSqlDataSource } from '@forestadmin/datasource-sql';
import usersCustomization from './customizations/users';
import ticketsCustomization from './customizations/tickets';
import ordersCustomization from './customizations/orders';
import couponsCustomization from './customizations/coupons';
import pg from 'pg';
import type { Schema } from './typings';
import path from 'path';

export default async () => {
  try {
    console.log(__dirname);
    console.log(path.resolve(__dirname, './.forestadmin-schema.json'));
    
    const agent = createAgent<Schema>({
      authSecret: process.env.FOREST_AUTH_SECRET!,
      envSecret: process.env.FOREST_ENV_SECRET!,
    
      isProduction: process.env.NODE_ENV === 'production',
      
      typingsPath: './typings.ts',
      typingsMaxDepth: 5,
    });
    
    agent
      .addDataSource(
        createSqlDataSource({
          uri: process.env.DATABASE_URL,
          schema: process.env.DATABASE_SCHEMA,
          sslMode: process.env.DATABASE_SSL_MODE as SslMode,
          dialect: 'postgres',
          dialectModule: pg,
        }),
      )
      .customizeCollection('users', usersCustomization)
      .customizeCollection('tickets', ticketsCustomization)
      .customizeCollection('orders', ordersCustomization)
      .customizeCollection('coupons', couponsCustomization);
    
    agent.mountOnStandaloneServer(Number(process.env.APPLICATION_PORT));
    
    await agent.start();
  } catch(err) {
    console.error(err);
  }
}