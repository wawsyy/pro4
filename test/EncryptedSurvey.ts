import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

import { EncryptedSurvey, EncryptedSurvey__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

const SURVEY_OPTIONS = ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"];

async function deploySurveyFixture() {
  const factory = (await ethers.getContractFactory("EncryptedSurvey")) as EncryptedSurvey__factory;
  const survey = (await factory.deploy(
    "Employee Experience Pulse 2025",
    "Encrypted survey capturing employee sentiment while keeping responses private.",
    SURVEY_OPTIONS,
  )) as EncryptedSurvey;

  const address = await survey.getAddress();

  return { survey, address };
}

describe("EncryptedSurvey", function () {
  let signers: Signers;
  let survey: EncryptedSurvey;
  let surveyAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This hardhat test suite cannot run on Sepolia Testnet");
      this.skip();
    }

    ({ survey, address: surveyAddress } = await deploySurveyFixture());
  });

  it("initializes encrypted tallies to zero", async function () {
    const optionsCount = await survey.optionsCount();
    expect(optionsCount).to.eq(SURVEY_OPTIONS.length);

    for (let index = 0; index < SURVEY_OPTIONS.length; index++) {
      const tally = await survey.getEncryptedTally(index);
      expect(tally).to.eq(ethers.ZeroHash);
    }
  });

  it("accepts encrypted responses and updates tally exactly once per respondent", async function () {
    const encryptedOne = await fhevm
      .createEncryptedInput(surveyAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    const optionIndex = 1;

    const tx = await survey
      .connect(signers.alice)
      .submitResponse(optionIndex, encryptedOne.handles[0], encryptedOne.inputProof);
    await tx.wait();

    const tally = await survey.getEncryptedTally(optionIndex);
    const decryptedTally = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      tally,
      surveyAddress,
      signers.deployer,
    );

    expect(decryptedTally).to.eq(1);
    await expect(
      survey
        .connect(signers.alice)
        .submitResponse(optionIndex, encryptedOne.handles[0], encryptedOne.inputProof),
    ).to.be.revertedWithCustomError(survey, "SurveyAlreadyAnswered");
  });

  it("authorizes additional viewers to decrypt the aggregated results", async function () {
    const encryptedOne = await fhevm
      .createEncryptedInput(surveyAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    await survey
      .connect(signers.alice)
      .submitResponse(0, encryptedOne.handles[0], encryptedOne.inputProof);

    await survey.connect(signers.deployer).authorizeViewer(signers.bob.address);

    const tally = await survey.getEncryptedTally(0);
    const decryptedByBob = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      tally,
      surveyAddress,
      signers.bob,
    );

    expect(decryptedByBob).to.eq(1);
  });
});

