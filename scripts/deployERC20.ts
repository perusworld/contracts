import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import {deployPoseidons, deploySpongePoseidon} from "../test/utils/deploy-poseidons.util";
const pathOutputJson = path.join(
  __dirname,
  "./deploy_erc20verifier_output.json"
);
const schemaJson = path.join(
  __dirname,
  "../go/schema.json"
);
const schemaDef = JSON.parse(fs.readFileSync(schemaJson).toString());

import { pathOutputJson as coreJson } from "./deployCore";
const coreDef = JSON.parse(fs.readFileSync(coreJson).toString());

import { pathOutputJson as valJson } from "./deploySigValidator";
const valDef = JSON.parse(fs.readFileSync(valJson).toString());

const SpongePoseidon = coreDef['spongePoseidon'];
const PoseidonUnit6L = coreDef['poseidon6'];
const validatorAddress = valDef['validator'];
const circuitId = "credentialAtomicQuerySigV2OnChain";

const Operators = {
  NOOP : 0, // No operation, skip query verification in circuit
  EQ : 1, // equal
  LT : 2, // less than
  GT : 3, // greater than
  IN : 4, // in
  NIN : 5, // not in
  NE : 6   // not equal
}

// you can run https://go.dev/play/p/rnrRbxXTRY6 to get schema hash and claimPathKey using YOUR schema
const schemaBigInt = schemaDef["schemaHash"]
// merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
const schemaClaimPathKey = schemaDef["claimPathKey"]
const query = {
  requestId: 1,
  schema: schemaBigInt,
  claimPathKey  : schemaClaimPathKey,
  operator: Operators.LT, // operator
  value: [20020101, ...new Array(63).fill(0).map(i => 0)], // for operators 1-3 only first value matters
};



async function main() {

  const contractName ="ERC20Verifier"
  const name = "ERC20ZKPVerifier";
  const symbol = "ERCZKP";
  const ERC20ContractFactory = await ethers.getContractFactory(contractName,{
    libraries: {
      SpongePoseidon,
      PoseidonUnit6L
    },
  } );
  const erc20instance = await ERC20ContractFactory.deploy(
    name,
    symbol
  );

  await erc20instance.deployed();
  console.log(contractName, " deployed to:", erc20instance.address);

  const requestId = await erc20instance.TRANSFER_REQUEST_ID();
  try {
    let tx = await erc20instance.setZKPRequest(
        requestId,
        validatorAddress,
        query.schema,
        query.claimPathKey,
        query.operator,
        query.value,
    );
    console.log(tx.hash);
  } catch (e) {
    console.log("error: ", e);
  }

  const outputJson = {
    circuitId,
    token: erc20instance.address,
    network: process.env.HARDHAT_NETWORK,
  };
  fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
