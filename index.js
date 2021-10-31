const express = require("express");

const { MongoClient } = require("mongodb");

const ObjectId = require("mongodb").ObjectId;

require("dotenv").config();

const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tyr9s.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("speedydb");
    const serviceCollection = database.collection("services");
    const orderCollection = database.collection("orders");
    const teamCollection = database.collection("team");

    // find all the team members from db
    app.get("/team", async (req, res) => {
      const cursor = teamCollection.find({});

      const result = await cursor.toArray();
      res.json(result);
    });

    // insert a service in db
    app.post("/add-a-service", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.json(result);
    });

    // find all the services from db
    app.get("/services", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const cursor = serviceCollection.find({});
      let services;
      const count = await cursor.count();
      if (size) {
        services = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        services = await cursor.toArray();
      }

      res.send({ services, count });
    });

    // get a single service from db
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.findOne(query);

      res.json(result);
    });

    // find all the orders from db
    app.get("/orders", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const cursor = orderCollection.find({});
      let orders;
      const count = await cursor.count();
      if (size) {
        orders = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        orders = await cursor.toArray();
      }

      res.send({ orders, count });
    });

    // insert an order in db
    app.post("/place-order", async (req, res) => {
      const service = req.body;
      const result = await orderCollection.insertOne(service);
      res.json(result);
    });

    // find orders by id
    app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const cursor = orderCollection.find(query);
      const result = await cursor.toArray();

      res.json(result);
    });

    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);

      res.json(result);
    });

    // update state of the order
    app.put("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const updatedOrder = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          status: updatedOrder.status,
        },
      };
      const result = await orderCollection.updateOne(filter, updateDoc);

      res.json(result);
    });
  } finally {
    // await client.close()
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  console.log("server started");
  res.send("hello from server");
});

app.listen(port, () => {
  console.log("listening to port", port);
});
