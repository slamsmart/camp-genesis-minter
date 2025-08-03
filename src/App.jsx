import React, { useState, useEffect } from "react";
import { useAuth, CampModal } from "@campnetwork/origin/react";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Contract } from "ethers";


const ERC721ABI = ["function tokenURI(uint256 tokenId) view returns (string)"];

export default function App() {
  const { origin } = useAuth();
  const [wallet, setWallet] = useState("");
  const [nftName, setNftName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [status, setStatus] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [txs, setTxs] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [addressToCheck, setAddressToCheck] = useState("");
  const [loadingTx, setLoadingTx] = useState(false);
  const [loadingNFT, setLoadingNFT] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreTxs, setHasMoreTxs] = useState(true);
  const txsPerPage = 5;

  const [nftsToShow, setNftsToShow] = useState(5);

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
      setNfts([]);
      setNftsToShow(5);
    } catch {
      setStatus("❌ Wallet connection failed.");
    }
  };

  const triggerOriginModal = () => {
    const el = document.querySelector(".buttons-module_connect-button__CJhUa") ||
      document.querySelector("[class*='connect-button']");
    if (el) el.click();
    else setStatus("Error: Origin button not found.");
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

  // Logika fetch NFT yang diperbarui
  useEffect(() => {
    if (wallet && activePage === "gallery") {
      setLoadingNFT(true);
      fetch(`https://basecamp.cloud.blockscout.com/api?module=account&action=tokennfttx&address=${wallet}`)
        .then(res => res.json())
        .then(async (data) => {
          if (data.status === "1" && data.result) {
            const ownedNFTs = {};
            
            data.result.forEach(tx => {
              const tokenId = tx.tokenID;
              const contractAddress = tx.contractAddress;
              const uniqueKey = `${contractAddress}-${tokenId}`;
              
              if (tx.to.toLowerCase() === wallet.toLowerCase()) {
                  ownedNFTs[uniqueKey] = tx;
              }
              if (tx.from.toLowerCase() === wallet.toLowerCase()) {
                  delete ownedNFTs[uniqueKey];
              }
            });

            const nftList = Object.values(ownedNFTs);
            const provider = new JsonRpcProvider("https://rpc.basecamp.t.raas.gelato.cloud");
            const enriched = await Promise.all(nftList.map(async (tx) => {
              try {
                const contract = new ethers.Contract(tx.contractAddress, ERC721ABI, provider);
                const tokenURI = await contract.tokenURI(tx.tokenID);
                const meta = await fetch(tokenURI).then(r => r.json());
                return { ...tx, image: meta.image, tokenName: meta.name };
              } catch (e) {
                console.warn("Metadata fetch failed", e);
                return { ...tx, image: null };
              }
            }));
            
            enriched.sort((a, b) => b.timeStamp - a.timeStamp); 
            setNfts(enriched);
          } else {
            setNfts([]);
            console.error("NFT fetch failed", data.message);
          }
        })
        .catch(err => {
          setNfts([]);
          console.error("NFT error", err);
        })
        .finally(() => setLoadingNFT(false));
    }
  }, [wallet, activePage]);
  
  useEffect(() => {
    if (activePage !== "transactions") {
      setCurrentPage(1);
      setTxs([]);
      setHasMoreTxs(true);
    }
    if (activePage !== "gallery") {
      setNftsToShow(5);
    }
  }, [activePage]);

  const handleLoadMoreNfts = () => {
    setNftsToShow(prev => prev + 5);
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
            <div onClick={() => setActivePage("home")}>🏠 Home</div>
            <div onClick={() => setActivePage("gallery")}>🖼️ Gallery</div>
            <div onClick={() => setActivePage("transactions")}>📜 Transactions</div>
            <div onClick={() => setActivePage("about")}>ℹ️ About</div>
          </div>
        )}
      </div>

      {/* Origin Connect Button */}
      <div className="absolute top-4 right-4 z-50">
        <CampModal />
      </div>

      <header className="relative z-10 text-white text-center py-10 px-4">
        <h1 className="text-7xl font-grotesk font-bold text-white drop-shadow-[0_0_9px_black] flex items-center justify-center gap-4 mb-6">
         Camp Genesis Minter</h1>
        <p className="text-3xl font-inter font-bold text-white drop-shadow-[0_0_15px_black] mb-4">
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
          <div className="w-full max-w-3xl bg-white/30 backdrop-blur-md p-6 rounded-xl shadow-md space-y-6 flex flex-col items-center">
            <div className="w-full flex flex-col md:flex-row justify-center items-center gap-4">
              <input
                type="text"
                placeholder="NFT Name"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                className="w-full md:w-auto px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Creator Name"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                className="w-full md:w-auto px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={triggerOriginModal}
                disabled={!wallet || !nftName || !creatorName}
                className={`w-full md:w-auto px-4 py-2 rounded-lg text-white font-semibold transition ${
                  !wallet || !nftName || !creatorName
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                🪄 Upload & Mint
              </button>
            </div>
            {status && (
              <p className="text-sm text-center text-green-700 font-medium">{status}</p>
            )}
          </div>
        )}

        {activePage === "gallery" && (
          <div className="w-full max-w-4xl bg-white/60 backdrop-blur p-6 rounded-xl shadow-md text-black">
            <h2 className="text-xl font-bold mb-4">📸 NFT Gallery</h2>
            {!wallet ? (
              <p className="text-sm">🔌 Connect your wallet to view your NFTs.</p>
            ) : (
              <>
                {loadingNFT ? (
                  <p className="text-sm italic">Loading NFTs... (this may take a moment due to fetching metadata)</p>
                ) : (
                  nfts.length === 0 ? (
                    <p>No NFTs found for this wallet.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {nfts.slice(0, nftsToShow).map((nft, idx) => (
                          <div key={idx} className="border p-4 rounded-lg bg-white/80">
                            {nft.image && (
                              <img src={nft.image} alt="NFT" className="w-full h-48 object-cover rounded mb-2" />
                            )}
                            <p className="font-semibold text-sm">🖼 Token: {nft.tokenName}</p>
                            <p className="text-xs">🎨 ID: {nft.tokenID}</p>
                            <p className="text-xs">📦 Contract: {nft.contractAddress.slice(0, 10)}...</p>
                            <a
                              href={`https://basecamp.cloud.blockscout.com/token/${nft.contractAddress}?a=${nft.tokenID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline text-xs"
                            >
                              View on Explorer
                            </a>
                          </div>
                        ))}
                      </div>
                      {nfts.length > nftsToShow && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={handleLoadMoreNfts}
                            className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Load More
                          </button>
                        </div>
                      )}
                    </>
                  )
                )}
              </>
            )}
          </div>
        )}

        {activePage === "transactions" && (
          <div className="w-full max-w-4xl bg-white/60 backdrop-blur p-6 rounded-xl shadow-md text-black">
            <h2 className="text-xl font-bold mb-4">📜 Transactions</h2>
            {!wallet ? (
              <p className="text-sm">🔌 Connect your wallet to view transactions.</p>
            ) : loadingTx && txs.length === 0 ? (
              <p className="text-sm italic">Loading transactions (this may take a moment depending on the network activity)...</p>
            ) : txs.length === 0 && !loadingTx ? (
              <p>No transactions found for this wallet.</p>
            ) : (
              <>
                <ul className="space-y-2">
                  {txs.map((tx, idx) => (
                    <li key={idx} className="text-sm border-b pb-1">
                      🔁 Hash: <a className="text-blue-600 underline" href={`https://basecamp.cloud.blockscout.com/tx/${tx.hash}`} target="_blank" rel="noreferrer">{tx.hash.slice(0, 12)}...</a>
                    </li>
                  ))}
                </ul>
                {hasMoreTxs && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setCurrentPage(page => page + 1)}
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
              <strong>Camp Genesis Minter</strong> is a lightweight NFT minting dApp built by <strong>slamsmart</strong> present for <strong> Camp Network X Wizz: Builder Bounty</strong> competition.<br /><br />
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

      <footer className="relative z-10 text-center py-4 text-sm text-white bg-black/60">
        &copy; {new Date().getFullYear()} Camp Genesis Minter. All rights reserved.
      </footer>
    </div>
  );
}
