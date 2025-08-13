// App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth, CampModal } from "@campnetwork/origin/react";
import { ethers } from "ethers";
import ClaimBadge from "./ClaimBadge";
import Leaderboard from "./Leaderboard";
import CheckIn from "./CheckIn";
import MyCollection from "./MyCollection";
import MyTransactions from "./MyTransactions";

/* ===================== CONFIG ===================== */
const ERC721ABI = [
  "function safeMint(address to, string tokenURI) public",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
];
const CA_ADDRESS = "0xC562c59452c2C721d22353dE428Ec211C4069f60";
const BLOCKSCOUT_BASE = "https://basecamp.cloud.blockscout.com";
const BADGE_CIDS = {
  "Bronze Badge": "bafkreie46vvx5hbznsqsnbxmzq6jbvtjbe6bvyjwdobxfbxniyemg5t2w4",
  "Silver Badge": "bafkreigq5hjcu5gp6roze7elsxxps4c5xndymohrtzteua7osp5m4olqzq",
  "Gold Badge": "bafkreia35spnm2ztymftss37ddvnzufqlrejxcsloaoqaenhd7zjgxfiue",
  "Platinum Badge": "bafkreif2pgkafeua7otq6fohialgaxzdknerokgfu2nhel7yu5q4dxdv3a",
  "Diamond Badge": "bafkreia6q3egtsmh7vtwpp5vgig4oucsrw62xccohfu47ofxmn6j2fkn5y",
};
const THEME_IMAGES = {
  light: "/bg-light.png",
  dark: "/bg-dark.png",
};

/* ===================== UTILS ===================== */
const ipfsToHttp = (uri) => {
  if (!uri) return null;
  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    return [
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
    ];
  }
  return [uri];
};

async function fetchJsonWithFallback(urls) {
  for (const u of urls) {
    try {
      const r = await fetch(u, { cache: "no-store" });
      if (r.ok) return await r.json();
    } catch (_) {}
  }
  throw new Error("Metadata fetch failed on all gateways");
}

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-8 text-black dark:text-white">
    <svg
      className="animate-spin h-10 w-10 text-gray-500 dark:text-gray-300"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="img"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.91l3-2.619z"
      ></path>
    </svg>
    <p className="mt-2 text-lg italic">⏳ Please wait...</p>
  </div>
);

