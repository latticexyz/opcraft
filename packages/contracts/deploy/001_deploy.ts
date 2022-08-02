import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { blue, green } from "colorette";
import { Contract } from "ethers";
import { idToSystem, systemToId } from "../types/SystemMappings";
import { resolveProperties, defaultAbiCoder as abi, keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { BaseProvider, TransactionRequest } from "@ethersproject/providers";
import { components, systems } from "../deploy.json";

export function extractEncodedArguments(input: string) {
  // Cutting off the first 4 bytes, which represent the function selector
  if (input[0] !== "0" && input[1] !== "x") throw new Error("Invalid hex string");
  return "0x" + input.substring(10);
}

export async function getRevertReason(txHash: string, provider: BaseProvider): Promise<string> {
  // Decoding the revert reason: https://docs.soliditylang.org/en/latest/control-structures.html#revert
  const tx = await provider.getTransaction(txHash);
  tx.gasPrice = undefined; // tx object contains both gasPrice and maxFeePerGas
  const encodedRevertReason = await provider.call(tx as TransactionRequest);
  const decodedRevertReason = abi.decode(["string"], extractEncodedArguments(encodedRevertReason));
  return decodedRevertReason[0];
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  console.log("deployer", deployer);

  const contracts: { [key: string]: Contract } = {};

  // Deploy world
  console.log(blue("Deploying World"));
  const { address: WorldAddress } = await deploy("World", {
    from: deployer,
    log: true,
    args: [],
  });

  console.log(green("World deployed at"), WorldAddress);
  console.log("Storing world contract");
  contracts["World"] = await hre.ethers.getContract("World", deployer);
  console.log("World contract stored");
  console.log("Init world");
  const tx = await contracts["World"].init();
  await tx.wait();
  console.log("Done init World");
  const componentsAddress = await contracts["World"].components();
  console.log("Components", componentsAddress);

  // Deploy components
  for (const compName of components) {
    console.log(blue("Deploying " + compName));
    const { address } = await deploy(compName, {
      from: deployer,
      log: true,
      args: [WorldAddress],
    });
    contracts[compName] = await hre.ethers.getContract(compName, deployer);
    console.log(green(compName + " deployed at"), address);
  }

  // Deploy systems
  for (const { name: systemName, writeAccess, initialize } of systems) {
    console.log(blue("Deploying " + systemName));
    const { address } = await deploy(systemName, {
      from: deployer,
      log: true,
      args: [WorldAddress, componentsAddress],
    });

    contracts[systemName] = await hre.ethers.getContract(systemName, deployer);

    await (
      await contracts["World"].registerSystem(address, keccak256(toUtf8Bytes((systemToId as any)[systemName])))
    ).wait();

    // Grant access
    for (const compName of writeAccess) {
      if (compName === "*") {
        for (const c of components) {
          console.log("Giving grant access on", c, "to", systemName);
          await (await contracts[c].authorizeWriter(address)).wait();
        }
      } else {
        console.log("Giving grant access on", compName, "to", systemName);
        await (await contracts[compName].authorizeWriter(address)).wait();
      }
    }

    // Call init function
    if (initialize) {
      console.log("Initialize", systemName);
      await (await contracts[systemName].execute([])).wait();
    }

    console.log(green(systemName + " deployed at"), address);
  }
};
export default func;
