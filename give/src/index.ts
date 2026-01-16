import { ponder } from 'ponder:registry'
import { account, campaign, checkpoint, stake, vote, activity } from 'ponder:schema'

// Campaign Lifecycle Events

ponder.on('CampaignRegistry:CampaignSubmitted', async ({ event, context }) => {
  await context.db.insert(account).values({ id: event.args.proposer }).onConflictDoNothing()
  await context.db.insert(campaign).values({
    id: event.args.id,
    proposer: event.args.proposer,
    metadataHash: event.args.metadataHash,
    metadataCID: event.args.metadataCID,
    status: 0, // Submitted (assuming enum starts at 0)
    blockTimestamp: event.block.timestamp,
  })
})

ponder.on('CampaignRegistry:CampaignApproved', async ({ event, context }) => {
  await context.db.update(campaign, { id: event.args.id }).set({ status: 1 }) // Approved
})

ponder.on('CampaignRegistry:CampaignRejected', async ({ event, context }) => {
  await context.db.update(campaign, { id: event.args.id }).set({ status: 2 }) // Rejected
})

ponder.on('CampaignRegistry:CampaignStatusChanged', async ({ event, context }) => {
  await context.db.update(campaign, { id: event.args.id }).set({ status: event.args.newStatus })
})

ponder.on('CampaignRegistry:CampaignVaultRegistered', async ({ event, context }) => {
  await context.db.update(campaign, { id: event.args.campaignId }).set({ vault: event.args.vault })
})

// Checkpoint Events

ponder.on('CampaignRegistry:CheckpointScheduled', async ({ event, context }) => {
  const checkpointId = `${event.args.campaignId}-${event.args.index}`
  await context.db.insert(checkpoint).values({
    id: checkpointId,
    campaignId: event.args.campaignId,
    index: event.args.index,
    windowStart: event.args.start,
    windowEnd: event.args.end,
    quorumBps: event.args.quorumBps,
    status: 0, // Scheduled
    votesFor: 0n,
    votesAgainst: 0n,
  })
})

ponder.on('CampaignRegistry:CheckpointStatusUpdated', async ({ event, context }) => {
  const checkpointId = `${event.args.campaignId}-${event.args.index}`
  await context.db.update(checkpoint, { id: checkpointId }).set({ status: event.args.newStatus })
})

// Stake Events

ponder.on('CampaignRegistry:StakeDeposited', async ({ event, context }) => {
  const stakeId = `${event.args.id}-${event.args.supporter}`
  await context.db.insert(account).values({ id: event.args.supporter }).onConflictDoNothing()

  const existingStake = await context.db.find(stake, { id: stakeId })
  if (existingStake) {
    await context.db.update(stake, { id: stakeId }).set({
      amount: existingStake.amount + event.args.amount,
      totalDeposited: existingStake.totalDeposited + event.args.amount,
    })
  } else {
    await context.db.insert(stake).values({
      id: stakeId,
      campaignId: event.args.id,
      supporterId: event.args.supporter,
      amount: event.args.amount,
      totalDeposited: event.args.amount,
    })
  }

  await context.db.insert(activity).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    campaignId: event.args.id,
    supporterId: event.args.supporter,
    type: 'DEPOSIT',
    amount: event.args.amount,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  })
})

ponder.on('CampaignRegistry:StakeExitFinalized', async ({ event, context }) => {
  const stakeId = `${event.args.id}-${event.args.supporter}`
  const existingStake = await context.db.find(stake, { id: stakeId })
  if (existingStake) {
    await context.db.update(stake, { id: stakeId }).set({
      amount: existingStake.amount - event.args.amountWithdrawn,
    })
  }

  await context.db.insert(activity).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    campaignId: event.args.id,
    supporterId: event.args.supporter,
    type: 'WITHDRAW',
    amount: event.args.amountWithdrawn,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  })
})

// Vote Events

