import { CollectionCustomizer } from '@forestadmin/agent';
import { randomBytes } from 'crypto';

import { Schema } from '../typings';

export default (users: CollectionCustomizer<Schema, 'users'>) => {
  // Create a new fullname field
  users
    .addField('fullname', {
      // As this will be a concatenation of firstname and lastname, type is String
      columnType: 'String',
      // fullname will depend on firstname & lastname
      dependencies: ['firstname', 'lastname'],
      // Then, simply compute the value for each record
      getValues: records => records.map(record => `${record.firstname} ${record.lastname}`),
    })
    // We want to use the "contains" filter on the frontend, so we'll have to implement it
    .replaceFieldOperator('fullname', 'Contains', value => ({
      // "Contains" on fullname is equivalent to "Or Contains" on firstname & lastname
      aggregator: 'Or',
      conditions: [
        {
          field: 'firstname',
          operator: 'Contains',
          value,
        },
        {
          field: 'lastname',
          operator: 'Contains',
          value,
        },
      ],
    }))
    // We define a way to handle "writing" the fullname virtual field.
    // So here, we're splitting the input to firstname and lastname
    .replaceFieldWriting('fullname', value => {
      const [firstname, lastname] = value.split(' ');
      return {
        firstname,
        lastname,
      };
    })
    // We also want to sort on fullname, so here is the equivalent sort
    .replaceFieldSorting('fullname', [
      { field: 'firstname', ascending: true },
      { field: 'lastname', ascending: true },
    ])
    // Add an action that anonymize a specific set of user
    // Changes their name, email, picture, cellphone, password,
    // set them as blocked and also unlink their address
    .addAction('Anonymize user', {
      scope: 'Bulk',
      execute: async (context, resultBuilder) => {
        try {
          const records = await context.getRecords(['id']);
          const userIds = records.map(record => record.id);
          await context.collection.update(
            {
              conditionTree: {
                field: 'id',
                operator: 'In',
                value: userIds,
              },
            },
            {
              firstname: 'Anonymous',
              lastname: 'Anonymous',
              email: 'anonymous@anonymous.anonymous',
              identity_picture: null,
              cellphone: 'Unknown',
              password: '',
              is_blocked: true,
              signup_date: null,
            },
          );

          await context.dataSource.getCollection('addresses').update(
            {
              conditionTree: {
                field: 'user_id',
                operator: 'In',
                value: userIds,
              },
            },
            {
              user_id: null,
              country: 'Unknown',
              city: 'Unknown',
              street: 'Unknown',
              number: '0',
            },
          );

          return resultBuilder.success('User(s) anonymized!');
        } catch (error) {
          return resultBuilder.error(`Failed to anonymize user(s) ${error.message}.`);
        }
      },
    })
    // Change a user's plan by updating it's subscription
    .addAction('Change a plan', {
      scope: 'Single',
      form: [
        {
          label: 'plan',
          collectionName: 'plans',
          type: 'Collection',
          isRequired: true,
          defaultValue: async context => [
            (await context.getRecord(['subscription:plan_id'])).subscription?.plan_id,
          ],
        },
      ],
      execute: async (context, resultBuilder) => {
        const [newPlanId] = context.formValues.plan;
        const record = await context.getRecord(['subscription:id']);
        const { subscription } = record;

        if (!subscription.id)
          return resultBuilder.error(
            'You can not change the plan, the user does not have subscriptions yet.',
          );

        try {
          await context.dataSource.getCollection('subscriptions').update(
            {
              conditionTree: {
                field: 'id',
                operator: 'Equal',
                value: subscription.id,
              },
            },
            { plan_id: newPlanId },
          );

          return resultBuilder.success('Plan successfully updated.');
        } catch (error) {
          return resultBuilder.error(`Failed to change plan ${error.message}.`);
        }
      },
    })
    // Fake simulate a password reset sending action
    .addAction('Reset password', {
      scope: 'Single',
      execute: async (context, resultBuilder) => {
        const userId = await context.getRecordId();

        try {
          await context.dataSource.getCollection('users').update(
            {
              conditionTree: {
                field: 'id',
                operator: 'Equal',
                value: userId,
              },
            },
            { password: randomBytes(16).toString('hex') },
          );
          // We do not encourage sending raw password as email, this is just for the example :)
          return resultBuilder.success(
            'Password successfully updated, a mail has sended to the user with his new password.',
          );
        } catch (error) {
          return resultBuilder.error(`Failed to reset password ${error.message}.`);
        }
      },
    })
    // Moderate a user
    .addAction('Moderate', {
      scope: 'Single',
      form: [
        {
          label: 'User Name',
          type: 'String',
          isReadOnly: true,
          description: 'You will block the following user',
          defaultValue: async context => (await context.getRecord(['fullname'])).fullname,
        },
        {
          label: 'reason',
          type: 'Enum',
          enumValues: ['resignation', 'dismissal', 'long-term illness', 'other'],
          isRequired: true,
        },
        {
          label: 'explanation',
          type: 'String',
          description: 'Fill in the reason',
          if: context => context.formValues.reason === 'other',
        },
      ],
      execute: async (context, resultBuilder) => {
        const user = await context.getRecord(['id', 'is_blocked']);

        if (user.is_blocked) return resultBuilder.success('User already blocked.');

        try {
          await context.dataSource.getCollection('users').update(
            {
              conditionTree: {
                field: 'id',
                operator: 'Equal',
                value: user.id,
              },
            },
            { is_blocked: true },
          );

          return resultBuilder.success('User successfully blocked.');
        } catch (error) {
          return resultBuilder.error(`Failed block user ${error.message}.`);
        }
      },
    })
    // Impersonate a user
    .addAction('Impersonate this user', {
      // We can only impersonate one user at a time, so it'll be a Single action
      scope: 'Single',
      execute: async (context, resultBuilder) => {
        // Retrieve the user id
        const userId = await context.getRecordId();
        return resultBuilder.webhook(
          'https://my-app-url/login', // The url of the company providing the service.
          'POST', // The method you would like to use (typically a POST).
          {}, // You can add some headers if needed (you can remove it)
          {
            adminToken: 'your-admin-token', // A body to send to the url (only JSON supported).
            userId,
          },
        );
      },
    });
};
