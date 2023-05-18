import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";
import { pathOutputJson as coreJson } from "./deployCore";

export const pathOutputJson = path.join(__dirname, "./deploy_sig_validator_output.json");

const coreDef = JSON.parse(fs.readFileSync(coreJson).toString());

async function main() {
  const stateAddress = coreDef['state'];

  const verifierContractWrapperName = "VerifierSigWrapper";
  const validatorContractName = "CredentialAtomicQuerySigValidator";
  const VerifierSigWrapper = await ethers.getContractFactory(
    verifierContractWrapperName
  );
  const verifierWrapper = await VerifierSigWrapper.deploy();

  await verifierWrapper.deployed();
  console.log(
    verifierContractWrapperName,
    " deployed to:",
    verifierWrapper.address
  );

  const CredentialAtomicQueryValidator = await ethers.getContractFactory(
    validatorContractName
  );

  const CredentialAtomicQueryValidatorProxy = await upgrades.deployProxy(
    CredentialAtomicQueryValidator,
    [verifierWrapper.address, stateAddress] // current state address on mumbai
  );

  await CredentialAtomicQueryValidatorProxy.deployed();
  console.log(
    validatorContractName,
    " deployed to:",
    CredentialAtomicQueryValidatorProxy.address
  );

  const outputJson = {
    verifierContractWrapperName,
    validatorContractName,
    validator: CredentialAtomicQueryValidatorProxy.address,
    verifier: verifierWrapper.address,
    network: process.env.HARDHAT_NETWORK,
  };
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