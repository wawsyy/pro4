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
  // Set deadline to 30 days from now
  const deadline = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
  const survey = (await factory.deploy(
    "Employee Experience Pulse 2025",
    "Encrypted survey capturing employee sentiment while keeping responses private.",
    SURVEY_OPTIONS,
    deadline,
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

  it("manages survey lifecycle with deadline and status", async function () {
    const isActive = await survey.isActive();
    expect(isActive).to.be.true;

    const deadline = await survey.surveyDeadline();
    expect(deadline).to.be.gt(0);

    await survey.connect(signers.deployer).closeSurvey();
    const isActiveAfterClose = await survey.isActive();
    expect(isActiveAfterClose).to.be.false;

    await survey.connect(signers.deployer).reopenSurvey();
    const isActiveAfterReopen = await survey.isActive();
    expect(isActiveAfterReopen).to.be.true;
  });

  it("supports batch response submission", async function () {
    const encryptedBatch = await fhevm
      .createEncryptedInput(surveyAddress, signers.alice.address)
      .add32(1)
      .add32(1)
      .encrypt();

    const optionIndices = [0, 1];

    await survey
      .connect(signers.alice)
      .submitBatchResponse(optionIndices, encryptedBatch.handles, encryptedBatch.inputProof);

    // Check that user has responded
    const hasResponded = await survey.hasResponded(signers.alice.address);
    expect(hasResponded).to.be.true;

    // Check user votes
    const userVotes = await survey.getUserVotes(signers.alice.address);
    expect(userVotes.length).to.eq(2);
    expect(userVotes[0]).to.eq(0);
    expect(userVotes[1]).to.eq(1);
  });

  it("allows vote withdrawal and resubmission", async function () {
    const encryptedOne = await fhevm
      .createEncryptedInput(surveyAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    // Submit initial response
    await survey
      .connect(signers.alice)
      .submitResponse(0, encryptedOne.handles[0], encryptedOne.inputProof);

    let hasResponded = await survey.hasResponded(signers.alice.address);
    expect(hasResponded).to.be.true;

    // Withdraw and resubmit
    await survey.connect(signers.alice).withdrawAndResubmit();

    hasResponded = await survey.hasResponded(signers.alice.address);
    expect(hasResponded).to.be.false;

    // Should be able to submit again
    await survey
      .connect(signers.alice)
      .submitResponse(1, encryptedOne.handles[0], encryptedOne.inputProof);

    hasResponded = await survey.hasResponded(signers.alice.address);
    expect(hasResponded).to.be.true;
  });

  it("manages viewer roles and access control", async function () {
    // Authorize with role
    const expiryTimestamp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
    await survey.connect(signers.deployer).authorizeViewerWithRole(signers.bob.address, 1, expiryTimestamp);

    const viewerDetails = await survey.getViewerDetails(signers.bob.address);
    expect(viewerDetails.isAuthorized).to.be.true;
    expect(viewerDetails.role).to.eq(1);
    expect(viewerDetails.expiry).to.eq(expiryTimestamp);

    const hasAccess = await survey.hasValidAccess(signers.bob.address);
    expect(hasAccess).to.be.true;

    // Revoke access
    await survey.connect(signers.deployer).revokeViewer(signers.bob.address);

    const viewerDetailsAfterRevoke = await survey.getViewerDetails(signers.bob.address);
    expect(viewerDetailsAfterRevoke.isAuthorized).to.be.false;
  });

  it("provides survey statistics and metadata", async function () {
    const stats = await survey.getSurveyStats();
    expect(stats.totalOptions).to.eq(SURVEY_OPTIONS.length);
    expect(stats.activeStatus).to.eq(1); // Active

    const metadata = await survey.getSurveyMetadata();
    expect(metadata.title).to.eq("Employee Experience Pulse 2025");
    expect(metadata.optionCount).to.eq(SURVEY_OPTIONS.length);
    expect(metadata.active).to.be.true;

    const resultSummary = await survey.getResultSummary();
    expect(resultSummary.optionIndices.length).to.eq(SURVEY_OPTIONS.length);
    expect(resultSummary.optionLabels.length).to.eq(SURVEY_OPTIONS.length);
  });
});

