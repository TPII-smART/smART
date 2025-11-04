import { ponder } from "ponder:registry";
import { hiredTalent, gig, notification, dispute, klerosDispute, disputeContributor } from "ponder:schema";

// Talent dispute created
ponder.on("ArbiterProxy:TalentDisputeCreated", async ({ event, context }) => {
  const { localDisputeId, talentId, hiredTalentId, freelancer, client, feeDepositDeadline, reason } = event.args;

  const hireTalent = await context.db.find(hiredTalent, { hiredTalentId, talentId });
  if (!hireTalent) {
    console.error(`HiredTalent not found for talentId: ${talentId}, hiredTalentId: ${hiredTalentId}`);
    return;
  }

  await context.db.update(hiredTalent, { hiredTalentId, talentId }).set({
    state: 4, // Disputed state
    lastTransactionHash: event.transaction.hash,
    disputeId: localDisputeId,
  });

  const disputePk = { disputeId: BigInt(localDisputeId) };
  const existingDispute = await context.db.find(dispute, disputePk);

  const disputeData = {
    type: "hiredTalent",
    klerosDisputeId: BigInt(0),
    freelancerPaidArbitrationFee: false,
    clientPaidArbitrationFee: false,
    roundDeadline: BigInt(feeDepositDeadline ?? 0),
    currentRound: 0,
    currentRuling: 0,
    freelancerFunds: BigInt(0),
    clientFunds: BigInt(0),
    appealCost: BigInt(0),
    disputeFinished: false,
    disputeReason: reason,
    title: hireTalent.title,
    description: hireTalent.description,
    lastTransactionHash: event.transaction.hash,
  };

  if (existingDispute) {
    await context.db.update(dispute, disputePk).set(disputeData);
  } else {
    await context.db.insert(dispute).values({
      disputeId: BigInt(localDisputeId),
      ...disputeData,
    });

    await context.db.insert(disputeContributor).values([
      { disputeId: BigInt(localDisputeId), contributor: freelancer as string, lastTransactionHash: event.transaction.hash },
      { disputeId: BigInt(localDisputeId), contributor: client as string, lastTransactionHash: event.transaction.hash },
    ]);
  }

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

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    freelancerPaidArbitrationFee: true,
    freelancerFunds: BigInt(totalAmountPaid ?? 0),
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

    await context.db.update(dispute, { disputeId: localDisputeId }).set({
      clientPaidArbitrationFee: true,
      clientFunds: BigInt(totalAmountPaid ?? 0),
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
  const { localDisputeId, klerosDisputeId } = event.args;


  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    klerosDisputeId: BigInt(klerosDisputeId ?? 0),
    raiseOnKleros: true,
    currentRound: 1,
    status: 0,
    isAppealed: false,
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(klerosDispute).values({
    klerosDisputeId: BigInt(klerosDisputeId),
    disputeId: BigInt(localDisputeId),
    lastTransactionHash: event.transaction.hash,
  });

});

// Gig dispute created
ponder.on("ArbiterProxy:GigDisputeCreated", async ({ event, context }) => {
  const { localDisputeId, gigId, freelancer, client, feeDepositDeadline, reason } = event.args;

  const gigRecord = await context.db.find(gig, { gigId });
  if (!gigRecord) {
    console.error(`Gig not found for gigId: ${gigId}`);
    return;
  }

  await context.db.update(gig, { gigId }).set({
    state: 4, // Disputed state
    disputeId: localDisputeId,
    lastTransactionHash: event.transaction.hash,
  });
  const disputePk = { disputeId: BigInt(localDisputeId) };
  const existingDispute = await context.db.find(dispute, disputePk);

  const disputeData = {
    klerosDisputeId: BigInt(0),
    type: "gig",
    freelancerPaidArbitrationFee: false,
    clientPaidArbitrationFee: false,
    roundDeadline: BigInt(feeDepositDeadline ?? 0),
    currentRound: 0,
    currentRuling: 0,
    freelancerFunds: BigInt(0),
    clientFunds: BigInt(0),
    appealCost: BigInt(0),
    disputeFinished: false,
    disputeReason: reason,
    title: gigRecord.title,
    description: gigRecord.description,
    lastTransactionHash: event.transaction.hash,
  };

  if (existingDispute) {
    await context.db.update(dispute, disputePk).set(disputeData);
  } else {
    await context.db.insert(dispute).values({
      disputeId: BigInt(localDisputeId),
      ...disputeData,
    });

    await context.db.insert(disputeContributor).values([
      { disputeId: BigInt(localDisputeId), contributor: freelancer as string, lastTransactionHash: event.transaction.hash },
      { disputeId: BigInt(localDisputeId), contributor: client as string, lastTransactionHash: event.transaction.hash },
    ]);
  }

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

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    freelancerPaidArbitrationFee: true,
    freelancerFunds: BigInt(totalAmountPaid ?? 0),
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

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    clientPaidArbitrationFee: true,
    clientFunds: BigInt(totalAmountPaid ?? 0),
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

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    klerosDisputeId: BigInt(klerosDisputeId ?? 0),
    raiseOnKleros: true,
    currentRound: 1,
    status: 0,
    isAppealed: false,
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(klerosDispute).values({
    klerosDisputeId: BigInt(klerosDisputeId),
    disputeId: BigInt(localDisputeId),
    lastTransactionHash: event.transaction.hash,
  });
});

// Gig timeout by inaction
ponder.on("ArbiterProxy:GigDisputeTimeoutByInaction", async ({ event, context }) => {
  const { localDisputeId, gigId, ruling, winner } = event.args;

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    currentRuling: ruling ?? 0,
    status: 2, //resolved
    disputeFinished: true,
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

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    currentRuling: ruling ?? 0,
    status: 2, //resolved
    disputeFinished: true,
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

  if (side === 1) update.freelancerFunds = BigInt(totalPaid ?? 0);
  else update.clientFunds = BigInt(totalPaid ?? 0);

  await context.db.update(dispute, { disputeId: localDisputeId }).set(update);
  {
    const contributorAddr = (contributor as string);
    const pk = { disputeId: BigInt(localDisputeId), contributor: contributorAddr };
    const existing = await context.db.find(disputeContributor, pk);
    if (existing) {
      await context.db.update(disputeContributor, pk).set({
        lastTransactionHash: event.transaction.hash,
      });
    } else {
      await context.db.insert(disputeContributor).values({
        disputeId: BigInt(localDisputeId),
        contributor: contributorAddr,
        lastTransactionHash: event.transaction.hash,
      });
    }
  }

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

ponder.on("ArbiterProxy:TalentAppealContribution", async ({ event, context }) => {
  const { localDisputeId, round, talentId, hiredTalentId, side, contributor, amount, totalPaid, requiredAmount } = event.args;

  const update: any = {
    currentRound: round ?? 0,
    appealCost: BigInt(requiredAmount ?? 0),
    lastTransactionHash: event.transaction.hash,
  };

  if (side === 1) update.freelancerFunds = BigInt(totalPaid ?? 0);
  else update.clientFunds = BigInt(totalPaid ?? 0);

  await context.db.update(dispute, { disputeId: localDisputeId }).set(update);


  {
    const contributorAddr = (contributor as string);
    const pk = { disputeId: BigInt(localDisputeId), contributor: contributorAddr };
    const existing = await context.db.find(disputeContributor, pk);
    if (existing) {
      await context.db.update(disputeContributor, pk).set({
        lastTransactionHash: event.transaction.hash,
      });
    } else {
      await context.db.insert(disputeContributor).values({
        disputeId: BigInt(localDisputeId),
        contributor: contributorAddr,
        lastTransactionHash: event.transaction.hash,
      });
    }
  }

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

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    currentRound: round ?? 0,
    status: 0, //wating
    clientFunds: BigInt(0),
    freelancerFunds: BigInt(0),
    clientFee: BigInt(0),
    freelancerFee: BigInt(0),
    clientPaidArbitrationFee: false,
    freelancerPaidArbitrationFee: false,
    isAppealed: false,
    klerosDisputeId: BigInt(klerosDisputeId ?? 0),
    lastTransactionHash: event.transaction.hash,
  });
});

// Talent appeal created
ponder.on("ArbiterProxy:TalentAppealCreated", async ({ event, context }) => {
  const { localDisputeId, klerosDisputeId, round, talentId, hiredTalentId } = event.args;

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    currentRound: round ?? 0,
    status: 0, //waiting
    clientFunds: BigInt(0),
    freelancerFunds: BigInt(0),
    clientFee: BigInt(0),
    freelancerFee: BigInt(0),
    clientPaidArbitrationFee: false,
    freelancerPaidArbitrationFee: false,
    isAppealed: false,
    klerosDisputeId: BigInt(klerosDisputeId ?? 0),
    lastTransactionHash: event.transaction.hash,
  });
});

