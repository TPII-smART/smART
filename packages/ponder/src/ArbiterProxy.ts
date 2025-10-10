import { ponder } from "ponder:registry";
import { hiredTalent, gig, notification } from "ponder:schema";

// Talent dispute created
ponder.on("ArbiterProxy:TalentDisputeCreated", async ({ event, context }) => {
  const { localDisputeId, talentId, hiredTalentId, freelancer, client, feeDepositDeadline } = event.args;

  await context.db.update(hiredTalent, { hiredTalentId, talentId }).set({
    disputeId: localDisputeId,
    freelancerPaidArbitrationFee: false,
    clientPaidArbitrationFee: false,
    disputeDeadline: BigInt(feeDepositDeadline ?? 0),
    currentRound: 0,
    currentRuling: 0,
    lastTransactionHash: event.transaction.hash,
  });

  // notifications for both parties
  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-talentdispute-freelancer`,
    user: freelancer as string,
    title: "Talent dispute initiated",
    message: `A dispute (#${localDisputeId}) was created for hiredTalent ${hiredTalentId}.`,
    itemId: localDisputeId,
    href: `/talents/${talentId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-talentdispute-client`,
    user: client as string,
    title: "Talent dispute initiated",
    message: `A dispute (#${localDisputeId}) was created for hiredTalent ${hiredTalentId}.`,
    itemId: localDisputeId,
    href: `/talents/${talentId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Freelancer paid talent arbitration fee
ponder.on("ArbiterProxy:FreelancerPayedTalentArbitrationFee", async ({ event, context }) => {
  const { localDisputeId, talentId, hiredTalentId, freelancer: freelancerAddr, amountPaid, totalAmountPaid } = event.args;

  await context.db.update(hiredTalent, { hiredTalentId, talentId }).set({
    freelancerPaidArbitrationFee: true,
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-talent-freelancer-paid`,
    user: freelancerAddr as string,
    title: "You paid arbitration fee",
    message: `You paid ${amountPaid} towards dispute #${localDisputeId}.`,
    itemId: localDisputeId,
    href: `/talents/${talentId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Client paid talent arbitration fee
ponder.on("ArbiterProxy:ClientPayedTalentArbitrationFee", async ({ event, context }) => {
  const { localDisputeId, talentId, hiredTalentId, client: clientAddr, amountPaid, totalAmountPaid } = event.args;

  await context.db.update(hiredTalent, { hiredTalentId, talentId }).set({
    clientPaidArbitrationFee: true,
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-talent-client-paid`,
    user: clientAddr as string,
    title: "You paid arbitration fee",
    message: `You paid ${amountPaid} towards dispute #${localDisputeId}.`,
    itemId: localDisputeId,
    href: `/talents/${talentId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Talent dispute raised on Kleros / arbitrator
ponder.on("ArbiterProxy:TalentDisputeRaised", async ({ event, context }) => {
  const { localDisputeId, klerosDisputeId, talentId, hiredTalentId } = event.args;

  await context.db.update(hiredTalent, { hiredTalentId, talentId }).set({
    klerosDisputeId: BigInt(klerosDisputeId ?? 0),
    lastTransactionHash: event.transaction.hash,
  });
});

// Gig dispute created
ponder.on("ArbiterProxy:GigDisputeCreated", async ({ event, context }) => {
  const { localDisputeId, gigId, freelancer, client, feeDepositDeadline } = event.args;

  await context.db.update(gig, { gigId }).set({
    disputeId: localDisputeId,
    freelancerPaidArbitrationFee: false,
    clientPaidArbitrationFee: false,
    disputeDeadline: BigInt(feeDepositDeadline ?? 0),
    currentRound: 0,
    currentRuling: 0,
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-gigdispute-freelancer`,
    user: freelancer as string,
    title: "Gig dispute initiated",
    message: `A dispute (#${localDisputeId}) was created for gig ${gigId}.`,
    itemId: localDisputeId,
    href: `/gig/${gigId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-gigdispute-client`,
    user: client as string,
    title: "Gig dispute initiated",
    message: `A dispute (#${localDisputeId}) was created for gig ${gigId}.`,
    itemId: localDisputeId,
    href: `/gig/${gigId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Freelancer paid gig arbitration fee
ponder.on("ArbiterProxy:FreelancerPayedGigArbitrationFee", async ({ event, context }) => {
  const { localDisputeId, gigId, freelancer: freelancerAddr, amountPaid, totalAmountPaid } = event.args;

  await context.db.update(gig, { gigId }).set({
    freelancerPaidArbitrationFee: true,
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-gig-freelancer-paid`,
    user: freelancerAddr as string,
    title: "You paid arbitration fee",
    message: `You paid ${amountPaid} towards dispute #${localDisputeId}.`,
    itemId: localDisputeId,
    href: `/gig/${gigId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Client paid gig arbitration fee
ponder.on("ArbiterProxy:ClientPayedGigArbitrationFee", async ({ event, context }) => {
  const { localDisputeId, gigId, client: clientAddr, amountPaid, totalAmountPaid } = event.args;

  await context.db.update(gig, { gigId }).set({
    clientPaidArbitrationFee: true,
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-gig-client-paid`,
    user: clientAddr as string,
    title: "You paid arbitration fee",
    message: `You paid ${amountPaid} towards dispute #${localDisputeId}.`,
    itemId: localDisputeId,
    href: `/gig/${gigId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Gig dispute raised
ponder.on("ArbiterProxy:GigDisputeRaised", async ({ event, context }) => {
  const { localDisputeId, klerosDisputeId, gigId } = event.args;

  await context.db.update(gig, { gigId }).set({
    klerosDisputeId: BigInt(klerosDisputeId ?? 0),
    lastTransactionHash: event.transaction.hash,
  });
});

// Gig timeout by inaction
ponder.on("ArbiterProxy:GigDisputeTimeoutByInaction", async ({ event, context }) => {
  const { localDisputeId, gigId, ruling, winner } = event.args;

  await context.db.update(gig, { gigId }).set({
    currentRuling: ruling ?? 0,
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-gig-timeout`,
    user: winner as string,
    title: "Dispute timeout resolved",
    message: `Dispute #${localDisputeId} for gig ${gigId} resolved by timeout.`,
    itemId: localDisputeId,
    href: `/gig/${gigId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Talent timeout by inaction
ponder.on("ArbiterProxy:TalentDisputeTimeoutByInaction", async ({ event, context }) => {
  const { localDisputeId, talentId, hiredTalentId, ruling, winner } = event.args;

  await context.db.update(hiredTalent, { hiredTalentId, talentId }).set({
    currentRuling: ruling ?? 0,
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-talent-timeout`,
    user: winner as string,
    title: "Dispute timeout resolved",
    message: `Dispute #${localDisputeId} for hiredTalent ${hiredTalentId} resolved by timeout.`,
    itemId: localDisputeId,
    href: `/talents/${talentId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Gig appeal contribution
ponder.on("ArbiterProxy:GigAppealContribution", async ({ event, context }) => {
  const { localDisputeId, round, gigId, side, contributor, amount, totalPaid, requiredAmount } = event.args;

  const update: any = {
    currentRound: round ?? 0,
    appealCost: BigInt(requiredAmount ?? 0),
    lastTransactionHash: event.transaction.hash,
  };

  if (side === 0) update.freelancerFunds = BigInt(totalPaid ?? 0);
  else update.clientFunds = BigInt(totalPaid ?? 0);

  await context.db.update(gig, { gigId }).set(update);

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-gig-appeal-contrib`,
    user: contributor as string,
    title: "Appeal contribution received",
    message: `You contributed ${amount} to appeal (dispute #${localDisputeId}).`,
    itemId: localDisputeId,
    href: `/gig/${gigId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Talent appeal contribution
ponder.on("ArbiterProxy:TalentAppealContribution", async ({ event, context }) => {
  const { localDisputeId, round, talentId, hiredTalentId, side, contributor, amount, totalPaid, requiredAmount } = event.args;

  const update: any = {
    currentRound: round ?? 0,
    appealCost: BigInt(requiredAmount ?? 0),
    lastTransactionHash: event.transaction.hash,
  };

  if (side === 0) update.freelancerFunds = BigInt(totalPaid ?? 0);
  else update.clientFunds = BigInt(totalPaid ?? 0);

  await context.db.update(hiredTalent, { hiredTalentId, talentId }).set(update);

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-talent-appeal-contrib`,
    user: contributor as string,
    title: "Appeal contribution received",
    message: `You contributed ${amount} to appeal (dispute #${localDisputeId}).`,
    itemId: localDisputeId,
    href: `/talents/${talentId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Gig appeal created
ponder.on("ArbiterProxy:GigAppealCreated", async ({ event, context }) => {
  const { localDisputeId, klerosDisputeId, round, gigId } = event.args;

  await context.db.update(gig, { gigId }).set({
    currentRound: round ?? 0,
    klerosDisputeId: BigInt(klerosDisputeId ?? 0),
    lastTransactionHash: event.transaction.hash,
  });
});

// Talent appeal created
ponder.on("ArbiterProxy:TalentAppealCreated", async ({ event, context }) => {
  const { localDisputeId, klerosDisputeId, round, talentId, hiredTalentId } = event.args;

  await context.db.update(hiredTalent, { hiredTalentId, talentId }).set({
    currentRound: round ?? 0,
    klerosDisputeId: BigInt(klerosDisputeId ?? 0),
    lastTransactionHash: event.transaction.hash,
  });
});

// Gig fees & rewards withdrawn
ponder.on("ArbiterProxy:GigFeesAndRewardsWithdrawn", async ({ event, context }) => {
  const { localDisputeId, round, gigId, beneficiary, reward } = event.args;

  // update lastTransactionHash only; reward distribution logic is handled off-chain
  await context.db.update(gig, { gigId }).set({
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-gig-fees-withdrawn`,
    user: beneficiary as string,
    title: "Fees and rewards withdrawn",
    message: `You withdrew rewards for dispute #${localDisputeId}.`,
    itemId: localDisputeId,
    href: `/gig/${gigId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Talent fees & rewards withdrawn
ponder.on("ArbiterProxy:TalentFeesAndRewardsWithdrawn", async ({ event, context }) => {
  const { localDisputeId, round, talentId, hiredTalentId, beneficiary, reward } = event.args;

  await context.db.update(hiredTalent, { hiredTalentId, talentId }).set({
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-talent-fees-withdrawn`,
    user: beneficiary as string,
    title: "Fees and rewards withdrawn",
    message: `You withdrew rewards for dispute #${localDisputeId}.`,
    itemId: localDisputeId,
    href: `/talents/${talentId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Talent round ruling
ponder.on("ArbiterProxy:TalentRoundRuling", async ({ event, context }) => {
  const { localDisputeId, round, talentId, hiredTalentId, ruling } = event.args;

  await context.db.update(hiredTalent, { hiredTalentId, talentId }).set({
    currentRound: round ?? 0,
    currentRuling: ruling ?? 0,
    lastTransactionHash: event.transaction.hash,
  });
});

// Gig round ruling
ponder.on("ArbiterProxy:GigRoundRuling", async ({ event, context }) => {
  const { localDisputeId, round, gigId, ruling } = event.args;

  await context.db.update(gig, { gigId }).set({
    currentRound: round ?? 0,
    currentRuling: ruling ?? 0,
    lastTransactionHash: event.transaction.hash,
  });
});

// Talent round timeout by inaction
ponder.on("ArbiterProxy:TalentRoundTimeoutByInaction", async ({ event, context }) => {
  const { localDisputeId, round, talentId, hiredTalentId, ruling, winner } = event.args;

  await context.db.update(hiredTalent, { hiredTalentId, talentId }).set({
    currentRound: round ?? 0,
    currentRuling: ruling ?? 0,
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-talent-round-timeout`,
    user: winner as string,
    title: "Appeal round timeout resolved",
    message: `Appeal round ${round} for dispute #${localDisputeId} resolved by timeout.`,
    itemId: localDisputeId,
    href: `/talents/${talentId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Gig round timeout by inaction
ponder.on("ArbiterProxy:GigRoundTimeoutByInaction", async ({ event, context }) => {
  const { localDisputeId, round, gigId, ruling, winner } = event.args;

  await context.db.update(gig, { gigId }).set({
    currentRound: round ?? 0,
    currentRuling: ruling ?? 0,
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-gig-round-timeout`,
    user: winner as string,
    title: "Appeal round timeout resolved",
    message: `Appeal round ${round} for dispute #${localDisputeId} resolved by timeout.`,
    itemId: localDisputeId,
    href: `/gig/${gigId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

// Talent / Gig externally funded events (mark presence)
ponder.on("ArbiterProxy:TalentAppealExternallyFunded", async ({ event, context }) => {
  const { localDisputeId, round, talentId, hiredTalentId } = event.args;
  await context.db.update(hiredTalent, { hiredTalentId, talentId }).set({
    currentRound: round ?? 0,
    lastTransactionHash: event.transaction.hash,
  });
});

ponder.on("ArbiterProxy:GigAppealExternallyFunded", async ({ event, context }) => {
  const { localDisputeId, round, gigId } = event.args;
  await context.db.update(gig, { gigId }).set({
    currentRound: round ?? 0,
    lastTransactionHash: event.transaction.hash,
  });
});