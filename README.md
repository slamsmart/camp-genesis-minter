# 🚀 CampGenesis Minter

A minimalist, full-featured NFT minter for the [Camp Testnet](https://www.campnetwork.io), built with performance and flexibility in mind. Leverages Origin SDK for wallet integration and on-chain minting. Includes real-time gallery and transaction tracking.

> **This is not a demo. This is real on-chain NFT minting.**

---

## ✅ Core Features

### 🔥 Full On-Chain Minting Pipeline
- Upload image to IPFS via **Pinata**
- Auto-generate metadata JSON (name, creator, image CID)
- Mint NFTs using deployed smart contract on **BaseCAMP Testnet**
- Supports **WalletConnect**

---

### ⚡ Real-Time UX Feedback
- Visual minting **spinner**
- Status indicators: `Minting`, `Success`, `Failed`
- Disable buttons during TX → no double mint
- **“Mint Another NFT”** = loop minting without reload

---

### 👁 NFT Preview Before Mint
- Show uploaded image before committing
- Display structured JSON metadata (name, image, description)
- Verifies IPFS CID is valid before mint

---

### ✅ Mint Result Display
- Show NFT image + metadata after minting
- Show TX hash, contract address, and **BlockScout link**
- Clear UI status: green for success, red for failure

---

## 🖼 NFT Gallery (via [Camp Collector](https://camp-collector.vercel.app/))
- View all NFTs minted by wallet
- Show image, name, metadata, and token ID
- Filter by wallet address

---

## 📜 Transaction Tracker
- View latest minting TXs
- Fetches live from BlockScout explorer
- Clickable TX links with real status

---

## 💡 Why CampGenesis Wins

- ✅ Full IPFS + Smart Contract + Wallet integration
- ✅ Uses **WizzCamp** contract on Camp testnet — real minting
- ✅ Origin SDK & WalletConnect ready
- ✅ Works on **mobile & desktop**
- ✅ Zero gimmicks — it actually mints NFTs on-chain

---

## 🛠 Tech Stack

| Layer         | Tech                            |
|---------------|----------------------------------|
| Frontend      | React + Vite + Tailwind CSS     |
| Blockchain    | Camp Network (BaseCAMP testnet) |
| Wallet        | Origin SDK + ethers.js          |
| Storage       | Pinata (IPFS image & metadata)  |
| Explorer      | BlockScout API                  |

---

## 📦 Getting Started

```bash
git clone https://github.com/yourusername/campgenesis-minter.git
cd campgenesis-minter
npm install
npm run dev
```

> ⚠️ Ensure your wallet is connected to **Camp Testnet** and funded with testnet VS tokens.

---

## 📵 Live Demo

👉 [https://camp-genesis-minter.vercel.app](https://camp-genesis-minter.vercel.app)

---

## 📸 Screenshots (Coming Soon)
- Minting UI with spinner
- NFT preview card
- Result page with metadata + image
- BlockScout TX proof
- Live gallery and wallet filtering

---

## 📜 License

MIT License

---

## 🔧 Dev Scripts

| Command         | Description                          |
|-----------------|--------------------------------------|
| `npm start`     | Start dev server                     |
| `npm run build` | Build for production                 |
| `npm test`      | Run tests (TBD)                      |
| `npm run eject` | Unwrap Vite/Webpack config (careful) |

---

## 🤝 Contributing

Pull requests are welcome. This is an open project — fork it, build on it, use it for your Camp-based NFT dApps or testnet showcases.


- [Code Splitting](https://facebook.github.io/create-react-app/docs/code-splitting)
- [Bundle Size Analysis](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)
- [PWA Guide](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)
- [Advanced Config](https://facebook.github.io/create-react-app/docs/advanced-configuration)
- [Deployment](https://facebook.github.io/create-react-app/docs/deployment)
- [Build Minify Troubleshooting](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
