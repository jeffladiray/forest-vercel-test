import { CollectionCustomizer } from '@forestadmin/agent';
import { Schema } from '../typings';

// Customize the ticket collection
export default (tickets: CollectionCustomizer<Schema, 'tickets'>) => {
  tickets
    // create a new mark tickets as resolved action
    .addAction('Mark ticket(s) as resolved', {
      // This one while be "Bulk" so we can batch mark as resolved
      scope: 'Bulk',
      execute: async (context, resultBuilder) => {
        try {
          // First, get the list of records to modify.
          // They array allow to select only the fields needed on the final object
          const records = await context.getRecords(['id', 'subject', 'is_resolved']);

          // Here, we're getting the resolved & unresolved topic to display
          // an HTML view when a record selected to be "Mark as resolved" was already resolved
          const unresolvedRecordIds = records
            .filter(record => !record.is_resolved)
            .map(record => record.id);
          const resolvedRecordsSubject = records
            .filter(record => record.is_resolved)
            .map(record => record.subject);

          // Then, we actually update the selected records by id, setting is_resolved to true
          await context.collection.update(
            { conditionTree: { field: 'id', operator: 'In', value: unresolvedRecordIds } },
            { is_resolved: true },
          );

          // And we return a success toastr, embedding HTML with the tickets that were un-affected
          return resultBuilder.success('Ticket(s) marked as resolved!', {
            html: resolvedRecordsSubject
              .map(record => `<p>Ticket "${record}" is already resolved.</p>`)
              .join(''),
          });
        } catch (error) {
          return resultBuilder.error(`Failed to mark ticket(s) as resolved ${error.message}.`);
        }
      },
    })
    // Pretty much the same, but setting is_resolved to false
    .addAction('Re-open ticket(s)', {
      scope: 'Bulk',
      execute: async (context, resultBuilder) => {
        try {
          const records = await context.getRecords(['id', 'subject', 'is_resolved']);

          const resolvedRecordIds = records
            .filter(record => record.is_resolved)
            .map(record => record.id);
          const notResolvedRecordsSubject = records
            .filter(record => !record.is_resolved)
            .map(record => record.subject);

          await context.collection.update(
            { conditionTree: { field: 'id', operator: 'In', value: resolvedRecordIds } },
            { is_resolved: false },
          );
          return resultBuilder.success('Ticket(s) reopened!', {
            html: notResolvedRecordsSubject
              .map(record => `<p>Ticket "${record}" is already not resolved.</p>`)
              .join(''),
          });
        } catch (error) {
          return resultBuilder.error(`Failed to mark ticket(s) as resolved ${error.message}.`);
        }
      },
    });
};
