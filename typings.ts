/* eslint-disable */
import {
  CollectionCustomizer,
  TAggregation,
  TConditionTree,
  TPaginatedFilter,
  TPartialRow,
  TSortClause
} from '@forestadmin/agent';

export type ForestMetadataCustomizer = CollectionCustomizer<Schema, 'forest_metadata'>;
export type ForestMetadataRecord = TPartialRow<Schema, 'forest_metadata'>;
export type ForestMetadataConditionTree = TConditionTree<Schema, 'forest_metadata'>;
export type ForestMetadataFilter = TPaginatedFilter<Schema, 'forest_metadata'>;
export type ForestMetadataSortClause = TSortClause<Schema, 'forest_metadata'>;
export type ForestMetadataAggregation = TAggregation<Schema, 'forest_metadata'>;

export type ForestPendingOperationsCustomizer = CollectionCustomizer<Schema, 'forest_pending_operations'>;
export type ForestPendingOperationsRecord = TPartialRow<Schema, 'forest_pending_operations'>;
export type ForestPendingOperationsConditionTree = TConditionTree<Schema, 'forest_pending_operations'>;
export type ForestPendingOperationsFilter = TPaginatedFilter<Schema, 'forest_pending_operations'>;
export type ForestPendingOperationsSortClause = TSortClause<Schema, 'forest_pending_operations'>;
export type ForestPendingOperationsAggregation = TAggregation<Schema, 'forest_pending_operations'>;

export type ForestPostsCustomizer = CollectionCustomizer<Schema, 'forest_posts'>;
export type ForestPostsRecord = TPartialRow<Schema, 'forest_posts'>;
export type ForestPostsConditionTree = TConditionTree<Schema, 'forest_posts'>;
export type ForestPostsFilter = TPaginatedFilter<Schema, 'forest_posts'>;
export type ForestPostsSortClause = TSortClause<Schema, 'forest_posts'>;
export type ForestPostsAggregation = TAggregation<Schema, 'forest_posts'>;

export type ForestUsersCustomizer = CollectionCustomizer<Schema, 'forest_users'>;
export type ForestUsersRecord = TPartialRow<Schema, 'forest_users'>;
export type ForestUsersConditionTree = TConditionTree<Schema, 'forest_users'>;
export type ForestUsersFilter = TPaginatedFilter<Schema, 'forest_users'>;
export type ForestUsersSortClause = TSortClause<Schema, 'forest_users'>;
export type ForestUsersAggregation = TAggregation<Schema, 'forest_users'>;


export type Schema = {
  'forest_metadata': {
    plain: {
      'content': any;
      'createdAt': string;
      'id': string;
      'updatedAt': string;
    };
    nested: {};
    flat: {};
  };
  'forest_pending_operations': {
    plain: {
      'content': any;
      'createdAt': string;
      'id': number;
      'type': 'delta' | 'dump';
      'updatedAt': string;
    };
    nested: {};
    flat: {};
  };
  'forest_posts': {
    plain: {
      'email': string;
      'title': string;
      'userId': number;
      'uuid': number;
    };
    nested: {
      'user': Schema['forest_users']['plain'] & Schema['forest_users']['nested'];
    };
    flat: {
      'user:email': string;
      'user:id': number;
      'user:jsonColumn': any;
    };
  };
  'forest_users': {
    plain: {
      'email': string;
      'id': number;
      'jsonColumn': any;
    };
    nested: {};
    flat: {};
  };
};
