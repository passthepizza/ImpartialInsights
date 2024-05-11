import { useState } from "react";
import axios from "axios";
import "tailwindcss/tailwind.css";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateArticles = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/generate-article");
      setArticles([response.data.article, ...articles]);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Non-Partisan News Feed</h1>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-8"
        onClick={generateArticles}
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : "Generate Article"}
      </button>
      <div className="space-y-8">
        {articles.map((article, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <p className="text-lg">{article}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
