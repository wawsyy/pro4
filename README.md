# Encrypted Survey System

An end-to-end MVP that captures encrypted survey responses, aggregates results homomorphically on-chain, and decrypts insights only for authorized viewers. The solution is powered by the Zama FHEVM stack and ships with a Hardhat backend plus a RainbowKit-enabled Next.js frontend.

## ✨ Highlights

- **Private submissions** – survey answers are encrypted in the browser and never appear in plaintext on-chain.
- **Homomorphic analytics** – tallies for each survey option are computed directly over ciphertext inside the smart contract.
- **Controlled insights** – only administrators and explicitly authorized wallets can decrypt the final totals.
- **RainbowKit UX** – Rainbow wallet connection in the top-right corner, with custom branding and theme.

## 📦 Repository Layout

```
encrypted-survey-system/
├── contracts/               # EncryptedSurvey.sol smart contract
├── deploy/                  # Hardhat-deploy scripts
├── tasks/                   # Custom Hardhat CLI helpers
├── test/                    # Contract unit tests
├── frontend/                # Next.js + RainbowKit application
├── deployments/             # Saved deployment artifacts
└── README.md
```

## 🛠 Prerequisites

- **Node.js 20+**
- **npm 9+** (or a compatible package manager)
- WalletConnect **Project ID** for RainbowKit (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`)
- Access to a Hardhat node or the Zama FHEVM DevNet

## 🚀 Getting Started

### 1. Backend setup

```bash
cd encrypted-survey-system
npm install
```

Set up the required Hardhat secrets:

```bash
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY   # optional for verification
```

Compile, test, and deploy locally:

```bash
npm run compile
npm run test
npx hardhat node                                   # run in a separate terminal
npx hardhat deploy --network localhost
```

### 2. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Generate ABI/addresses for the UI and start the dev server:

```bash
npm run genabi
npm run dev
```

Visit **http://localhost:3000** to use the encrypted survey dashboard.

## 🧠 Smart Contract Overview

`contracts/EncryptedSurvey.sol`:

- Stores the survey metadata, option labels, encrypted tallies, and viewer registry.
- Accepts encrypted responses (`submitResponse`) and prevents multiple submissions per address.
- Allows the admin to add additional viewers (`authorizeViewer`).
- Exposes encrypted tallies for the UI to decrypt once authorized.

### Hardhat tasks

| Task name             | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `survey:address`      | Prints the contract address for the current network      |
| `survey:submit`       | Submits an encrypted vote for the chosen option          |
| `survey:decrypt`      | Decrypts a tally for an authorized viewer                |
| `survey:authorize`    | Authorizes a viewer address (admin only)                 |

Run tasks with e.g. `npx hardhat --network localhost survey:submit --option 1`.

## 🧪 Testing

The `test/EncryptedSurvey.ts` suite runs against the FHEVM mock environment:

```bash
npx hardhat test
```

Tests cover initialization, encrypted submissions, and the authorized viewer flow.

## 🌐 Frontend Workflow

- RainbowKit handles wallet connection with a compact connect button in the top-right corner.
- `useEncryptedSurvey` hook aggregates contract reads, encrypted submission, and FHE decryption.
- The UI surfaces three core states: submission status, authorization status, and decrypted tallies.
- Custom branding (logo, favicon, background) delivered via Tailwind CSS and SVG assets.

## 📄 License

This project is released under the MIT License. See the [LICENSE](LICENSE) file for details.

## 📚 Further Reading

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- [RainbowKit Documentation](https://www.rainbowkit.com/docs/introduction)

---

Built for encrypted insight loops – safeguard employee feedback from submission to decision.
