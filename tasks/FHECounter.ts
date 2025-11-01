import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the FHECounter contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the FHECounter contract
 *
 *   npx hardhat --network localhost task:decrypt-count
 *   npx hardhat --network localhost task:increment --value 2
 *   npx hardhat --network localhost task:decrement --value 1
 *   npx hardhat --network localhost task:decrypt-count
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the FHECounter contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the FHECounter contract
 *
 *   npx hardhat --network sepolia task:decrypt-count
 *   npx hardhat --network sepolia task:increment --value 2
 *   npx hardhat --network sepolia task:decrement --value 1
 *   npx hardhat --network sepolia task:decrypt-count
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:address
 *   - npx hardhat --network sepolia task:address
 */
task("survey:address", "Prints the deployed EncryptedSurvey contract address").setAction(
  async function (_taskArguments: TaskArguments, hre) {
    const { deployments } = hre;

    const deployment = await deployments.get("EncryptedSurvey");

    console.log("EncryptedSurvey address is " + deployment.address);
  },
);

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-count
 *   - npx hardhat --network sepolia task:decrypt-count
 */
task("survey:decrypt", "Decrypts the tally for a specific survey option")
  .addParam("option", "The option index to decrypt")
  .addOptionalParam("address", "Optionally specify the EncryptedSurvey contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedSurvey");
    console.log(`EncryptedSurvey: ${deployment.address}`);

    const optionIndex = parseInt(taskArguments.option);
    if (!Number.isInteger(optionIndex)) {
      throw new Error(`Argument --option must be an integer`);
    }

    const signers = await ethers.getSigners();

    const surveyContract = await ethers.getContractAt("EncryptedSurvey", deployment.address);

    const encryptedTally = await surveyContract.getEncryptedTally(optionIndex);
    if (encryptedTally === ethers.ZeroHash) {
      console.log(`Encrypted tally: ${encryptedTally}`);
      console.log("Clear tally    : 0");
      return;
    }

    const clearTally = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTally,
      deployment.address,
      signers[0],
    );
    console.log(`Encrypted tally: ${encryptedTally}`);
    console.log(`Clear tally    : ${clearTally}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:increment --value 1
 *   - npx hardhat --network sepolia task:increment --value 1
 */
task("survey:submit", "Submits an encrypted response for a survey option")
  .addParam("option", "The option index to support")
  .addOptionalParam("address", "Optionally specify the EncryptedSurvey contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const optionIndex = parseInt(taskArguments.option);
    if (!Number.isInteger(optionIndex)) {
      throw new Error(`Argument --option must be an integer`);
    }

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedSurvey");
    console.log(`EncryptedSurvey: ${deployment.address}`);

    const signers = await ethers.getSigners();

    const surveyContract = await ethers.getContractAt("EncryptedSurvey", deployment.address);

    const encryptedValue = await fhevm
      .createEncryptedInput(deployment.address, signers[0].address)
      .add32(1)
      .encrypt();

    const tx = await surveyContract
      .connect(signers[0])
      .submitResponse(optionIndex, encryptedValue.handles[0], encryptedValue.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:decrement --value 1
 *   - npx hardhat --network sepolia task:decrement --value 1
 */
task("survey:authorize", "Authorizes a viewer address to decrypt the survey tallies")
  .addParam("viewer", "The address to authorize")
  .addOptionalParam("address", "Optionally specify the EncryptedSurvey contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const viewer = taskArguments.viewer;
    if (!ethers.isAddress(viewer)) {
      throw new Error(`Argument --viewer must be a valid address`);
    }

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedSurvey");
    console.log(`EncryptedSurvey: ${deployment.address}`);

    const signers = await ethers.getSigners();

    const surveyContract = await ethers.getContractAt("EncryptedSurvey", deployment.address);

    const tx = await surveyContract.connect(signers[0]).authorizeViewer(viewer);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);
  });
