import React, { useState, useEffect } from "react";
import { useAuth, CampModal } from "@campnetwork/origin/react";
import { Web3Provider } from "@ethersproject/providers";
import { Contract, ethers } from "ethers";
import ClaimBadge from "./ClaimBadge";

// ABI yang diperbarui untuk mencakup fungsi safeMint dan fungsi view lainnya
const ERC721ABI = [
  "function safeMint(address to, string memory tokenURI) public",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
];

// Alamat kontrak WIZZCAMP yang baru saja Anda deploy
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
    <p className="mt-2 text-lg italic">⏳ Please wait... fetching data from the network (this may take a moment)</p>
  </div>
);

export default function App() {
  const { origin } = useAuth();
  const [wallet, setWallet] = useState("");
  const [nftName, setNftName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [showClaimBadge, setShowClaimBadge] = useState(false);
  const [txs, setTxs] = useState([]);
  const [addressToCheck, setAddressToCheck] = useState("");
  const [loadingTx, setLoadingTx] = useState(false);
  const [loadingMint, setLoadingMint] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreTxs, setHasMoreTxs] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [lastMintedTxHash, setLastMintedTxHash] = useState(null);
  const txsPerPage = 5;

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
      setCurrentPage(1);
      setHasMoreTxs(true);
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
          "pinata_api_key": import.meta.env.VITE_PINATA_KEY,
          "pinata_secret_api_key": import.meta.env.VITE_PINATA_SECRET,
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
        attributes: [
          { trait_type: "Creator", value: creatorName },
        ],
      };

      const metadataResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "pinata_api_key": import.meta.env.VITE_PINATA_KEY,
          "pinata_secret_api_key": import.meta.env.VITE_PINATA_SECRET,
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
      console.error("IPFS upload failed:", error);
      setStatus(`❌ Failed to upload to IPFS: ${error.message}`);
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

    try {
      const tokenURI = tokenURIOverride || await uploadToIPFS(file);
      
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

      setStatus(`🎉 NFT successfully minted! View on explorer: https://basecamp.cloud.blockscout.com/tx/${transaction.hash}`);
      setNftName("");
      setCreatorName("");
      setFile(null);
      setLastMintedTxHash(transaction.hash);

    } catch (error) {
      console.error("Minting failed:", error);
      setStatus(`❌ Minting failed: ${error.message || "Something went wrong."}`);
    } finally {
      setLoadingMint(false);
    }
  };

  useEffect(() => {
    if (addressToCheck && activePage === "transactions") {
      setLoadingTx(true);
      const offset = (currentPage - 1) * txsPerPage;
      fetch(`https://basecamp.cloud.blockscout.com/api?module=account&action=txlist&address=${addressToCheck}&sort=desc&offset=${offset}&limit=${txsPerPage}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === "1" && data.result) {
            setTxs(prevTxs => [...prevTxs, ...data.result]);
            if (data.result.length < txsPerPage) {
              setHasMoreTxs(false);
            }
          } else {
            setTxs([]);
            setHasMoreTxs(false);
            console.error("Gagal ambil transaksi", data.message);
          }
        })
        .catch(err => {
          setTxs([]);
          setHasMoreTxs(false);
          console.error("Fetch error", err);
        })
        .finally(() => setLoadingTx(false));
    }
  }, [addressToCheck, activePage, currentPage]);

  useEffect(() => {
    if (activePage !== "transactions") {
      setCurrentPage(1);
      setTxs([]);
      setHasMoreTxs(true);
    }
  }, [activePage]);

  const handleLoadMoreTxs = () => {
    setCurrentPage(page => page + 1);
  };
  
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-start gap-10 bg-camp bg-cover bg-center bg-no-repeat font-sans">
      <div className="absolute inset-0 bg-black/30 z-0" />
      
      {/* Menu Button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="bg-white text-black px-4 py-2 rounded shadow-md"
        >
          ☰ Menu
        </button>
        {showMenu && (
          <div className="mt-2 bg-white text-black rounded shadow-md p-3 space-y-2">
            <div onClick={() => { setActivePage("home"); setShowMenu(false); }} className="cursor-pointer hover:bg-gray-200 p-1 rounded">🏠 Home</div>
            <div onClick={() => { setShowClaimBadge(true); setShowMenu(false); }} className="cursor-pointer hover:bg-gray-200 p-1 rounded">🏆 Claim Badge</div>
            <div onClick={() => { setActivePage("transactions"); setShowMenu(false); }} className="cursor-pointer hover:bg-gray-200 p-1 rounded">📜 Transactions</div>
            <div onClick={() => { setActivePage("about"); setShowMenu(false); }} className="cursor-pointer hover:bg-gray-200 p-1 rounded">ℹ️ About</div>
          </div>
        )}
      </div>

      {/* Origin Connect Button */}
      <div className="absolute top-4 right-4 z-50">
        <CampModal />
      </div>

      <header className="relative z-10 text-white text-center pt-8 pb-10 px-4">
        <h1 className="text-8xl font-grotesk font-bold text-white drop-shadow-[0_0_9px_black] flex items-center justify-center gap-4 mb-6">
          Camp Genesis Minter
        </h1>
        <p className="text-4xl font-inter font-bold text-white drop-shadow-[0_0_15px_black] mb-4">
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
          <p className="mt-4 text-sm text-white font-mono">
            🔗 {wallet.slice(0, 6)}...{wallet.slice(-4)}
          </p>
        )}
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-6">
        {activePage === "home" && (
          <div className="w-full max-w-5xl bg-white/30 backdrop-blur-md p-6 rounded-xl shadow-md space-y-6 flex flex-col items-center">
            {loadingMint ? (
              <LoadingSpinner />
            ) : (
              <div className="w-full flex flex-col lg:flex-row justify-center items-center gap-6">
                 {previewUrl && (
                  <div className="w-32 h-32 sm:w-48 sm:h-48 p-2 rounded-xl border-4 border-white/50 bg-white/10 flex items-center justify-center overflow-hidden">
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
                      className="w-full md:w-auto px-4 py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Creator Name"
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      className="w-full md:w-auto px-4 py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-full flex flex-col sm:flex-row sm:gap-4 gap-2 justify-center items-center">
                    <label htmlFor="file-upload" className="cursor-pointer w-full px-4 sm:px-6 py-3 text-sm sm:text-base rounded-lg text-white font-semibold transition bg-gray-600 hover:bg-gray-700 text-center">
                      📁 {file ? file.name.slice(0, 20) + '...' : "Upload File"}
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => mintNFT()}
                      disabled={!wallet || !nftName || !creatorName || !file || loadingMint}
                      className={`w-full px-4 sm:px-6 py-3 text-sm sm:text-base rounded-lg text-white font-semibold transition ${
                        !wallet || !nftName || !creatorName || !file || loadingMint
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      🪄 Upload & Mint
                    </button>
                  </div>
                </div>
              </div>
            )}
            {status && (
              <p className="mt-2 text-sm text-center text-black font-medium">{status}</p>
            )}
          </div>
        )}

        {activePage === "transactions" && (
          <div className="w-full max-w-4xl bg-white/60 backdrop-blur p-6 rounded-xl shadow-md text-black">
            <h2 className="text-xl font-bold mb-4">📜 Transactions</h2>
            {!wallet ? (
              <p className="text-sm">🔌 Connect your wallet to view transactions.</p>
            ) : loadingTx && txs.length === 0 ? (
              <p className="text-sm italic">Loading transactions... (This may take a moment)</p>
            ) : txs.length === 0 && !loadingTx ? (
              <p>No transactions found for this wallet.</p>
            ) : (
              <>
                <ul className="space-y-2">
                  {txs.map((tx, idx) => (
                    <li key={idx} className={`text-sm border-b pb-1 ${tx.hash === lastMintedTxHash ? 'bg-yellow-200 text-black p-2 rounded' : ''}`}>
                      🔁 Hash: <a className="text-blue-600 underline" href={`https://basecamp.cloud.blockscout.com/tx/${tx.hash}`} target="_blank" rel="noreferrer">{tx.hash.slice(0, 12)}...</a>
                    </li>
                  ))}
                </ul>
                {hasMoreTxs && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleLoadMoreTxs}
                      disabled={loadingTx}
                      className={`px-4 py-2 rounded-md text-sm text-white transition ${
                        loadingTx ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {loadingTx ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {activePage === "about" && (
          <div className="w-full max-w-3xl bg-white/80 text-black backdrop-blur p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4">ℹ️ About Camp Genesis Minter</h2>
            <p className="text-sm leading-relaxed">
              <strong>Camp Genesis Minter</strong> is a lightweight NFT minting dApp built by <strong>slamsmart</strong> present for <strong> Camp Network X Wizz: Builder Bounty</strong> contest.<br /><br />
              This project aims to provide a seamless and fully on-chain experience for minting, tracking, and showcasing NFTs on the Camp Network (BaseCAMP Testnet).<br /><br />
              Built with:
              <ul className="list-disc ml-5 mt-1">
                <li>🛠 Origin SDK for wallet interaction and NFT minting</li>
                <li>🧩 React + Vite + Tailwind for UI</li>
                <li>🛰 BlockScout API integration for real-time transaction & NFT gallery fetch</li>
              </ul>
              <br />
              The mission is simple:<br />
              <em><q>Empower builders. Inspire creativity. On-chain. Forever.</q></em><br /><br />
              We hope this tool benefits the community and serves as inspiration for future Camp Network applications. Feel free to use, fork, and expand it!
            </p>
          </div>
        )}
      </main>

      {showClaimBadge && (
        <ClaimBadge
          wallet={wallet}
          nftContractAddress={CA_ADDRESS}
          badgeContractAddress={CA_ADDRESS}
          onClose={() => setShowClaimBadge(false)}
          onMintBadge={(tokenURI) => {
            mintNFT(tokenURI).then(() => {
              // Redirect to transactions page after a successful mint
              setActivePage("transactions");
            });
          }}
          badgeCIDs={BADGE_CIDS}
        />
      )}

      <footer className="relative z-10 text-center py-4 text-sm text-white bg-black/60">
        &copy; {new Date().getFullYear()} Camp Genesis Minter. All rights reserved.
      </footer>
    </div>
  );
}
