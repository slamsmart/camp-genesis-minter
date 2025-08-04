# 🎕️ Camp Genesis Minter

> **"Start Your Trail on Camp – Mint Today"**

**Camp Genesis Minter** is a lightweight, fully on-chain NFT minting dApp built for the [Camp Network](https://camp.network) (BaseCAMP Testnet), submitted for the **Wizz x Camp Builder Bounty**.

---

## 🌟 What It Does

* Connect wallet via **Origin SDK**
* Upload image + input NFT name & creator name
* Mint NFTs using **Wizz Camp NFT (WCNFT)** contract
* View owned NFTs in a responsive gallery (with live metadata rendering)
* See wallet transactions (fetched from Blockscout API)

---

## 🧠 How It Works

* File is uploaded to **IPFS via Pinata**
* Metadata JSON is generated and pinned
* NFT is minted via `mint(to, tokenURI)` using your connected wallet
* Gallery fetches NFT data via `tokenURI()` and displays image, name, and contract details

---

## 🖼️ NFT Gallery Behavior

The gallery only supports **metadata-based NFTs**, i.e., NFTs with:

* ✅ A proper `tokenURI` pointing to IPFS
* ✅ Metadata JSON containing `image`, `name`, etc.

> NFTs **must be minted via this app's form** to appear in the gallery.

---

## ⚙️ Tech Stack

* **React + Vite + Tailwind**
* **Origin SDK** for wallet connect
* **Pinata** for IPFS storage
* **ethers.js** for contract interaction
* **Blockscout API** for real-time tx & NFT data

---

## 🚀 Live Demo

👉 [https://camp-genesis-minter.vercel.app](https://camp-genesis-minter.vercel.app)

---

## 🔗 Smart Contract Info

* **Name:** Wizz Camp NFT (WCNFT)
* **Address:** `0x7648e0877AB3bcc71bA26797C993A409D404D264`
* **Chain:** BaseCAMP Testnet (`20240901`)

---
🧭 Why This Matters
In a sea of on-chain apps, Camp Genesis Minter is laser-focused:
Just connect, create, and own your trail on-chain — no fluff.

Built for creators who want simplicity, and for ecosystems that value real NFT infra.

No dependency on centralized UI.
No broken metadata.
No excuses.

This is what minting on Camp should feel like.
Fast. Clean. Yours.

## 🙌 Built by

**SLAMSMART**
No BS. Just on-chain minting that works.
