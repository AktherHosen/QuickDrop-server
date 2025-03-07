const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();

const app = express();

const port = process.env.POST || 5000;
app.use(express.json());

const cors = require("cors");

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
};

app.use(cors(corsOptions));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bmhyihx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// const uri = "mongodb://localhost:27017/";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();

    const db = client.db("quickdrop");
    const usersCollection = db.collection("user");

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // Get user info by email
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send(result);
    });

    // app.get("/user/:email", async (req, res) => {
    //   const email = req.params.email;

    //   try {
    //     if (!email) {
    //       return res.status(400).send({ message: "Email is required" });
    //     }

    //     const user = await usersCollection.findOne({ email });
    //     if (user) {
    //       res.send(user);
    //     } else {
    //       res.status(404).send({ message: "User not found" });
    //     }
    //   } catch (error) {
    //     res.status(500).send({ message: "Server error" });
    //   }
    // });

    app.put("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const isExist = await usersCollection.findOne({ email: user?.email });
      if (isExist) {
        if (user?.status == "requested") {
          const result = await usersCollection.updateOne(query, {
            $set: { status: user?.status },
          });
          return res.send(result);
        } else {
          return res.send(isExist);
        }
      }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...user,
          timestamp: Date.now(),
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    app.patch("/user/:id", async (req, res) => {
      console.log("PATCH request received!");
      console.log("Params:", req.params);
      console.log("Body:", req.body);

      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      const { role } = req.body;
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      const query = { _id: new ObjectId(id) };
      console.log("Query:", query);
      const user = await usersCollection.findOne(query);
      const updateDoc = {
        $set: { role },
      };

      const result = await usersCollection.updateOne(user, updateDoc);
      console.log("MongoDB Result:", result);

      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