ponder.on('CampaignRegistry:CheckpointVoteCast', async ({ event, context }) => {
  const voteId = `${event.args.campaignId}-${event.args.index}-${event.args.supporter}`
  const checkpointId = `${event.args.campaignId}-${event.args.index}`

  await context.db.insert(account).values({ id: event.args.supporter }).onConflictDoNothing()

  await context.db.insert(vote).values({
    id: voteId,
    checkpointId: checkpointId,
    campaignId: event.args.campaignId,
    supporterId: event.args.supporter,
    support: event.args.support,
    weight: event.args.weight,
  })

  const existingCheckpoint = await context.db.find(checkpoint, { id: checkpointId })
  if (existingCheckpoint) {
    if (event.args.support) {
      await context.db.update(checkpoint, { id: checkpointId }).set({
        votesFor: existingCheckpoint.votesFor + event.args.weight,
      })
    } else {
      await context.db.update(checkpoint, { id: checkpointId }).set({
        votesAgainst: existingCheckpoint.votesAgainst + event.args.weight,
      })
    }
  }

  await context.db.insert(activity).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    campaignId: event.args.campaignId,
    supporterId: event.args.supporter,
    type: 'VOTE',
    support: event.args.support,
    checkpointIndex: event.args.index,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  })
})

// Global Vault Events
// Since global vaults don't have a campaignId per deposit, we index them by vault address
// to allow the frontend to fetch "stakers of this vault".

ponder.on('EthVault:Deposit', async ({ event, context }) => {
  const vaultAddress = context.contracts.EthVault.address
  const stakeId = `${vaultAddress}-${event.args.owner}`

  await context.db.insert(account).values({ id: event.args.owner }).onConflictDoNothing()

  const existingStake = await context.db.find(stake, { id: stakeId })
  if (existingStake) {
    await context.db.update(stake, { id: stakeId }).set({
      amount: existingStake.amount + event.args.assets,
      totalDeposited: existingStake.totalDeposited + event.args.assets,
    })
  } else {
    await context.db.insert(stake).values({
      id: stakeId,
      campaignId: vaultAddress, // Linking to vault address as the "campaign"
      supporterId: event.args.owner,
      amount: event.args.assets,
      totalDeposited: event.args.assets,
    })
  }

  await context.db.insert(activity).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    campaignId: vaultAddress,
    supporterId: event.args.owner,
    type: 'DEPOSIT',
    amount: event.args.assets,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  })
})

ponder.on('UsdcVault:Deposit', async ({ event, context }) => {
  const vaultAddress = context.contracts.UsdcVault.address
  const stakeId = `${vaultAddress}-${event.args.owner}`

  await context.db.insert(account).values({ id: event.args.owner }).onConflictDoNothing()

  const existingStake = await context.db.find(stake, { id: stakeId })
  if (existingStake) {
    await context.db.update(stake, { id: stakeId }).set({
      amount: existingStake.amount + event.args.assets,
      totalDeposited: existingStake.totalDeposited + event.args.assets,
    })
  } else {
    await context.db.insert(stake).values({
      id: stakeId,
      campaignId: vaultAddress,
      supporterId: event.args.owner,
      amount: event.args.assets,
      totalDeposited: event.args.assets,
    })
  }

  await context.db.insert(activity).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    campaignId: vaultAddress,
    supporterId: event.args.owner,
    type: 'DEPOSIT',
    amount: event.args.assets,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  })
})

ponder.on('EthVault:Withdraw', async ({ event, context }) => {
  const vaultAddress = context.contracts.EthVault.address
  const stakeId = `${vaultAddress}-${event.args.owner}`

  const existingStake = await context.db.find(stake, { id: stakeId })
  if (existingStake) {
    await context.db.update(stake, { id: stakeId }).set({
      amount: existingStake.amount - event.args.assets,
    })
  }

  await context.db.insert(activity).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    campaignId: vaultAddress,
    supporterId: event.args.owner,
    type: 'WITHDRAW',
    amount: event.args.assets,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  })
})

ponder.on('UsdcVault:Withdraw', async ({ event, context }) => {
  const vaultAddress = context.contracts.UsdcVault.address
  const stakeId = `${vaultAddress}-${event.args.owner}`

  const existingStake = await context.db.find(stake, { id: stakeId })
  if (existingStake) {
    await context.db.update(stake, { id: stakeId }).set({
      amount: existingStake.amount - event.args.assets,
    })
  }

  await context.db.insert(activity).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    campaignId: vaultAddress,
    supporterId: event.args.owner,
    type: 'WITHDRAW',
    amount: event.args.assets,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  })
})
