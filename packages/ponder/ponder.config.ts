  import { createConfig } from "ponder";
  import { http } from "viem";
  import deployedContracts  from "../nextjs/contracts/deployedContracts";
  import externalContracts from "../nextjs/contracts/externalContracts";
  import scaffoldConfig from "../nextjs/scaffold.config";

  const targetNetwork = scaffoldConfig.targetNetworks[1];

  const networks = {
    [targetNetwork.name]: {
      chainId: targetNetwork.id,
      transport: http(process.env[`PONDER_RPC_URL_${targetNetwork.id}`])
    },
  };

  const contractNames = Object.keys(deployedContracts[targetNetwork.id]);


  // const contracts = Object.fromEntries(contractNames.map((contractName) => {
  //   return [contractName, {
  //     network: targetNetwork.name as string,
  //     abi: deployedContracts[targetNetwork.id][contractName].abi,
  //     address: deployedContracts[targetNetwork.id][contractName].address,
  //     startBlock: deployedContracts[targetNetwork.id][contractName].receipt.blockNumber,
  //   }];
  // }));


  const deployedContractNames = Object.keys(deployedContracts[targetNetwork.id] || {});
  const contracts = Object.fromEntries(
    deployedContractNames.map((contractName) => {
      const deployment = deployedContracts[targetNetwork.id][contractName];
      return [
        contractName,
        {
          network: targetNetwork.name as string,
          abi: deployment.abi,
          address: deployment.address as `0x${string}`,
          // Usa el blockNumber del recibo si existe, si no, usa 0 o un valor por defecto
          startBlock: deployment.receipt?.blockNumber ? Number(deployment.receipt.blockNumber) : 0,
        },
      ];
    })
  );

  const maxBlockNumber = Math.max(
    ...Object.values(deployedContracts[targetNetwork.id] || {}).map(
      (deployment: any) => deployment?.receipt?.blockNumber || 0
    )
  );
  
  const externalContractNames = Object.keys(externalContracts[targetNetwork.id] || {});
  externalContractNames.forEach((contractName) => {
    const externalData = externalContracts[targetNetwork.id][contractName];
    if (externalData) { 
      
      let startBlock = externalData.startBlock || 0;
       if (contractName === 'KlerosArbitrator' && targetNetwork.name === 'Sepolia') {
           startBlock = maxBlockNumber;
       }

      contracts[contractName] = { 
        network: targetNetwork.name as string,
        abi: externalData.abi,
        address: externalData.address as `0x${string}`,
        startBlock: startBlock, 
      };
    }
  });

  export default createConfig({
    networks: networks,
    contracts: contracts,
  });