// Gig fees & rewards withdrawn
ponder.on("ArbiterProxy:GigFeesAndRewardsWithdrawn", async ({ event, context }) => {
  const { localDisputeId, gigId, beneficiary, reward } = event.args;

  // update lastTransactionHash only; reward distribution logic is handled off-chain
  await context.db.update(dispute, { disputeId: localDisputeId }).set({
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
  const { localDisputeId, talentId, hiredTalentId, beneficiary, reward } = event.args;

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
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
ponder.on("ArbiterProxy:TalentRuling", async ({ event, context }) => {
  const { localDisputeId, talentId, hiredTalentId, ruling } = event.args;

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    currentRuling: ruling ?? 0,
    disputeFinished: ruling !== 0,
    lastTransactionHash: event.transaction.hash,
  });
});

// Gig round ruling
ponder.on("ArbiterProxy:GigRuling", async ({ event, context }) => {
  const { localDisputeId, gigId, ruling } = event.args;

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    currentRuling: ruling ?? 0,
    disputeFinished: ruling !== 0,
    lastTransactionHash: event.transaction.hash,
  });
});

// Talent round timeout by inaction
ponder.on("ArbiterProxy:TalentRoundTimeoutByInaction", async ({ event, context }) => {
  const { localDisputeId, round, talentId, hiredTalentId, ruling, winner } = event.args;

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
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

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
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
  const { localDisputeId, round } = event.args;
  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    currentRound: round ?? 0,
    lastTransactionHash: event.transaction.hash,
  });
});

