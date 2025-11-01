import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "EncryptedSurvey";

// Root directory that contains contracts and deployments (one level up from frontend)
const rel = "..";

const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line = "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(`${line}Unable to locate ${rel}. Expecting ${dirname}${line}`);
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

function deployOnHardhatNode() {
  if (process.platform === "win32") {
    // Not supported on Windows
    return;
  }
  try {
    execSync(`./deploy-hardhat-node.sh`, {
      cwd: path.resolve("./scripts"),
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`${line}Script execution failed: ${e}${line}`);
    process.exit(1);
  }
}

function readDeployment(chainNames, chainId, contractName, optional) {
  const names = Array.isArray(chainNames) ? chainNames : [chainNames];

  for (const name of names) {
    const chainDeploymentDir = path.join(deploymentsDir, name);

    if (!fs.existsSync(chainDeploymentDir)) {
      continue;
    }

    const jsonPath = path.join(chainDeploymentDir, `${contractName}.json`);
    if (!fs.existsSync(jsonPath)) {
      continue;
    }

    const jsonString = fs.readFileSync(jsonPath, "utf-8");
    const obj = JSON.parse(jsonString);
    obj.chainId = chainId;
    obj.chainName = name;
    return obj;
  }

  if (chainId === 31337) {
    deployOnHardhatNode();
    return readDeployment(names, chainId, contractName, optional);
  }

  const log = optional ? console.warn : console.error;
  log(
    `${line}Unable to locate deployment for [${names.join(
      ", ",
    )}].\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${names[0]}'.${line}`,
  );
  if (!optional) {
    process.exit(1);
  }
  return undefined;
}

const deployLocal = readDeployment(["hardhat", "localhost"], 31337, CONTRACT_NAME, false /* optional */);

let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true /* optional */);
if (!deploySepolia) {
  deploySepolia = {
    abi: deployLocal.abi,
    address: "0x0000000000000000000000000000000000000000",
  };
}

if (deployLocal && deploySepolia) {
  if (JSON.stringify(deployLocal.abi) !== JSON.stringify(deploySepolia.abi)) {
    console.error(
      `${line}Deployments on localhost and Sepolia differ. Cant use the same abi on both networks. Consider re-deploying the contracts on both networks.${line}`,
    );
    process.exit(1);
  }
}

const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: deployLocal.abi }, null, 2)} as const;
\n`;
const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocal.address}", chainId: 31337, chainName: "${deployLocal.chainName}" },
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}Addresses.ts`), tsAddresses, "utf-8");

