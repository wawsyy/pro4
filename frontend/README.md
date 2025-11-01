# Encrypted Survey Frontend

A RainbowKit-powered Next.js dashboard for the Encrypted Survey System. It rehearses a privacy-preserving feedback loop: respondents encrypt their answers locally, tallies are computed on-chain with Zama FHEVM, and leadership can decrypt the aggregated results once authorized.

## 🔧 Tech Stack

- **Next.js 15** with the App Router
- **RainbowKit + wagmi + viem** for wallet connectivity
- **Tailwind CSS** for styling and motion
- **useEncryptedSurvey hook** orchestrating FHEVM encryption, contract reads, and decryption

## 🚀 Quick Start

```bash
cd frontend
npm install
```

Configure RainbowKit with your WalletConnect project id:

```bash
cp .env.example .env.local          # create if it does not exist
echo "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your_project_id>" >> .env.local
```

Generate ABI and address bindings after deploying the smart contract (from the repository root):

```bash
cd frontend
npm run genabi
```

Run the development server:

```bash
npm run dev
```

Open **http://localhost:3000** to access the dashboard.

> ℹ️ Ensure the Hardhat backend is running locally (`npx hardhat node`) and the contract has been deployed with `npx hardhat deploy --network localhost`.

## 🗂 Project Structure

- `app/` – Next.js entrypoints, layout, and page
- `components/Logo.tsx` – Custom branding for the navigation
- `hooks/useEncryptedSurvey.tsx` – Core hook interacting with the contract and FHEVM
- `fhevm/` – Shared helpers to work with the Zama FHEVM client
- `public/` – Branding assets and favicons
- `scripts/genabi.mjs` – Generates ABI/addresses from Hardhat deployments

## 📜 Available Scripts

| Script          | Description                                             |
| --------------- | ------------------------------------------------------- |
| `npm run dev`   | Run the Next.js dev server with live reload             |
| `npm run build` | Build the production bundle                             |
| `npm run start` | Serve the production build                              |
| `npm run lint`  | Run eslint                                              |
| `npm run genabi`| Regenerate contract ABI/address files from deployments  |

## 🔐 UI Capabilities

- RainbowKit `ConnectButton` lives in the header (top-right).
- Survey form encrypts and submits answers directly from the browser.
- Status panel surfaces FHE instance health, authorization status, and progress.
- Results table shows ciphertext handles and decrypts totals for authorized viewers.
- Admin wallets can authorize the connected account with a single click.

## 🔧 Troubleshooting

### FHEVM SDK Loading Issues

If you see console errors related to FHEVM SDK loading:

1. **Check browser console** for detailed error messages
2. **Allow third-party scripts** - ensure your browser allows loading scripts from CDN
3. **Disable browser extensions** that might block scripts (like ad blockers)
4. **Network connectivity** - verify internet connection and firewall settings
5. **Fallback mechanism** - the app automatically tries multiple CDN URLs for the SDK

Common error patterns:
- `RelayerSDKLoader: window does not contain 'relayerSDK' property`
- `FhevmAbortError` or initialization failures
- `sdk-loading` → `sdk-loaded` → `sdk-initializing` → `error`

### Wallet Connection Issues

- **Sepolia testnet**: Ensure your wallet is connected to Sepolia network (Chain ID: 11155111)
- **Wallet compatibility**: Check that your wallet supports required RPC methods
- **Environment variables**: Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is correctly set
- **Network configuration**: Confirm the contract address exists on the connected network

### Environment Variables

Create a `.env.local` file:

```bash
# WalletConnect Project ID - Get from https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: Custom FHEVM RPC URL (defaults to network-specific URLs)
# NEXT_PUBLIC_FHEVM_RPC_URL=https://your-custom-fhevm-rpc-url
```

**Note**: Without `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, only injected wallets (MetaMask, etc.) are supported.

## 📚 Further Reading

- [RainbowKit Documentation](https://www.rainbowkit.com/docs/introduction)
- [wagmi Docs](https://wagmi.sh)
- [Zama FHEVM Docs](https://docs.zama.ai/fhevm)

## 📄 License

Distributed under the MIT License. See the [LICENSE](../LICENSE) file for more information.
