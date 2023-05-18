import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";

import { StateDeployHelper } from "../test/helpers/StateDeployHelper";
import { Contract } from "ethers";
export const pathOutputJson = path.join(__dirname, "./deploy_core_output.json");

async function main() {

  const deployHelper = await StateDeployHelper.initialize(null, true);

  const resp = await deployHelper.deployStateV2();
  const outputJson = {} as any;

  for (const key in resp) {
    if (Object.prototype.hasOwnProperty.call(resp, key)) {
      const element = resp[key] as Contract;
      outputJson[key] = element.address;
    }
  }
  fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

if (require.main === module) {
  main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
