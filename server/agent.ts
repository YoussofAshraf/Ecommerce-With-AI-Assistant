// Import required modules from LangChain ecosystem
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StateGraph } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { MongoClient } from "mongodb";
import { z } from "zod";
import "dotenv/config";

// Type assertion to bypass complex type inference
declare const ToolNodeType: any;
declare const ToolType: any;

// Utility function to handle API rate limits with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>, // The function to retry (generic type T for return value)
  maxRetries = 3 // Maximum number of retry attempts (default 3)
): Promise<T> {
  // Loop through retry attempts
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(); // Try to execute the function
    } catch (error: any) {
      // Check if it's a rate limit error (HTTP 429) and we have retries left
      if (error.status === 429 && attempt < maxRetries) {
        // Calculate exponential backoff delay: 2^attempt seconds, max 30 seconds
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        console.log(`Rate limit hit. Retrying in ${delay / 1000} seconds...`);
        // Wait for the calculated delay before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // Go to next iteration (retry)
      }
      throw error; // If not rate limit or out of retries, throw the error
    }
  }
  throw new Error("Max retries exceeded"); // This should never be reached
}

// Main function that creates and runs the AI agent
export async function callAgent(
  client: MongoClient,
  query: string,
  thread_id: string
) {
  try {
    // Database configuration
    const dbName = "inventory_database"; // Name of the MongoDB database
    const db = client.db(dbName); // Get database instance
    const collection = db.collection("items"); // Get the 'items' collection
    // Define the state structure for the agent workflow
    const GraphState = Annotation.Root({
      messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
      }),
    });

    type StateType = typeof GraphState.State;

    // Create tool function with proper typing
    const toolFunction = async (input: { query: string; n?: number }) => {
      const { query, n = 10 } = input;
      try {
        console.log("Item lookup tool called with query:", query);

        // Check if database has any data at all
        const totalCount = await collection.countDocuments();
        console.log(`Total documents in collection: ${totalCount}`);

        // Early return if database is empty
        if (totalCount === 0) {
          console.log("Collection is empty");
          return JSON.stringify({
            error: "No items found in inventory",
            message: "The inventory database appears to be empty",
            count: 0,
          });
        }

        // Get sample documents for debugging purposes
        const sampleDocs = await collection.find({}).limit(3).toArray();
        console.log("Sample documents:", sampleDocs);

        // Configuration for MongoDB Atlas Vector Search
        const dbConfig = {
          collection: collection,
          indexName: "vector_index",
          textKey: "embedding_text",
          embeddingKey: "embedding",
        };

        // Create vector store instance for semantic search using Google Gemini embeddings
        const vectorStore = new MongoDBAtlasVectorSearch(
          new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "text-embedding-004",
          }),
          dbConfig
        );

        console.log("Performing vector search...");
        // Perform semantic search using vector embeddings
        const result = await vectorStore.similaritySearchWithScore(query, n);
        console.log(`Vector search returned ${result.length} results`);

        // If vector search returns no results, fall back to text search
        if (result.length === 0) {
          console.log(
            "Vector search returned no results, trying text search..."
          );
          // MongoDB text search using regular expressions
          const textResults = await collection
            .find({
              $or: [
                { item_name: { $regex: query, $options: "i" } },
                { item_description: { $regex: query, $options: "i" } },
                { categories: { $regex: query, $options: "i" } },
                { embedding_text: { $regex: query, $options: "i" } },
              ],
            })
            .limit(n)
            .toArray();

          console.log(`Text search returned ${textResults.length} results`);
          return JSON.stringify({
            results: textResults,
            searchType: "text",
            query: query,
            count: textResults.length,
          });
        }

        return JSON.stringify({
          results: result,
          searchType: "vector",
          query: query,
          count: result.length,
        });
      } catch (error: any) {
        console.error("Error in item lookup:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });

        return JSON.stringify({
          error: "Failed to search inventory",
          details: error.message,
          query: query,
        });
      }
    };
    // Create a custom tool for searching furniture inventory using manual approach
    const itemLookupTool = {
      name: "item_lookup",
      description: "Gathers furniture item details from the Inventory database",
      func: toolFunction,
      args_schema: z.object({
        query: z.string(),
        n: z.number().optional().default(10),
      }),
      invoke: toolFunction,
      call: toolFunction,
    } as any;

    // Array of all available tools
    const tools = [itemLookupTool];
    // Create a tool execution node for the workflow manually
    const toolNode = {
      invoke: async (state: any) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
          const toolCall = lastMessage.tool_calls[0];
          const result = await toolFunction(toolCall.args);
          return {
            messages: [
              {
                role: "tool",
                content: result,
                tool_call_id: toolCall.id,
              },
            ],
          };
        }
        return { messages: [] };
      },
    } as any;

    // Initialize the AI model (Google's Gemini) without complex tool binding
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      temperature: 0,
      maxRetries: 0,
      apiKey: process.env.GOOGLE_API_KEY,
    }) as any;

    // Decision function: determines next step in the workflow
    function shouldContinue(state: StateType) {
      const messages = state.messages;
      const lastMessage = messages[messages.length - 1] as AIMessage;

      if (lastMessage.tool_calls?.length) {
        return "tools";
      }
      return "__end__";
    }

    // Function that calls the AI model with retry logic
    async function callModel(state: StateType) {
      return retryWithBackoff(async () => {
        // Wrap in retry logic
        // Create a structured prompt template
        const prompt = ChatPromptTemplate.fromMessages([
          [
            "system", // System message defines the AI's role and behavior
            `You are a helpful E-commerce Chatbot Agent for a furniture store. 

IMPORTANT: You have access to an item_lookup tool that searches the furniture inventory database. ALWAYS use this tool when customers ask about furniture items, even if the tool returns errors or empty results.

When using the item_lookup tool:
- If it returns results, provide helpful details about the furniture items
- If it returns an error or no results, acknowledge this and offer to help in other ways
- If the database appears to be empty, let the customer know that inventory might be being updated

Current time: {time}`,
          ],
          new MessagesPlaceholder("messages"), // Placeholder for conversation history
        ]);

        // Fill in the prompt template with actual values
        const formattedPrompt = await prompt.formatMessages({
          time: new Date().toISOString(), // Current timestamp
          messages: state.messages, // All previous messages
        });

        // Call the AI model with the formatted prompt
        const result = await model.invoke(formattedPrompt);

        // Check if the model wants to use tools (manual tool detection)
        const content = result.content as string;
        if (
          content.includes("item_lookup") &&
          (content.includes("search") ||
            content.includes("look") ||
            content.includes("find"))
        ) {
          // Create a mock tool call for the item lookup
          result.tool_calls = [
            {
              id: "call_1",
              name: "item_lookup",
              args: {
                query: state.messages[state.messages.length - 1].content,
                n: 10,
              },
            },
          ];
        }

        // Return new state with the AI's response added
        return { messages: [result] };
      });
    }

    // Build the workflow graph
    const workflow = new StateGraph(GraphState)
      .addNode("agent", callModel) // Add AI model node
      .addNode("tools", toolNode) // Add tool execution node
      .addEdge("__start__", "agent") // Start workflow at agent
      .addConditionalEdges("agent", shouldContinue) // Agent decides: tools or end
      .addEdge("tools", "agent"); // After tools, go back to agent

    // Initialize conversation state persistence
    const checkpointer = new MongoDBSaver({ client, dbName });
    // Compile the workflow with state saving
    const app = workflow.compile({ checkpointer });

    // Execute the workflow
    const finalState = await app.invoke(
      {
        messages: [new HumanMessage(query)], // Start with user's question
      },
      {
        recursionLimit: 15, // Prevent infinite loops
        configurable: { thread_id: thread_id }, // Conversation thread identifier
      }
    );

    // Extract the final response from the conversation
    const response =
      finalState.messages[finalState.messages.length - 1].content;
    console.log("Agent response:", response);

    return response; // Return the AI's final response
  } catch (error: any) {
    // Handle different types of errors with user-friendly messages
    console.error("Error in callAgent:", error.message);

    if (error.status === 429) {
      // Rate limit error
      throw new Error(
        "Service temporarily unavailable due to rate limits. Please try again in a minute."
      );
    } else if (error.status === 401) {
      // Authentication error
      throw new Error(
        "Authentication failed. Please check your API configuration."
      );
    } else {
      // Generic error
      throw new Error(`Agent failed: ${error.message}`);
    }
  }
}
