import React, { useState, useEffect } from "react";
import { useAuth, CampModal } from "@campnetwork/origin/react";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Contract, ethers } from "ethers";
import ClaimBadge from "./ClaimBadge";
import Leaderboard from "./Leaderboard";
import CheckIn from "./CheckIn"; // ← HARUS di atas

// ABI yang diperbarui untuk mencakup fungsi safeMint dan fungsi view lainnya
const ERC721ABI = [
  "function safeMint(address to, string memory tokenURI) public",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
];

// Alamat kontrak WIZZCAMP
const CA_ADDRESS = "0xC562c59452c2C721d22353dE428Ec211C4069f60";

// Daftar CID IPFS untuk setiap badge
const BADGE_CIDS = {
  "Bronze Badge": "bafkreie46vvx5hbznsqsnbxmzq6jbvtjbe6bvyjwdobxfbxniyemg5t2w4",
  "Silver Badge": "bafkreigq5hjcu5gp6roze7elsxxps4c5xndymohrtzteua7osp5m4olqzq",
  "Gold Badge": "bafkreia35spnm2ztymftss37ddvnzufqlrejxcsloaoqaenhd7zjgxfiue",
  "Platinum Badge": "bafkreif2pgkafeua7otq6fohialgaxzdknerokgfu2nhel7yu5q4dxdv3a",
  "Diamond Badge": "bafkreia6q3egtsmh7vtwpp5vgig4oucsrw62xccohfu47ofxmn6j2fkn5y",
};

// Komponen Spinner Loading
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-8 text-black">
    <svg className="animate-spin h-10 w-10 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.91l3-2.619z"></path>
    </svg>
    <p className="mt-2 text-lg italic">⏳ Please wait...</p>
  </div>
);

// Helper function untuk konversi URI IPFS
const ipfsToHttp = (uri) => {
  if (!uri) return null;
  const ipfsPrefix = "ipfs://";
  if (uri.startsWith(ipfsPrefix)) {
    return `https://gateway.pinata.cloud/ipfs/${uri.slice(ipfsPrefix.length)}`;
  }
  return uri;
};