/* ===================== APP ===================== */
export default function App() {
  const { origin } = useAuth();
  const [wallet, setWallet] = useState("");
  const [nftName, setNftName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [loadingMint, setLoadingMint] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [lastMintedTxHash, setLastMintedTxHash] = useState(null);
  const [lastMintedNft, setLastMintedNft] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const menuRef = useRef(null);

  /* ===== Theme bootstrapping ===== */
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      setDarkMode(saved === "dark");
    } else {
      const prefersDark = window.matchMedia?.(
        "(prefers-color-scheme: dark)"
      ).matches;
      setDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const currentHero = darkMode ? THEME_IMAGES.dark : THEME_IMAGES.light;
  const toggleTheme = () => setDarkMode((v) => !v);

  /* ===== Wallet events ===== */
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accs) => setWallet(accs?.[0] ?? "");
    const onChainChanged = () => window.location.reload();
    window.ethereum.on?.("accountsChanged", onAccounts);
    window.ethereum.on?.("chainChanged", onChainChanged);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAccounts);
      window.ethereum?.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus("❌ Please install MetaMask.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWallet(accounts[0]);
      setStatus("✅ Wallet connected!");
    } catch {
      setStatus("❌ Wallet connection failed.");
    }
  };

  /* ===== Close menu on outside click / Esc ===== */
  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setShowMenu(false);
    };
    const onEsc = (e) => e.key === "Escape" && setShowMenu(false);
    if (showMenu) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showMenu]);

  /* ===== File handling ===== */
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setStatus("❌ File must be an image.");
      return;
    }
    const MAX = 10 * 1024 * 1024; // 10MB
    if (f.size > MAX) {
      setStatus("❌ File too large (max 10MB).");
      return;
    }
    setFile(f);
  };

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /* ===== IPFS Upload ===== */
  const uploadToIPFS = async (file) => {
    setStatus("⏳ Uploading file to IPFS...");
    const API_KEY = import.meta.env.VITE_PINATA_KEY;
    const API_SECRET = import.meta.env.VITE_PINATA_SECRET;
    if (!API_KEY || !API_SECRET) {
      throw new Error(
        "Pinata API keys missing. Set VITE_PINATA_KEY & VITE_PINATA_SECRET"
      );
    }
    const formData = new FormData();
    formData.append("file", file);
    const fileRes = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          pinata_api_key: API_KEY,
          pinata_secret_api_key: API_SECRET,
        },
        body: formData,
      }
    );
    if (!fileRes.ok) {
      const t = await fileRes.text();
      throw new Error(`Pinata file upload failed: ${fileRes.status} - ${t}`);
    }
    const fileJson = await fileRes.json();
    const fileUrl = `ipfs://${fileJson.IpfsHash}`;
    // metadata
    const metadata = {
      name: nftName,
      description: `An NFT by ${creatorName}`,
      image: fileUrl,
      attributes: [{ trait_type: "Creator", value: creatorName }],
    };
    setStatus("⏳ Uploading metadata to IPFS...");
    const metaRes = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: API_KEY,
          pinata_secret_api_key: API_SECRET,
        },
        body: JSON.stringify(metadata),
      }
    );
    if (!metaRes.ok) {
      const t = await metaRes.text();
      throw new Error(
        `Pinata metadata upload failed: ${metaRes.status} - ${t}`
      );
    }
    const metaJson = await metaRes.json();
    return `ipfs://${metaJson.IpfsHash}`;
  };

  /* ===== Mint ===== */
  const provider = useMemo(() => {
    if (!window.ethereum) return null;
    return new ethers.providers.Web3Provider(window.ethereum);
  }, []);

  const signer = useMemo(() => {
    try {
      return provider?.getSigner();
    } catch {
      return null;
    }
  }, [provider]);

  const contract = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(CA_ADDRESS, ERC721ABI, signer);
  }, [signer]);

  const mintNFT = async (tokenURIOverride) => {
    if (!wallet) {
      setStatus("❌ Connect your wallet first.");
      return;
    }
    if (!tokenURIOverride && (!nftName || !creatorName || !file)) {
      setStatus("❌ Fill all fields or provide a tokenURI.");
      return;
    }
    if (!contract) {
      setStatus("❌ Contract not ready.");
      return;
    }
    setLoadingMint(true);
    setStatus("⏳ Preparing to mint...");
    try {
      const tokenURI = tokenURIOverride || (await uploadToIPFS(file));
      setStatus(`✅ Metadata ready. Confirm the transaction...`);
      const tx = await contract.safeMint(wallet, tokenURI);
      setStatus(`⏳ Transaction sent. Waiting confirmation… Tx: ${tx.hash}`);
      await tx.wait(1);
      setLastMintedTxHash(tx.hash);
      setStatus(`🎉 NFT minted!`);
      const meta = await fetchJsonWithFallback(ipfsToHttp(tokenURI));
      const imageUrls = ipfsToHttp(meta.image);
      setLastMintedNft({
        name: meta.name,
        creator:
          meta.attributes?.find((a) => a.trait_type === "Creator")?.value ||
          "Unknown",
        imageUrl: imageUrls[0],
        txHash: tx.hash,
      });
    } catch (error) {
      console.error(error);
      setStatus(`❌ Minting failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoadingMint(false);
    }
  };

  const resetMintingState = () => {
    setNftName("");
    setCreatorName("");
    setFile(null);
    setPreviewUrl(null);
    setStatus("");
    setLastMintedNft(null);
    setLastMintedTxHash(null);
  };

  /* ===================== UI ===================== */
  return (
    <div
      className={`relative min-h-screen w-full flex flex-col justify-start gap-10 font-sans ${
        darkMode ? "dark text-white" : "text-black"
      }`}
    >
      {/* Background image layer */}
      <div
        className="absolute inset-0 -z-10 bg-center bg-cover bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url(${currentHero})` }}
        aria-hidden="true"
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* All content */}
      <div className="relative z-30">
        {/* Top Bar */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-4" ref={menuRef}>
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="bg-white text-black dark:bg-gray-700 dark:text-white px-4 py-2 rounded shadow-md"
              aria-haspopup="menu"
              aria-expanded={showMenu}
            >
              ☰ Menu
            </button>
            {showMenu && (
              <div className="absolute top-16 left-4 mt-2 bg-white dark:bg-gray-700 text-black dark:text-white rounded shadow-md p-3 space-y-2 z-50">
                {[
                  ["home", "🏠 Home"],
                  ["checkIn", "📍 Check In"],
                  ["claim", "🏆 Claim Badge"],
                  ["mytransactions", "📜 My Transactions"],
                  ["leaderboard", "🏅 Leaderboard"],
                  ["mycollection", "🖼️ My Collection"],
                  ["about", "ℹ️ About"],
                ].map(([key, label]) => (
                  <div
                    key={key}
                    onClick={() => {
                      setActivePage(key);
                      setShowMenu(false);
                    }}
                    className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                    role="menuitem"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (setActivePage(key), setShowMenu(false))
                    }
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-4 py-2 rounded shadow-md"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
           <button
  onClick={() => setActivePage("claim")}
  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded-md shadow-md text-sm sm:text-base transition-colors duration-200"
>
  🏆 Claim Badge
</button>

            <CampModal />
          </div>
        </div>
        {/* Header */}
        <header className="text-white text-center pt-24 pb-10 px-4">
          <h1 class="text-8xl font-extrabold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent drop-shadow-lg">
  Camp Genesis Minter
</h1>

          <p className="text-xl sm:text-3xl font-inter font-bold text-white drop-shadow-[0_0_15px_black] mb-4">
            "Start Your Trail on Camp – Mint Today"
          </p>
          {!wallet ? (
            <button
              onClick={connectWallet}
              className="mt-4 bg-blue-700 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm"
            >
              Connect Wallet
            </button>
          ) : (
            <p className="mt-4 text-sm text-white font-mono" title={wallet}>
              🔗 {wallet.slice(0, 6)}...{wallet.slice(-4)}
            </p>
          )}
        </header>
        {/* Main */}
        <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6">
          {activePage === "home" && (
            <div className="w-full max-w-5xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-md space-y-6 flex flex-col items-center">
              {loadingMint ? (
                <LoadingSpinner />
              ) : lastMintedNft ? (
                <div className="flex flex-col items-center justify-center gap-6 w-full text-black dark:text-white">
                  <div className="w-48 h-48 sm:w-64 sm:h-64 p-2 rounded-xl border-4 border-green-500 bg-white/80 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                    <img
                      src={lastMintedNft.imageUrl}
                      alt={lastMintedNft.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <p className="text-lg sm:text-xl font-bold">
                    🎉 Minting Successful!
                  </p>
                  <p className="text-base sm:text-lg">
                    <strong>NFT:</strong> {lastMintedNft.name}
                  </p>
                  <p className="text-sm">
                    <strong>Creator:</strong> {lastMintedNft.creator}
                  </p>
                  <a
                    href={`${BLOCKSCOUT_BASE}/tx/${lastMintedNft.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-sm text-blue-200 underline"
                  >
                    View Transaction on BlockScout
                  </a>
                  <button
                    onClick={resetMintingState}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm transition"
                  >
                    Mint Another NFT
                  </button>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row justify-center items-center gap-6 w-full">
                  {previewUrl && (
                    <div className="w-32 h-32 sm:w-48 sm:h-48 p-2 rounded-xl border-4 border-white/50 dark:border-gray-500 bg-white/10 dark:bg-gray-800/10 flex items-center justify-center overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="File Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex flex-col items-center justify-center gap-4 w-full">
                    <div className="w-full flex flex-col sm:flex-row sm:gap-4 gap-2 justify-center items-center">
                      <input
                        type="text"
                        placeholder="NFT Name"
                        value={nftName}
                        onChange={(e) => setNftName(e.target.value)}
                        className="w-full px-4 py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                      <input
                        type="text"
                        placeholder="Creator Name"
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        className="w-full px-4 py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>
                    <div className="w-full flex flex-col sm:flex-row sm:gap-4 gap-2 justify-center items-center">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer w-full px-4 sm:px-6 py-3 text-sm sm:text-base rounded-lg text-white font-semibold transition bg-gray-600 hover:bg-gray-700 text-center"
                      >
                        📁{" "}
                        {file
                          ? file.name.length > 24
                            ? file.name.slice(0, 24) + "…"
                            : file.name
                          : "Upload Image"}
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        onClick={() => mintNFT()}
                        disabled={
                          !wallet ||
                          !nftName ||
                          !creatorName ||
                          !file ||
                          loadingMint
                        }
                        className={`w-full px-4 sm:px-6 py-3 text-sm sm:text-base rounded-lg text-white font-semibold transition ${
                          !wallet ||
                          !nftName ||
                          !creatorName ||
                          !file ||
                          loadingMint
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {loadingMint ? "Minting..." : "🪄 Upload & Mint"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {status && (
                <div className="text-center px-4">
                  {status.startsWith("🎉") ? (
                    <p className="text-lg font-bold text-black dark:text-white">
                      {status}
                    </p>
                  ) : status.startsWith("❌") ? (
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {status}
                    </p>
                  ) : (
                    <p className="text-base font-medium text-black dark:text-white">
                      {status}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {activePage === "claim" && (
            <ClaimBadge
              wallet={wallet}
              nftContractAddress={CA_ADDRESS}
              badgeContractAddress={CA_ADDRESS}
              onClose={() => setActivePage("home")}
              onMintBadge={mintNFT}
              badgeCIDs={BADGE_CIDS}
            />
          )}
          {activePage === "leaderboard" && <Leaderboard />}
          {activePage === "checkIn" && <CheckIn wallet={wallet} />}
          {activePage === "mycollection" && (
            <MyCollection userAddress={wallet} />
          )}
          {activePage === "mytransactions" && (
            <MyTransactions userAddress={wallet} />
          )}
        {activePage === "about" && (
          <div className="w-full max-w-3xl bg-white/80 text-black backdrop-blur p-4 sm:p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4">ℹ️ About Camp Genesis Minter</h2>
            <p className="text-sm leading-relaxed">
              <strong>Camp Genesis Minter</strong> is a lightweight NFT minting dApp built by{" "}
              <a href="https://x.com/slamsmart" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                <strong>slamsmart</strong>
              </a>{" "}
              present for{" "}
              <a href="https://x.com/WizzHQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                <strong>Wizz</strong>
              </a>{" "}
              and{" "}
              <a href="https://x.com/campnetworkxyz" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                <strong>Camp Network</strong>
              </a>{" "}
              Builder Bounty contest.<br /><br />
              This project aims to provide a seamless and fully on-chain experience for minting, tracking, and showcasing NFTs on the Camp Network (BaseCAMP Testnet).<br /><br />
              Built with:
              <ul className="list-disc ml-5 mt-1">
                <li>🛠 Origin SDK for wallet interaction and NFT minting</li>
                <li>🧩 React + Vite + Tailwind for UI</li>
                <li>🛰 BlockScout API integration for real-time transaction & NFT gallery fetch</li>
                <li> And all other features that we have developed together!</li>
              </ul>
              <br />
The mission is simple:<br />
<em><q><strong>Empower builders. Inspire creativity. On-chain. Forever.</strong></q></em><br /><br />
              We hope this tool benefits the community and serves as inspiration for future Camp Network applications. Feel free to use, fork, and expand it!<strong></strong>
            </p>
          </div>
          )}
        </main>
        <footer className="text-center py-4 text-sm text-white bg-black/60 dark:bg-gray-800">
          &copy; {new Date().getFullYear()} Camp Genesis Minter. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
