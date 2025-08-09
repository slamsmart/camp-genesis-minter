import React, { useState, useEffect } from "react";

const MyTransactions = ({ userAddress }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userAddress) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Replace with the actual API endpoint for fetching transactions
      const blockscoutApiUrl = `https://basecamp.cloud.blockscout.com/api?module=account&action=txlist&address=${userAddress}&sort=desc`;

      try {
        const response = await fetch(blockscoutApiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Limit display to the first 3 transactions
        const limitedTransactions = data.result.slice(0, 3);
        setTransactions(limitedTransactions);
      } catch (e) {
        console.error("Error fetching transactions:", e);
        setError("Failed to fetch transactions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userAddress]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl bg-white/60 backdrop-blur p-4 sm:p-6 rounded-xl shadow-md text-black text-center">
        Loading your transactions...
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

  if (transactions.length === 0) {
    return (
      <div className="w-full max-w-6xl bg-white/60 backdrop-blur p-4 sm:p-6 rounded-xl shadow-md text-black text-center">
        No transactions found for this address.
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl bg-white/60 backdrop-blur p-4 sm:p-6 rounded-xl shadow-md text-black">
      <h2 className="text-xl font-bold mb-4 text-center">📜 My Recent Transactions</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction Hash
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                From
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                To
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => (
              <tr key={tx.hash}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <a href={`https://basecamp.cloud.blockscout.com/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a href={`https://basecamp.cloud.blockscout.com/address/${tx.from}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tx.to ? (
                    <a href={`https://basecamp.cloud.blockscout.com/address/${tx.to}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                    </a>
                  ) : (
                    'Contract Creation'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tx.value ? `${parseInt(tx.value) / 1e18} ETH` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 text-center">
        <a
          href={`https://basecamp.cloud.blockscout.com/address/${userAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-md text-sm text-white transition bg-blue-600 hover:bg-blue-700"
        >
          View All Transactions on BlockScout
        </a>
      </div>
    </div>
  );
};

export default MyTransactions;
