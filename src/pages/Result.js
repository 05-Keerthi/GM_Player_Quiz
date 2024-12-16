import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const Result = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`/api/leaderboard/${sessionId}`);
        setResults(response.data);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchResults();
    }
  }, [sessionId]);

  if (!sessionId) {
    return <p>Invalid session.</p>;
  }

  if (loading) {
    return <p>Loading results...</p>;
  }

  if (!results) {
    return <p>No results found for this session.</p>;
  }

  return (
    <div className="results-page">
      <h1>Quiz Results</h1>
      <div>
        <p><strong>Your Score:</strong> {results.score}</p>
        <p><strong>Your Rank:</strong> {results.rank}</p>
      </div>
      <Leaderboard leaderboard={results.leaderboard} />
    </div>
  );
};

const Leaderboard = ({ leaderboard }) => {
  if (!leaderboard || leaderboard.length === 0) {
    return <p>No leaderboard data available.</p>;
  }

  return (
    <div>
      <h2>Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Score</th>
            <th>Rank</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map(({ player, score, rank }, index) => (
            <tr key={index}>
              <td>{player}</td>
              <td>{score}</td>
              <td>{rank}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Result;
