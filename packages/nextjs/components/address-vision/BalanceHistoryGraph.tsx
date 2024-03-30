import React, { useEffect, useState } from "react";
import { CovalentClient } from "@covalenthq/client-sdk";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { Address } from "viem";

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const BalanceHistoryGraph = ({ address }: { address: Address }) => {
  const [data, setData] = useState([]);
  const [tokensList, setTokensList] = useState([]); // Define tokensList state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = new CovalentClient(process.env.NEXT_PUBLIC_COVALENT_API_KEY as string);

    const fetchDayData = async date => {
      try {
        const res = await client.BalanceService.getHistoricalTokenBalancesForWalletAddress("eth-mainnet", address, {
          date: date,
          nft: false,
          noSpam: true,
        });

        if (res.data && res.data.items) {
          const dayData = res.data.items
            .filter(item => Number(item.balance) > 0)
            .map(item => ({
              token: item.contract_ticker_symbol,
              balance: Number(item.balance) / Math.pow(10, item.contract_decimals),
              quote: item.quote,
            }));

          const totalUSD = dayData.reduce((acc, curr) => acc + curr.quote, 0);

          return {
            date,
            tokens: dayData,
            totalUSD,
          };
        }
      } catch (error) {
        console.error(`Failed to fetch historical token balances for ${date}:`, error);
        return null;
      }
    };

    const getHistoricalTokens = async () => {
      if (!address) return;

      setLoading(true);
      const promises = [];

      for (let i = 0; i <= 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const formattedDate = date.toISOString().split("T")[0];
        promises.push(fetchDayData(formattedDate));
      }

      Promise.all(promises).then(results => {
        const validResults = results.filter(result => result !== null);

        // Create an aggregated list of all tokens across all days
        let aggregatedTokensData = [];
        validResults.forEach(day => {
          day.tokens.forEach(token => {
            // Aggregate the USD values for each token
            const existingToken = aggregatedTokensData.find(t => t.token === token.token);
            if (existingToken) {
              existingToken.totalQuote += token.quote;
            } else {
              aggregatedTokensData.push({ token: token.token, totalQuote: token.quote });
            }
          });
        });

        aggregatedTokensData.sort((a, b) => b.totalQuote - a.totalQuote);
        const topTokensData = aggregatedTokensData.slice(0, 5);

        setTokensList(topTokensData.map(t => t.token));

        const topTokensSet = new Set(topTokensData.map(t => t.token));
        const filteredData = validResults.map(day => ({
          date: day.date,
          tokens: day.tokens.filter(token => topTokensSet.has(token.token)),
          totalUSD: day.totalUSD,
        }));

        setData(filteredData);
        setLoading(false);
      });
    };

    getHistoricalTokens();
  }, [address]);

  if (loading) {
    return <div>Loading historical data...</div>;
  }

  const transformedData = data.map(day => {
    const tokensData = day.tokens.reduce((acc, token) => {
      acc[token.token] = token.quote; // Convert token balance into a field for the day
      return acc;
    }, {});
    return { date: day.date, ...tokensData, totalUSD: day.totalUSD };
  });

  return (
    <>
      <LineChart width={800} height={600} data={transformedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
        <Tooltip />
        <Legend />
        {tokensList.map(token => {
          return (
            <Line
              key={token}
              yAxisId="left"
              type="monotone"
              dataKey={`${token}`}
              stroke={getRandomColor()}
              activeDot={{ r: 8 }}
              name={`${token} Balance`}
            />
          );
        })}

        <Line yAxisId="right" type="monotone" dataKey="totalUSD" stroke="#82ca9d" name="Total USD" />
      </LineChart>
    </>
  );
};
