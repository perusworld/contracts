import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";
import { pathOutputJson as coreJson } from "./deployCore";

const pathOutputJson = path.join(__dirname, "./deploy_mtp_validator_output.json");
const coreDef = JSON.parse(fs.readFileSync(coreJson).toString());

async function main() {
  const stateAddress = coreDef['state'];
  const verifierContractWrapperName = "VerifierMTPWrapper";
  const validatorContractName = "CredentialAtomicQueryMTPValidator";
  const VerifierMTPWrapper = await ethers.getContractFactory(
    verifierContractWrapperName
  );
  const verifierWrapper = await VerifierMTPWrapper.deploy();

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
