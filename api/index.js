import "dotenv/config";
import express from "express";
import cors from "cors";
import openai from "../utils/openai.js";
import searchGoogle from "../functions/searchGoogle.js";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/create-thread", async (req, res) => {
  const thread = await openai.beta.threads.create();
  console.log("thread created");
  return res.json(thread);
});

app.post("/run-assistant", async (req, res) => {
  console.log("running assitant");
  const { userMessage, threadId } = req.body;

  if (!userMessage) return res.json({ error: "no user message" });
  if (!threadId) return res.json({ error: "no thread ID" });

  const message = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: userMessage,
  });

  let run = await openai.beta.threads.runs.createAndPoll(threadId, {
    assistant_id: process.env.ASSISTANT_ID,
  });

  let messages;
  if (run.status == "completed") {
    messages = await openai.beta.threads.messages.list(run.thread_id);
  } else if (
    run.status == "requires_action" &&
    run.required_action &&
    run.required_action.submit_tool_outputs &&
    run.required_action.submit_tool_outputs.tool_calls
  ) {
    console.log("running tool calls");
    const toolOutputs = [];
    for (const tool of run.required_action.submit_tool_outputs.tool_calls) {
      if (tool.function.name == "get_stock_price") {
        const requestBody = JSON.parse(tool.function.arguments);
        console.log("------Stock price function body:", requestBody);

        const { symbol } = requestBody;
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
        try {
          const response = await axios.get(url);
          const data = response.data["Time Series (5min)"];
          const latestTime = Object.keys(data)[0];
          const latestPrice = data[latestTime]["1. open"];
          toolOutputs.push({
            tool_call_id: tool.id,
            output: latestPrice,
          });
        } catch (error) {
          console.error("Error fetching stock price:", error);
        }
      } else if (tool.function.name === "google_search") {
        const requestBody = JSON.parse(tool.function.arguments);
        console.log("------Google search function body:", requestBody);
        try {
          const { query } = requestBody;
          const response = await searchGoogle(query);
          toolOutputs.push({
            tool_call_id: tool.id,
            output: JSON.stringify(response.data.items),
          });
        } catch (e) {
          console.log("Error making request", e);
        }
      }
      else if (tool.function.name === "get_portfolio_info") {
        console.log("------Portfolio function called");

        try {
          // Fetch the portfolio data from Google Sheets
          const rawData = await fetchPortfolioData();

          if (rawData) {
            // Clean and process the portfolio data
            const portfolioData = cleanAndProcessStockData(rawData);

            // Return the processed data as the output
            toolOutputs.push({
              tool_call_id: tool.id,
              output: JSON.stringify(portfolioData),
            });
          } else {
            console.error("No portfolio data found");
          }
        } catch (error) {
          console.error("Error processing portfolio data:", error);
        }
      }
    }

    const toolCallRun = await openai.beta.threads.runs.submitToolOutputsAndPoll(
      threadId,
      run.id,
      { tool_outputs: toolOutputs }
    );

    if (toolCallRun.status == "completed") {
      messages = await openai.beta.threads.messages.list(toolCallRun.thread_id);
    } else {
      return res.json({ error: run.status });
    }
  } else {
    return res.json({ error: run.status });
  }

  return res.json(messages);
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
