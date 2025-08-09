import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

// ABI untuk kontrak NFT (misalnya, untuk memeriksa saldo)
const NFT_CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)"
];

// ABI untuk kontrak Badge (misalnya, untuk memeriksa status klaim)
const BADGE_CONTRACT_ABI = [
  "function safeMint(address to, string memory tokenURI) public",
  "function hasClaimed(address user, uint256 badgeId) view returns (bool)"
];

// Kelayakan untuk setiap badge berdasarkan jumlah NFT yang dimiliki
const badgeEligibility = {
  "Bronze Badge": { id: 1, required: 0 },
  "Silver Badge": { id: 2, required: 3 },
  "Gold Badge": { id: 3, required: 10 },
  "Platinum Badge": { id: 4, required: 50 },
  "Diamond Badge": { id: 5, required: 100 },
};

// Daftar CID IPFS untuk setiap badge
const BADGE_CIDS = {
  "Bronze Badge": "bafkreidtangvsork5ghyxv6sutxojuebimwxq7uz3jfi27y5hu7qa73zau",
  "Silver Badge": "bafkreiat4g4ir7ii5hkww4rhmmcnvdjddhetytxmak2yfxp6lbdqinmg64",
  "Gold Badge": "bafkreicwnzrwsx5cxkl2jgpclpmwqacranxuh6ppsclzpy2nyen5q7v5ea",
  "Platinum Badge": "bafkreigbj6c2bt3rnyk34lhzbvn36l2coqjzl7vgdvgdedmoavgbrsdx3q",
  "Diamond Badge": "bafkreihczfnkcejhmd5lpaerke75efet3ndplg73dkbwbaqhhzyohcslji",
};

export default function ClaimBadge({ wallet, nftContractAddress, badgeContractAddress, onClose, onMintBadge }) {
  const [selectedBadge, setSelectedBadge] = useState("Bronze Badge");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [userNftBalance, setUserNftBalance] = useState(0);
  const [claimedBadges, setClaimedBadges] = useState({});

  useEffect(() => {
    const fetchNftBalance = async () => {
      if (!wallet || !nftContractAddress) return;
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const nftContract = new ethers.Contract(nftContractAddress, NFT_CONTRACT_ABI, provider);
        const balance = await nftContract.balanceOf(wallet);
        setUserNftBalance(balance.toNumber());
      } catch (e) {
        console.error("Failed to fetch NFT balance", e);
        setUserNftBalance(0);
      }
    };

    const checkClaimedStatus = async () => {
      if (!wallet || !badgeContractAddress) return;
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const badgeContract = new ethers.Contract(badgeContractAddress, BADGE_CONTRACT_ABI, provider);
        const results = {};
        for (const [badgeName, { id }] of Object.entries(badgeEligibility)) {
          const hasClaimed = await badgeContract.hasClaimed(wallet, id);
          results[badgeName] = hasClaimed;
        }
        setClaimedBadges(results);
      } catch (e) {
        console.error("Failed to fetch claimed badge status", e);
      }
    };

    fetchNftBalance();
    checkClaimedStatus();
  }, [wallet, nftContractAddress, badgeContractAddress]);

  const handleMint = async () => {
    if (!wallet) {
      setStatus("❌ Please connect your wallet first.");
      return;
    }

    const requiredBalance = badgeEligibility[selectedBadge].required;
    if (userNftBalance < requiredBalance) {
      setStatus(`❌ You need at least ${requiredBalance} NFT(s) to claim the ${selectedBadge}.`);
      return;
    }

    if (claimedBadges[selectedBadge]) {
      setStatus(`❌ You have already claimed the ${selectedBadge}.`);
      return;
    }

    setLoading(true);
    setStatus("⏳ Minting...");

    const tokenURI = `ipfs://${BADGE_CIDS[selectedBadge]}`;
    try {
      // Panggil fungsi mint di komponen induk dan tunggu hingga selesai
      await onMintBadge(tokenURI);

      // Setelah mint berhasil, perbarui status klaim secara lokal
      const updated = { ...claimedBadges };
      updated[selectedBadge] = true;
      setClaimedBadges(updated);
      setStatus(`🎉 ${selectedBadge} claimed successfully!`);

      // Kembali ke halaman home/galeri setelah mint berhasil
      onClose();
    } catch (error) {
      console.error("Badge claim failed:", error);
      setStatus(`❌ Claim failed: ${error.message || "Something went wrong."}`);
    } finally {
      setLoading(false);
    }
  };

  const isEligible = userNftBalance >= badgeEligibility[selectedBadge].required && !claimedBadges[selectedBadge];

  const getLocalImage = (badge) => {
    const key = badge.split(" ")[0].toLowerCase();
    return `/${key}.png`;
  };

  return (
    <div className="fixed top-20 right-6 z-50 bg-white/90 backdrop-blur p-6 rounded-xl shadow-xl w-80 text-black border border-gray-300">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-center w-full">Claim Camp Genesis Badge</h3>
        <button onClick={onClose} className="absolute top-3 right-4 text-sm text-gray-600 hover:text-black">✕</button>
      </div>
      {wallet ? (
        <div className="space-y-3">
          <p className="text-sm text-center text-gray-600">
            You own <strong>{userNftBalance}</strong> NFT{userNftBalance !== 1 && "s"}.
          </p>
          <img
            src={getLocalImage(selectedBadge)}
            alt={`${selectedBadge} Badge`}
            className="w-24 h-24 object-contain mx-auto mb-2"
          />
          <select
            className="w-full mb-3 p-2 border rounded"
            value={selectedBadge}
            onChange={(e) => setSelectedBadge(e.target.value)}
            disabled={loading}
          >
            {Object.keys(badgeEligibility).map((rank) => {
              const isClaimed = claimedBadges[rank];
              const label = isClaimed ? `${rank} ✅ Claimed` : rank;
              return (
                <option key={rank} value={rank}>
                  {label}
                </option>
              );
            })}
          </select>
          {claimedBadges[selectedBadge] ? (
            <button
              disabled
              className="bg-gray-400 text-white px-4 py-2 rounded w-full font-semibold text-center cursor-not-allowed"
            >
              🎉 Already Claimed
            </button>
          ) : (
            <button
              onClick={handleMint}
              disabled={!isEligible || loading}
              className={`text-white px-4 py-2 rounded w-full font-semibold transition text-center ${
                !isEligible || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.91l3-2.619z"></path>
                  </svg>
                  Minting...
                </div>
              ) : (
                "Mint Badge"
              )}
            </button>
          )}
          {status && <p className="mt-2 text-sm text-center text-gray-800">{status}</p>}
          <div className="text-xs text-gray-500 mt-4 text-center">
            🏅 Bronze Badge — ≥ 0 NFT<br />
            🥈 Silver Badge — ≥ 3 NFTs<br />
            🥇 Gold Badge — ≥ 10 NFTs<br />
            💎 Platinum Badge — ≥ 50 NFTs<br />
            🔶 Diamond Badge — ≥ 100 NFTs<br />
            <br />
            <strong>⚠️ You can claim another badge.</strong>.
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-red-500 text-center">Please connect your wallet.</p>
      )}
    </div>
  );
}
