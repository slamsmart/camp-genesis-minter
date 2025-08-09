import React, { useState, useEffect } from 'react';

// Helper function to convert IPFS URI to a valid HTTP URL
const ipfsToHttp = (uri) => {
  if (!uri) return null;
  const ipfsPrefix = "ipfs://";
  if (uri.startsWith(ipfsPrefix)) {
    return `https://gateway.pinata.cloud/ipfs/${uri.slice(ipfsPrefix.length)}`;
  }
  return uri;
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-8 text-black">
    <svg className="animate-spin h-10 w-10 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.91l3-2.619z"></path>
    </svg>
    <p className="mt-2 text-lg italic">Loading your NFTs...</p>
  </div>
);

const MyCollection = ({ userAddress }) => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const contractAddress = '0xC562c59452c2C721d22353dE428Ec211C4069f60';

  useEffect(() => {
    const fetchNfts = async () => {
      if (!userAddress) {
        setNfts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const blockscoutApiUrl = `https://basecamp.cloud.blockscout.com/api/v2/tokens/${contractAddress}/instances?holder_address=${userAddress}`;

      try {
        const response = await fetch(blockscoutApiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Limit display to the first 3 NFTs
        const limitedNfts = data.items.slice(0, 3);
        setNfts(limitedNfts);
      } catch (e) {
        console.error("Error fetching NFTs:", e);
        setError("Failed to fetch NFTs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchNfts();
  }, [userAddress]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl bg-white/60 backdrop-blur p-4 sm:p-6 rounded-xl shadow-md text-black text-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl bg-white/60 backdrop-blur p-4 sm:p-6 rounded-xl shadow-md text-red-600 text-center">
        Error: {error}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="w-full max-w-6xl bg-white/60 backdrop-blur p-4 sm:p-6 rounded-xl shadow-md text-black text-center">
        Anda belum memiliki NFT di koleksi ini.
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl bg-white/60 backdrop-blur p-4 sm:p-6 rounded-xl shadow-md text-black">
      <h2 className="text-xl font-bold mb-4 text-center">🖼️ My Collection (Last 3 NFTs)</h2>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        {nfts.map((nft) => (
          <div key={nft.token_id} className="flex flex-col items-center p-2 border border-gray-300 rounded-lg shadow-sm bg-white/80 transition-transform transform hover:scale-105 w-full sm:w-1/3">
            <div className="w-30 h-30 flex items-center justify-center overflow-hidden rounded-md">
              <img
                src={ipfsToHttp(nft.metadata?.image) || 'https://via.placeholder.com/150'}
                alt={nft.metadata?.name || `NFT #${nft.token_id}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="mt-2 text-center text-sm">
              <p className="font-semibold">{nft.metadata?.name || `NFT #${nft.token_id}`}</p>
              <p className="text-xs text-gray-600">ID: {nft.token_id}</p>
              <p className="text-xs text-gray-600">Creator: {nft.metadata?.attributes?.find(attr => attr.trait_type === "Creator")?.value || "Unknown"}</p>
              <a
                href={`https://basecamp.cloud.blockscout.com/token/${contractAddress}/instance/${nft.token_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-xs mt-1 block"
              >
                View on Blockscout
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <a
          href={`https://basecamp.cloud.blockscout.com/address/${userAddress}/token-inventory?token_type=ERC-721`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-md text-sm text-white transition bg-blue-600 hover:bg-blue-700"
        >
          View more NFTs on Basecamp Cloud Blockscout Explore
        </a>
      </div>
    </div>
  );
};

export default MyCollection;