ponder.on("ArbiterProxy:GigAppealExternallyFunded", async ({ event, context }) => {
  const { localDisputeId, round } = event.args;
  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    currentRound: round ?? 0,
    lastTransactionHash: event.transaction.hash,
  });
});

// Talent / Gig dispute dismissed
ponder.on("ArbiterProxy:TalentDisputeDismissed", async ({ event, context }) => {
  const { localDisputeId, talentId, hiredTalentId, timesDismissed, caller } = event.args;

  // Mark talent as active again
  await context.db.update(hiredTalent, { hiredTalentId, talentId }).set({
    state: 1, // Active state
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    clientPaidArbitrationFee: false,
    freelancerPaidArbitrationFee: false,
    timesDismissed: timesDismissed ?? 0,
    status: 0, // waiting
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-talent-dismissed`,
    user: caller as string,
    title: "Dispute dismissed",
    message: `The dispute #${localDisputeId} for hiredTalent ${hiredTalentId} was dismissed.`,
    itemId: localDisputeId,
    href: `/talents/${talentId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

ponder.on("ArbiterProxy:GigDisputeDismissed", async ({ event, context }) => {
  const { localDisputeId, gigId, timesDismissed, caller } = event.args;

  // Mark gig as active again
  await context.db.update(gig, { gigId }).set({
    state: 1, // Active state
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    clientPaidArbitrationFee: false,
    freelancerPaidArbitrationFee: false,
    timesDismissed: timesDismissed ?? 0,
    status: 0, // waiting
    lastTransactionHash: event.transaction.hash,
  });

  await context.db.insert(notification).values({
    id: `${event.block.number}-${event.log.logIndex}-gig-dismissed`,
    user: caller as string,
    title: "Dispute dismissed",
    message: `The dispute #${localDisputeId} for gig ${gigId} was dismissed.`,
    itemId: localDisputeId,
    href: `/gig/${gigId}`,
    createdAt: BigInt(event.block.timestamp),
    lastTransactionHash: event.transaction.hash,
  });
});

ponder.on("ArbiterProxy:TalentRoundStateUpdated", async ({ event, context }) => {
  const { localDisputeId, freelancerPayedRoundFee, clientPayedRoundFee, requiredAmountFreelancer, requiredAmountClient, freelancerFullyFunded, clientFullyFunded, roundDeadline } = event.args;
  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    freelancerPaidArbitrationFee: freelancerFullyFunded,
		clientPaidArbitrationFee: clientFullyFunded,
		freelancerFunds: freelancerPayedRoundFee,
		clientFunds: clientPayedRoundFee,
		freelancerFee: requiredAmountFreelancer,
		clientFee: requiredAmountClient,
		roundDeadline: roundDeadline,
		isAppealed: true,
    lastTransactionHash: event.transaction.hash,
  });
}
);

ponder.on("ArbiterProxy:GigRoundStateUpdated", async ({ event, context }) => {
  const { localDisputeId, freelancerPayedRoundFee, clientPayedRoundFee, requiredAmountFreelancer, requiredAmountClient, freelancerFullyFunded, clientFullyFunded, roundDeadline } = event.args;
  await context.db.update(dispute, { disputeId: localDisputeId }).set({
    freelancerPaidArbitrationFee: freelancerFullyFunded,
    clientPaidArbitrationFee: clientFullyFunded,
    freelancerFunds: freelancerPayedRoundFee,
    clientFunds: clientPayedRoundFee,
    freelancerFee: requiredAmountFreelancer,
    clientFee: requiredAmountClient,
    roundDeadline: roundDeadline,
    isAppealed: true,
    lastTransactionHash: event.transaction.hash,
  });
}
);
