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
export default (async () => {
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
      introspection = JSON.parse(fs.readFileSync('./my-database-introspection.json', 'utf-8'));
    } catch (e) {
      if (e.code === 'ENOENT') {
        // The file does not exist, we need to introspect the database.
        introspection = await introspect(dbCredentials);
        fs.writeFileSync(
          './my-database-introspection.json',
          JSON.stringify(introspection),
        );
      } else {
        console.log(e);
      }
    }
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
          ...dbCredentials,
          dialect: 'postgres',
          dialectModule: pg,
        }, { introspection }),
      )
      .customizeCollection('users', usersCustomization)
      .customizeCollection('tickets', ticketsCustomization)
      .customizeCollection('orders', ordersCustomization)
      .customizeCollection('coupons', couponsCustomization);
    
    agent.mountOnStandaloneServer(3310);
    
    await agent.start();
    return async (): Promise<void> => {
      await agent?.stop();
    };
  } catch(err) {
    console.error(err);
  }
});