# 🚀 Camp Genesis Minter

**Camp Genesis Minter** is a **high-performance, production-ready NFT minter** for the [Camp Testnet]  
Built for **speed, reliability, and user experience**, it integrates **Origin SDK** for wallet connection and on-chain minting, with full **IPFS storage**, real-time feedback, and a responsive UI.

> **Not a prototype.** This is **live, on-chain NFT minting** — deployable and usable right now.

---

## 🎯 Why It Stands Out

This isn’t a demo with fake transactions — it’s the real deal:
- **Full Minting Pipeline**: Image → IPFS → Metadata → Smart Contract → Wallet
- **Instant Feedback**: Live status, no page reloads
- **Mobile & Desktop**: Fully responsive
- **Zero Fluff**: Purpose-built for creators & collectors

---

## ✨ Features at a Glance

![Features at a Glance] 

| Feature                  | What It Delivers                              |
|--------------------------|-----------------------------------------------|
| **On-Chain Minting**     | Full minting pipeline on **BaseCAMP Testnet** |
| **Real-Time Feedback**   | Live mint status + automatic gallery refresh  |
| **NFT Preview**          | View image & JSON metadata before mint        |
| **Transaction Tracker**  | See recent mints & verify TX on BlockScout    |

---

## ✅ Core Capabilities

### 🔗 End-to-End On-Chain Minting
- Upload images to **IPFS** via **Pinata**
- Auto-generate metadata JSON (name, creator, image CID)
- Mint NFTs using **WizzCamp** smart contract on **BaseCAMP Testnet**
- Wallet integration with **Origin SDK** + **WalletConnect**

---

### ⚡ Real-Time UX Feedback
- Minting spinner + status badges: `Minting`, `Success`, `Failed`
- Buttons auto-disable during transactions to prevent duplicate mints
- “**Mint Another NFT**” without reloading

---

### 👁 NFT Pre-Mint Validation
- Instant image preview
- Metadata JSON view before mint
- IPFS CID check before sending TX

---

### 🏆 Post-Mint Results
- Display NFT image + metadata immediately
- Show transaction hash, contract address, and **BlockScout link**
- Color-coded success/failure messages

---

## 🖼 NFT Gallery
- **Automatic refresh** after minting
- Filter NFTs by wallet address
- Show image, name, token ID, and metadata
- Powered by [Camp Collector](https://camp-collector.vercel.app/)

---

## 📜 Transaction Tracker
- Pulls live data from **BlockScout API**
- Clickable transaction links for proof
- Real-time status updates

---

## 🛠 Tech Stack

| Layer         | Tech                                |
|---------------|-------------------------------------|
| Frontend      | React + Vite + Tailwind CSS         |
| Blockchain    | Camp Network (BaseCAMP Testnet)     |
| Wallet        | Origin SDK + ethers.js + WalletConnect |
| Storage       | Pinata (IPFS for images & metadata) |
| Explorer      | BlockScout API                      |

---

## 🚀 Getting Started

```bash
git clone https://github.com/yourusername/campgenesis-minter.git
cd campgenesis-minter
npm install
npm run dev

🌍 Live Demo
🔗 camp-genesis-minter.vercel.app

📸 Showcase
Minting UI with live status spinner

NFT preview with JSON metadata

Post-mint success screen with TX details

Live gallery with wallet filtering

Transaction tracker in action

📜 License
MIT License — free to use, fork, and build upon.

🤝 Contributing
Pull requests are welcome. Whether you want to improve UI, optimize performance, or add features — join in.

💡 Why This Wins
Real Functionality → Fully operational on-chain minting

Polished UX → Smooth, fast, responsive

Technical Completeness → IPFS + Smart Contract + Wallet integration

Scalable Base → Can evolve into a full NFT marketplace or badge system
