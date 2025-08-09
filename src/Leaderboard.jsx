import React, { useEffect, useState } from "react";

const NFT_CA = "0xC562c59452c2C721d22353dE428Ec211C4069f60"; // CA NFT CampGenesis
const BLOCKSCOUT_API = `https://basecamp.cloud.blockscout.com/api?module=account&action=tokennfttx&contractaddress=${NFT_CA}&sort=asc`;

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [walletRanks, setWalletRanks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMintData = async () => {
      setLoading(true);
      try {
        const res = await fetch(BLOCKSCOUT_API);
        const data = await res.json();

        if (data.status !== "1" || !data.result) {
          throw new Error("Invalid API response from Blockscout");
        }

        const walletMap = {};
        data.result.forEach((tx) => {
          const wallet = tx.to.toLowerCase();
          walletMap[wallet] = (walletMap[wallet] || 0) + 1;
        });

        const sorted = Object.entries(walletMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20); // top 20

        setWalletRanks(sorted);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMintData();
  }, []);

  const getRankEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-camp bg-cover bg-center p-6 text-white">
      <div className="bg-black/60 p-6 rounded-xl max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🏅 Camp Genesis Leaderboard</h1>
        {loading ? (
          <p className="text-center">⏳ Loading leaderboard...</p>
        ) : error ? (
          <p className="text-red-400 text-center">❌ {error}</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/30">
                <th className="py-2">Rank</th>
                <th className="py-2">Wallet</th>
                <th className="py-2">NFTs Minted</th>
              </tr>
            </thead>
            <tbody>
              {walletRanks.map(([wallet, count], idx) => (
                <tr
                  key={wallet}
                  className="border-b border-white/20 hover:bg-white/10 transition"
                >
                  <td className="py-2 px-2">{getRankEmoji(idx + 1)}</td>
                  <td className="py-2 px-2">
                    <a
                      href={`https://basecamp.cloud.blockscout.com/address/${wallet}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-300"
                    >
                      {wallet.slice(0, 6)}...{wallet.slice(-4)}
                    </a>
                  </td>
                  <td className="py-2 px-2 font-bold">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
