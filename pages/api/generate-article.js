import { Configuration, OpenAIApi } from "openai";
import axios from "axios";
import cheerio from "cheerio";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  basePath: "https://api.groq.com/openai/v1",
});
const openai = new OpenAIApi(configuration);

const sources = [
  {
    name: "AlterNet",
    url: "https://www.alternet.org/",
    articleSelector: "article.story",
    contentSelector: ".story-content",
  },
  {
    name: "The Atlantic",
    url: "https://www.theatlantic.com/",
    articleSelector: "article.article",
    contentSelector: ".article-body",
  },
  {
    name: "Jacobin",
    url: "https://jacobinmag.com/",
    articleSelector: "article.article-item",
    contentSelector: ".article-item__body",
  },
  {
    name: "Mother Jones",
    url: "https://www.motherjones.com/",
    articleSelector: "article.articles-item",
    contentSelector: ".entry-content",
  },
  {
    name: "The Daily Beast",
    url: "https://www.thedailybeast.com/",
    articleSelector: "article.Card",
    contentSelector: ".Card__TextBlock",
  },
  {
    name: "The Intercept",
    url: "https://theintercept.com/",
    articleSelector: "article.Post",
    contentSelector: ".PostContent",
  },
  {
    name: "The American Conservative",
    url: "https://www.theamericanconservative.com/",
    articleSelector: "article.post",
    contentSelector: ".entry-content",
  },
  {
    name: "Breitbart",
    url: "https://www.breitbart.com/",
    articleSelector: "article.article-item",
    contentSelector: ".entry-content",
  },
  {
    name: "The Federalist",
    url: "https://thefederalist.com/",
    articleSelector: "article.post",
    contentSelector: ".entry-content",
  },
  {
    name: "National Review",
    url: "https://www.nationalreview.com/",
    articleSelector: "article.article",
    contentSelector: ".article-content",
  },
  {
    name: "The Daily Caller",
    url: "https://dailycaller.com/",
    articleSelector: "article.single-post",
    contentSelector: ".entry-content",
  },
  {
    name: "The Washington Times",
    url: "https://www.washingtontimes.com/",
    articleSelector: "article.article",
    contentSelector: ".bigtext",
  },
];

async function scrapeArticles(source) {
  try {
    const response = await axios.get(source.url);
    const $ = cheerio.load(response.data);
    const articles = [];

    $(source.articleSelector).each((index, element) => {
      const title = $(element).find("h2").text().trim();
      const content = $(element).find(source.contentSelector).text().trim();
      articles.push({ title, content });
    });

    return articles;
  } catch (error) {
    console.error(`Error scraping articles from ${source.name}:`, error);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const scrapedArticles = await Promise.all(sources.map(scrapeArticles));
      const combinedArticles = scrapedArticles.flat();

      const articleSummaries = combinedArticles.map(
        (article) => `Title: ${article.title}\nContent: ${article.content}`
      );
      const combinedSummaries = articleSummaries.join("\n\n");

      const prompt = `Please generate a non-partisan news article that explains only the facts from the following biased news articles:\n\n${combinedSummaries}`;

      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        n: 1,
        stop: null,
        temperature: 0.5,
      });

      const generatedArticle = response.data.choices[0].message.content.trim();

      res.status(200).json({ article: generatedArticle });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
