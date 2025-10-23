import { ponder } from "ponder:registry";
import { dispute, klerosDispute } from "ponder:schema";
import deployedContracts  from "../../nextjs/contracts/deployedContracts";
import scaffoldConfig from "../../nextjs/scaffold.config";


const contractName = "ArbiterProxy";
const targetNetwork = scaffoldConfig.targetNetworks[1];
const proxyAddress = deployedContracts[targetNetwork.id][contractName].address;


ponder.on("KlerosArbitrator:AppealPossible", async ({ event, context }) => {
     const {_disputeID, _arbitrable  } = event.args; 
    
     if (_arbitrable != proxyAddress) {
        return;
    }

    await context.db.update(klerosDispute, { klerosDisputeId: BigInt(_disputeID) }).set({
        lastTransactionHash: event.transaction.hash,
    });

    const klerosRelation = await context.db.find(klerosDispute,{ klerosDisputeId: BigInt(_disputeID) });
    const localDisputeId = klerosRelation?.disputeId;
    
    if (localDisputeId) {
        await context.db.update(dispute, { disputeId: localDisputeId }).set({
            status: 1,
            clientFunds: BigInt(0), 
            freelancerFunds: BigInt(0),
            lastTransactionHash: event.transaction.hash,
        });
    }
});

ponder.on("KlerosArbitrator:AppealDecision", async ({ event, context }) => {
    const { klerosDisputeId, arbitrableId } = event.args;
    if (arbitrableId != proxyAddress) {
        return;
    }

    await context.db.update(klerosDispute, { klerosDisputeId: BigInt(klerosDisputeId) }).set({
        lastTransactionHash: event.transaction.hash,
    });

    const klerosRelation = await context.db.find(klerosDispute,{ klerosDisputeId: klerosDisputeId });
    const localDisputeId = klerosRelation?.disputeId;

    if (localDisputeId) {
        await context.db.update(dispute, { disputeId: localDisputeId }).set({
            status: 2,
            lastTransactionHash: event.transaction.hash,
        });
    }
});
