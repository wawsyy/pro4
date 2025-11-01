import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const surveyTitle = "Employee Experience Pulse 2025";
  const surveyDescription = "Encrypted survey capturing employee sentiment while keeping responses private.";
  const surveyOptions = ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"];

  const deployedSurvey = await deploy("EncryptedSurvey", {
    from: deployer,
    args: [surveyTitle, surveyDescription, surveyOptions],
    log: true,
  });

  console.log(`EncryptedSurvey contract: `, deployedSurvey.address);
};
export default func;
func.id = "deploy_encrypted_survey"; // id required to prevent reexecution
func.tags = ["EncryptedSurvey"];
