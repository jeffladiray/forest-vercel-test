import { CollectionCustomizer } from '@forestadmin/agent';
import { Schema } from '../typings';

// Customize the "orders" collection
export default (orders: CollectionCustomizer<Schema, 'orders'>) => {
  orders
    // Add a new action name "Apply a coupon"
    .addAction('Apply a coupon', {
      // We're using scope: "Single" here to allow this action
      // to be triggerable only on a single "Order"
      scope: 'Single',
      // We declare a form, to allow the user to select a coupon to apply
      form: [
        {
          // In this form, we will have a single field "Coupon"
          label: 'Coupon',
          // And we want to search in the existing "coupons" table
          type: 'Collection',
          collectionName: 'coupons',
        },
      ],
      // The actual code that will be triggered when the action is ran
      execute: async (context, resultBuilder) => {
        try {
          // Retrieve the selected coupon
          const [couponId] = context.formValues.Coupon;
          // Update the order to add the couponId
          await context.collection.update(
            {
              conditionTree: { field: 'id', operator: 'Equal', value: await context.getRecordId() },
            },
            { coupon_id: couponId },
          );
          // Send back a nice success message, and force refetch the record to retrieve the coupon
          return resultBuilder.success('Successfully applied coupon', { invalidated: ['coupon'] });
        } catch (error) {
          // If any error happened, display an error toastr
          return resultBuilder.error(`Failed to apply coupon: ${error.message}.`);
        }
      },
    })
    // Then, we want to display the "real" amount of the order, taking discount into account
    // So, let's create a new field
    .addField('amount_with_discount', {
      // The amount is a number so ...
      columnType: 'Number',
      // The real amount depends on the initial amount, and discount percent & amount
      dependencies: ['coupon:discount_percent', 'coupon:discount_amount', 'initial_amount'],
      // The code related to computing the "real" amount
      getValues: records =>
        // For each record, apply the formulae
        // amountWithDiscount = initAmount - (initAmount * (discountPercent / 100)) - discountAmount;
        records.map(record => {
          // Since records depends on "coupon:", we can retrieve all values
          // And compute the real amount synchronously
          const discountPercent = Number(record.coupon?.discount_percent || 0);
          const discountAmount = Number(record.coupon?.discount_amount || 0);
          const initialAmount = record.initial_amount;
          const amountWithDiscount =
            initialAmount - initialAmount * (discountPercent / 100) - discountAmount;

          return Math.floor((amountWithDiscount > 0 ? amountWithDiscount : 0) * 100) / 100;
        }),
    });
};
