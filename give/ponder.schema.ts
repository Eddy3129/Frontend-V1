import { onchainTable } from 'ponder'

export const account = onchainTable('account', (t) => ({
  id: t.hex().primaryKey(),
}))

export const campaign = onchainTable('campaign', (t) => ({
  id: t.hex().primaryKey(),
  proposer: t.hex().notNull(),
  metadataHash: t.hex().notNull(),
  metadataCID: t.text().notNull(),
  status: t.integer().notNull(),
  vault: t.hex(),
  blockTimestamp: t.bigint().notNull(),
}))

export const checkpoint = onchainTable('checkpoint', (t) => ({
  id: t.text().primaryKey(),
  campaignId: t.hex().notNull(),
  index: t.bigint().notNull(),
  windowStart: t.bigint().notNull(),
  windowEnd: t.bigint().notNull(),
  quorumBps: t.integer().notNull(),
  status: t.integer().notNull(),
  votesFor: t.bigint().notNull().default(0n),
  votesAgainst: t.bigint().notNull().default(0n),
}))

export const stake = onchainTable('stake', (t) => ({
  id: t.text().primaryKey(),
  campaignId: t.hex().notNull(),
  supporterId: t.hex().notNull(),
  amount: t.bigint().notNull(),
  totalDeposited: t.bigint().notNull(),
}))

export const vote = onchainTable('vote', (t) => ({
  id: t.text().primaryKey(),
  checkpointId: t.text().notNull(),
  campaignId: t.hex().notNull(),
  supporterId: t.hex().notNull(),
  support: t.boolean().notNull(),
  weight: t.bigint().notNull(),
}))

export const activity = onchainTable('activity', (t) => ({
  id: t.text().primaryKey(),
  campaignId: t.hex().notNull(),
  supporterId: t.hex().notNull(),
  type: t.text().notNull(), // DEPOSIT, WITHDRAW, VOTE
  amount: t.bigint(),
  support: t.boolean(),
  checkpointIndex: t.bigint(),
  blockTimestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}))
