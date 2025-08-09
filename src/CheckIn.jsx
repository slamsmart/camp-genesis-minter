import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

// ✅ ABI & Contract Address (update CA sesuai punyamu)
const CHECKIN_ABI = [
  "function checkIn() external",
  "function getLastCheckIn(address user) view returns (uint256)"
];
const CHECKIN_CA = "0x6061Fb861b6A021aB6A4A47B5350C4BbD044331F"; // ← Ganti kalau perlu

export default function CheckIn({ wallet }) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastCheckInTime, setLastCheckInTime] = useState(null);

  // ✅ Ambil waktu check-in terakhir
  const fetchLastCheckInTime = async () => {
    if (!wallet) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CHECKIN_CA, CHECKIN_ABI, provider);
      const ts = await contract.getLastCheckIn(wallet);
      setLastCheckInTime(Number(ts));
    } catch (err) {
      console.error("❌ Fetch check-in time failed:", err);
      setStatus("❌ Failed to fetch last check-in time.");
    }
  };

  // ✅ Eksekusi transaksi check-in
  const handleCheckIn = async () => {
    if (!wallet) {
      setStatus("❌ Wallet not connected.");
      return;
    }

    setLoading(true);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CHECKIN_CA, CHECKIN_ABI, signer);

    try {
      const now = Math.floor(Date.now() / 1000);
      const lastCheckIn = await contract.getLastCheckIn(wallet);

      if (lastCheckIn.toNumber && now - lastCheckIn.toNumber() < 86400) {
        setStatus("⚠️ You already checked in today.");
        return;
      }
      await new Promise(r => setTimeout(r, 1000));
      const tx = await contract.checkIn();
      await tx.wait();

      console.log("TX succesfull hash:", tx.hash);
      setStatus("✅ Check-in successful!");
      setLastCheckInTime(now);
    } catch (error) {
      const msg =
        error?.error?.data?.message || error?.data?.message || error?.message;
      console.error("Check-in error:", msg);
      setStatus(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto-fetch saat wallet berubah
  useEffect(() => {
    if (wallet) fetchLastCheckInTime();
  }, [wallet]);

  // ✅ Komponen UI (tombol dan status)
  return (
    <div className="bg-white/20 p-6 rounded-lg text-white text-center max-w-lg mx-auto space-y-4">
      <h2 className="text-2xl font-bold">🏠 Daily Check-in</h2>

      <button
        onClick={handleCheckIn}
        disabled={loading}
        className={`w-full px-4 py-3 rounded-lg font-semibold ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "⏳ Checking in..." : "Check In Now"}
      </button>

      {lastCheckInTime !== null && (
        <p className="text-sm">
          Last check-in:{" "}
          {lastCheckInTime === 0
            ? "Never"
            : new Date(lastCheckInTime * 1000).toLocaleString()}
        </p>
      )}

      {status && <p className="text-sm mt-2">{status}</p>}
    </div>
  );
}
