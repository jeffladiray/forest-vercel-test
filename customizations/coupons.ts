import { CollectionCustomizer } from '@forestadmin/agent';
import { Schema } from '../typings';

// This is a CollectionCustomize handler.
// Typing "coupons." in your IDE should allow you to use any customization you'd like
// Here, we will create a new field
export default (coupons: CollectionCustomizer<Schema, 'coupons'>) => {
  coupons
    // Create a new field called "used_in_x_orders"
    // This field will count the total number of orders that uses a specific coupon code.
    .addField('used_in_x_orders', {
      // The field will be a number, as it's a counter
      columnType: 'Number',
      // The field only depends on the coupon(s) id(s) to be computed, so
      // "used_in_x_orders" depends on "id"
      dependencies: ['id'],
      // Then we express how to compute the field
      // "records" gives you the list of record's dependency, so in this case, an array of { id: xx }
      getValues: async (records, context) => {
        if (records.length === 0) return [];
        
        // Here, we are using the native driver (postgres) to run a raw SQL query that will count the total number of order for each coupon displayed
        const rows = await context.collection.nativeDriver.rawQuery(
          'SELECT coupon_id, COUNT(*) AS count FROM orders WHERE coupon_id IN (:ids) GROUP BY coupon_id',
          { ids: records.map(r => r.id) },
        );
        // field values should be returned with the same order as "records", so we are re-ordering them ⚠️
        return records.map(record => Number(rows.find(r => r.coupon_id === record.id)?.count) || 0);
      },
    });
};
