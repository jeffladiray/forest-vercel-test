import type { SslMode } from '@forestadmin/datasource-sql';

import 'dotenv/config';
import { createAgent } from '@forestadmin/agent';
import { createSqlDataSource } from '@forestadmin/datasource-sql';
import usersCustomization from './customizations/users';
import ticketsCustomization from './customizations/tickets';
import ordersCustomization from './customizations/orders';
import couponsCustomization from './customizations/coupons';

import type { Schema } from './typings';

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
    }),
  )
  .customizeCollection('users', usersCustomization)
  .customizeCollection('tickets', ticketsCustomization)
  .customizeCollection('orders', ordersCustomization)
  .customizeCollection('coupons', couponsCustomization);

agent.mountOnStandaloneServer(Number(process.env.APPLICATION_PORT));

agent.start().catch(error => {
  // eslint-disable-next-line no-console
  console.error('\x1b[31merror:\x1b[0m Forest Admin agent failed to start\n', error.stack);
  process.exit(1);
});
