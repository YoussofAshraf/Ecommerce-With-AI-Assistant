import "dotenv/config";
import express, { Express, Request, Response } from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import { callAgent } from "./agent";

const app: Express = express();

app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string);

// Fallback function for when AI quota is exceeded
async function getFallbackResponse(query: string): Promise<string> {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("sofa") || lowerQuery.includes("couch")) {
    return "🛋️ **Sofas & Couches Available:**\n\n• Modern Sectional Sofa - $1,299 (Grey, L-shaped, seats 6)\n• Classic Leather Sofa - $899 (Brown, 3-seater)\n• Convertible Sofa Bed - $599 (Navy, perfect for guests)\n\nI'd love to help you find the perfect sofa, but I'm currently experiencing high demand. Please try again later for personalized recommendations!";
  } else if (lowerQuery.includes("chair") || lowerQuery.includes("office")) {
    return "🪑 **Chairs Available:**\n\n• Ergonomic Office Chair - $399 (Lumbar support, adjustable)\n• Dining Chairs Set - $299 (4 chairs, oak wood)\n• Accent Chair - $199 (Velvet, multiple colors)\n\nFor detailed specifications and availability, please try again when my AI assistant is back online!";
  } else if (lowerQuery.includes("table") || lowerQuery.includes("dining")) {
    return "🍽️ **Tables & Dining:**\n\n• Dining Table Set - $899 (Seats 6, includes chairs)\n• Coffee Table - $299 (Glass top, modern design)\n• Side Table - $149 (Oak wood, drawer storage)\n\nI'd love to provide more details, but I'm temporarily at capacity. Please check back soon!";
  } else if (lowerQuery.includes("bed") || lowerQuery.includes("bedroom")) {
    return "🛏️ **Bedroom Furniture:**\n\n• Queen Platform Bed - $799 (Modern, storage drawers)\n• King Size Bed Frame - $999 (Solid wood, classic)\n• Nightstand Set - $299 (2 pieces, matching)\n\nFor personalized bedroom furniture recommendations, please try again later!";
  } else {
    return "🏠 **Welcome to Our Furniture Store!**\n\nI'm currently experiencing high demand and have reached my daily response limit. Here's a quick overview of what we offer:\n\n🛋️ **Living Room:** Sofas, chairs, coffee tables\n🛏️ **Bedroom:** Beds, dressers, nightstands\n🍽️ **Dining:** Tables, chairs, storage\n🏢 **Office:** Desks, chairs, storage solutions\n\n**Please try again in a few hours for personalized AI assistance!** Our quota typically resets every 24 hours.\n\nFor immediate assistance, you can:\n• Browse our components page\n• Check our documentation\n• Contact our support team\n\nThank you for your patience! 🙏";
  }
}

async function startServer() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB");

    app.get("/", (req: Request, res: Response) => {
      res.send("LanGraph Agent Server");
    });

    // Products API endpoint
    app.get("/api/products", async (req: Request, res: Response) => {
      try {
        const db = client.db("inventory_database");
        const collection = db.collection("items");

        const {
          category,
          minPrice,
          maxPrice,
          limit = 20,
          page = 1,
        } = req.query;

        // Build query filter
        const filter: any = {};
        if (category) {
          filter.categories = { $regex: category, $options: "i" };
        }
        if (minPrice || maxPrice) {
          filter["prices.sale_price"] = {};
          if (minPrice) filter["prices.sale_price"].$gte = Number(minPrice);
          if (maxPrice) filter["prices.sale_price"].$lte = Number(maxPrice);
        }

        const skip = (Number(page) - 1) * Number(limit);

        const products = await collection
          .find(filter)
          .skip(skip)
          .limit(Number(limit))
          .toArray();

        const total = await collection.countDocuments(filter);

        res.json({
          products,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        });
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to fetch products" });
      }
    });

    // Single product API endpoint
    app.get("/api/products/:id", async (req: Request, res: Response) => {
      try {
        const db = client.db("inventory_database");
        const collection = db.collection("items");

        const product = await collection.findOne({ item_id: req.params.id });

        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }

        res.json(product);
      } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ error: "Failed to fetch product" });
      }
    });

    app.post("/chat", async (req: Request, res: Response) => {
      const { message } = req.body;
      const threadId = Date.now().toString();
      console.log("Received message:", message);
      try {
        const response = await callAgent(client, message, threadId);
        res.json({ threadId, response });
      } catch (error: any) {
        console.log("Chat error:", error);

        // Handle quota exceeded errors with fallback response
        if (error.message.includes("quota") || error.message.includes("429")) {
          const fallbackResponse = await getFallbackResponse(message);
          res.json({
            threadId,
            response: fallbackResponse,
            fallback: true,
          });
        } else if (error.message.includes("rate limit")) {
          res.status(429).json({
            error: "Rate limit exceeded",
            message: "Too many requests. Please wait a moment and try again.",
          });
        } else {
          res.status(500).json({
            error: "Internal Server Error",
            message: error.message || "An unexpected error occurred",
          });
        }
      }
    });
    app.post("/chat/:threadId", async (req: Request, res: Response) => {
      const { threadId } = req.params;
      const { message } = req.body;
      try {
        const response = await callAgent(client, message, threadId);
        res.json({ response });
      } catch (error: any) {
        console.log("Chat error:", error);

        // Handle quota exceeded errors with fallback response
        if (error.message.includes("quota") || error.message.includes("429")) {
          const fallbackResponse = await getFallbackResponse(message);
          res.json({
            response: fallbackResponse,
            fallback: true,
          });
        } else if (error.message.includes("rate limit")) {
          res.status(429).json({
            error: "Rate limit exceeded",
            message: "Too many requests. Please wait a moment and try again.",
          });
        } else {
          res.status(500).json({
            error: "Internal Server Error",
            message: error.message || "An unexpected error occurred",
          });
        }
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