export default function App() {
  const { origin } = useAuth();
  const [wallet, setWallet] = useState("");
  const [nftName, setNftName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [txs, setTxs] = useState([]);
  const [addressToCheck, setAddressToCheck] = useState("");
  const [loadingTx, setLoadingTx] = useState(false);
  const [loadingMint, setLoadingMint] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [lastMintedTxHash, setLastMintedTxHash] = useState(null);
  const [lastMintedNft, setLastMintedNft] = useState(null);
  const nftPreviewLimit = 3;
  const txsPreviewLimit = 3;

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus("❌ Please install MetaMask.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(accounts[0]);
      setAddressToCheck(accounts[0]);
      setStatus("✅ Wallet connected!");
      setTxs([]);
    } catch {
      setStatus("❌ Wallet connection failed.");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const uploadToIPFS = async (file) => {
    setStatus("⏳ Uploading file to IPFS...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          pinata_api_key: import.meta.env.VITE_PINATA_KEY,
          pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET,
        },
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata file upload failed: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      const fileUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
      setStatus(`✅ File uploaded to IPFS: ${fileUrl}`);
      const metadata = {
        name: nftName,
        description: `An NFT by ${creatorName}`,
        image: fileUrl,
        attributes: [{ trait_type: "Creator", value: creatorName }],
      };
      const metadataResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: import.meta.env.VITE_PINATA_KEY,
          pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET,
        },
        body: JSON.stringify(metadata),
      });
      if (!metadataResponse.ok) {
        const errorText = await metadataResponse.text();
        throw new Error(`Pinata metadata upload failed: ${metadataResponse.status} - ${errorText}`);
      }
      const metadataData = await metadataResponse.json();
      const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataData.IpfsHash}`;
      setStatus(`✅ Metadata uploaded to IPFS: ${metadataUrl}`);
      return metadataUrl;
    } catch (error) {
      console.error("Minting failed:", error);
      setStatus(`❌ Minting failed: ${error.message || "Something went wrong."}`);
      return null;
    }
  };

  const mintNFT = async (tokenURIOverride) => {
    if (!wallet) {
      setStatus("❌ Please connect your wallet first.");
      return;
    }
    if (!tokenURIOverride && (!nftName || !creatorName || !file)) {
      setStatus("❌ Please fill all fields or provide a token URI.");
      return;
    }
    setLoadingMint(true);
    setStatus("⏳ Preparing to mint your NFT...");
    setLastMintedNft(null);
    try {
      const tokenURI = tokenURIOverride || (await uploadToIPFS(file));
      if (!tokenURI) {
        setLoadingMint(false);
        setStatus("❌ Upload to IPFS failed or returned an invalid URI. Minting aborted.");
        return;
      }
      setStatus(`✅ Metadata created: ${tokenURI}. Please confirm the transaction in your wallet.`);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CA_ADDRESS, ERC721ABI, signer);
      const transaction = await contract.safeMint(wallet, tokenURI);
      setStatus(`⏳ Transaction sent! Waiting for confirmation... Tx Hash: ${transaction.hash}`);
      await transaction.wait();
      setStatus(`🎉 NFT minted! Check out your new NFT below.`);
      setLastMintedTxHash(transaction.hash);
      const metaResponse = await fetch(ipfsToHttp(tokenURI));
      const metaData = await metaResponse.json();
      setLastMintedNft({
        name: metaData.name,
        creator: metaData.attributes?.find((attr) => attr.trait_type === "Creator")?.value || "Unknown",
        imageUrl: ipfsToHttp(metaData.image),
        txHash: transaction.hash,
      });
    } catch (error) {
      console.error("Minting failed:", error);
      setStatus(`❌ Minting failed: ${error.message || "Something went wrong."}`);
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

  useEffect(() => {
    const fetchTxs = async () => {
      if (!addressToCheck || activePage !== "transactions") {
        return;
      }
      setLoadingTx(true);
      try {
        const res = await fetch(`https://basecamp.cloud.blockscout.com/api?module=account&action=txlist&address=${addressToCheck}&sort=desc&limit=${txsPreviewLimit}`);
        const data = await res.json();
        if (data.status === "1" && data.result) {
          setTxs(data.result);
        } else {
          setTxs([]);
          console.error("Failed to fetch transactions:", data.message);
        }
      } catch (err) {
        setTxs([]);
        console.error("Fetch error:", err);
      } finally {
        setLoadingTx(false);
      }
    };
    fetchTxs();
  }, [addressToCheck, activePage, txsPreviewLimit]);

  useEffect(() => {
    if (activePage !== "transactions") {
      setTxs([]);
    }
  }, [activePage]);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-start gap-10 bg-camp bg-cover bg-center bg-no-repeat font-sans">
      <div className="absolute inset-0 bg-black/30 z-0" />
      <div className="relative z-50 flex justify-between items-center p-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowMenu(!showMenu)} className="bg-white text-black px-4 py-2 rounded shadow-md">
            ☰ Menu
          </button>
          {showMenu && (
            <div className="absolute top-16 left-4 mt-2 bg-white text-black rounded shadow-md p-3 space-y-2">
              <div onClick={() => { setActivePage("home"); setShowMenu(false); }} className="cursor-pointer hover:bg-gray-200 p-1 rounded">
                🏠 Home
              </div>
              <div onClick={() => { setActivePage("checkIn"); setShowMenu(false); }} className="cursor-pointer hover:bg-gray-200 p-1 rounded">
                🏠 Check In
              </div>
               <div onClick={() => { setActivePage("claim"); setShowMenu(false); }} className="cursor-pointer hover:bg-gray-200 p-1 rounded">
                🏆 Claim Badge
              </div>
               <div onClick={() => { setActivePage("my-collection"); setShowMenu(false); }} className="cursor-pointer hover:bg-gray-200 p-1 rounded">
                🖼️ My Collection
              </div>
              <div onClick={() => { setActivePage("transactions"); setShowMenu(false); }} className="cursor-pointer hover:bg-gray-200 p-1 rounded">
                📜 Transactions
              </div>
              <div onClick={() => { setActivePage("leaderboard"); setShowMenu(false); }} className="cursor-pointer hover:bg-gray-200 p-1 rounded">
                🏅 Leaderboard
              </div>
              <div onClick={() => { setActivePage("about"); setShowMenu(false); }} className="cursor-pointer hover:bg-gray-200 p-1 rounded">
                ℹ️ About
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActivePage("claim")} className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-md shadow-md text-sm sm:text-base transition-colors duration-200">
            🏆 Claim Badge
          </button>
          <CampModal />
        </div>
      </div>
      <header className="relative z-10 text-white text-center pt-24 pb-10 px-4">
        <h1 className="text-4xl sm:text-6xl font-grotesk font-bold text-white drop-shadow-[0_0_9px_black] mb-2">Camp Genesis Minter</h1>
        <p className="text-xl sm:text-2xl font-inter font-bold text-white drop-shadow-[0_0_15px_black] mb-4">"Start Your Trail on Camp – Mint Today"</p>
        {!wallet ? (
          <button onClick={connectWallet} className="mt-4 bg-blue-700 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm">
            Connect Wallet
          </button>
        ) : (
          <p className="mt-4 text-sm text-white font-mono">🔗 {wallet.slice(0, 6)}...{wallet.slice(-4)}</p>
        )}
      </header>
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 sm:px-6">
        {activePage === "home" && (
          <div className="w-full max-w-5xl bg-white/30 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-md space-y-6 flex flex-col items-center">
            {loadingMint ? (
              <LoadingSpinner />
            ) : lastMintedNft ? (
              <div className="flex flex-col items-center justify-center gap-6 w-full text-black">
                <div className="w-48 h-48 sm:w-64 sm:h-64 p-2 rounded-xl border-4 border-green-500 bg-white/80 flex items-center justify-center overflow-hidden">
                  <img src={lastMintedNft.imageUrl} alt={lastMintedNft.name} className="max-w-full max-h-full object-contain" />
                </div>
                <p className="text-lg sm:text-xl font-bold">🎉 Minting Successful!</p>
                <p className="text-base sm:text-lg">
                  <strong>NFT:</strong> {lastMintedNft.name}
                </p>
                <p className="text-sm">
                  <strong>Creator:</strong> {lastMintedNft.creator}
                </p>
                <a href={`https://basecamp.cloud.blockscout.com/tx/${lastMintedNft.txHash}`} target="_blank" rel="noopener noreferrer" className="mt-2 text-sm text-blue-600 underline">
                  View Transaction on BlockScout
                </a>
                <button onClick={resetMintingState} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm transition">
                  Mint Another NFT
                </button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row justify-center items-center gap-6 w-full">
                {previewUrl && (
                  <div className="w-32 h-32 sm:w-48 sm:h-48 p-2 rounded-xl border-4 border-white/50 bg-white/10 flex items-center justify-center overflow-hidden">
                    <img src={previewUrl} alt="File Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div className="flex flex-col items-center justify-center gap-4 w-full">
                  <div className="w-full flex flex-col sm:flex-row sm:gap-4 gap-2 justify-center items-center">
                    <input type="text" placeholder="NFT Name" value={nftName} onChange={(e) => setNftName(e.target.value)} className="w-full px-4 py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" placeholder="Creator Name" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} className="w-full px-4 py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="w-full flex flex-col sm:flex-row sm:gap-4 gap-2 justify-center items-center">
                    <label htmlFor="file-upload" className="cursor-pointer w-full px-4 sm:px-6 py-3 text-sm sm:text-base rounded-lg text-white font-semibold transition bg-gray-600 hover:bg-gray-700 text-center">
                      📁 {file ? file.name.slice(0, 20) + "..." : "Upload File"}
                    </label>
                    <input id="file-upload" type="file" onChange={handleFileChange} className="hidden" />
                    <button
                      onClick={() => mintNFT()}
                      disabled={!wallet || !nftName || !creatorName || !file || loadingMint}
                      className={`w-full px-4 sm:px-6 py-3 text-sm sm:text-base rounded-lg text-white font-semibold transition ${
                        !wallet || !nftName || !creatorName || !file || loadingMint ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      🪄 Upload & Mint
                    </button>
                  </div>
                </div>
              </div>
            )}
            {status && (
              <div className="text-center px-4">
                {status.startsWith("🎉") ? (
                  <p className="text-lg font-bold text-black">{status}</p>
                ) : status.startsWith("❌") ? (
                  <p className="text-lg font-bold text-red-600">{status}</p>
                ) : (
                  <p className="text-base font-medium text-black">{status}</p>
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
        {wallet &&activePage === "my-collection" && (
       <MyCollection wallet={wallet} />
      )}
        {activePage === "leaderboard" && (
          <Leaderboard />
        )}

        {activePage === "checkIn" && <CheckIn wallet={wallet} />}

        {activePage === "transactions" && (
          <div className="w-full max-w-6xl bg-white/60 backdrop-blur p-4 sm:p-6 rounded-xl shadow-md text-black">
            <h2 className="text-xl font-bold mb-4">📜 Recent Transactions</h2>
            {!addressToCheck ? (
              <p className="text-sm">🔌 Connect your wallet to view your transactions.</p>
            ) : (
              <>
                {loadingTx ? (
                  <div className="flex justify-center items-center h-40">
                    <LoadingSpinner />
                  </div>
                ) : txs.length === 0 ? (
                  <p>No transactions found for this wallet.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="px-4 py-2 text-left text-sm font-semibold">Hash</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold">Type</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold">From</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold">To</th>
                          </tr>
                        </thead>
                        <tbody>
                          {txs.map((tx, idx) => (
                            <tr key={idx} className="border-b border-gray-300">
                              <td className="px-4 py-2 text-xs">
                                <a href={`https://basecamp.cloud.blockscout.com/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                  {tx.hash.slice(0, 8)}...
                                </a>
                              </td>
                              <td className="px-4 py-2 text-xs">{tx.input === "0x" ? "Transfer" : "Contract Call"}</td>
                              <td className="px-4 py-2 text-xs">
                                <a href={`https://basecamp.cloud.blockscout.com/address/${tx.from}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                  {tx.from.slice(0, 8)}...
                                </a>
                              </td>
                              <td className="px-4 py-2 text-xs">
                                <a href={`https://basecamp.cloud.blockscout.com/address/${tx.to}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                  {tx.to.slice(0, 8)}...
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 text-center">
                      <a href={`https://basecamp.cloud.blockscout.com/address/${addressToCheck}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-md text-sm text-white transition bg-blue-600 hover:bg-blue-700">
                        View All Transactions on BlockScout
                      </a>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
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
              <em><q>Empower builders. Inspire creativity. On-chain. Forever.</q></em><br /><br />
              We hope this tool benefits the community and serves as inspiration for future Camp Network applications. Feel free to use, fork, and expand it!
            </p>
          </div>
        )}
      </main>
      <footer className="relative z-10 text-center py-4 text-sm text-white bg-black/60">
        &copy; {new Date().getFullYear()} Camp Genesis Minter. All rights reserved.
      </footer>
    </div>
  );
}
