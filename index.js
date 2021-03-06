const express = require("express");
var app = express();
var mongo = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;
var port = 8000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


mongo.connect("mongodb://localhost:27017/mern", { useUnifiedTopology: true }, function (err, server) {
  if (err) {
    console.log("connection error " + err);
  } else {

    app.post("/get_users", (req, res) => {
      if (
        req.body.hasOwnProperty("limit") &&
        req.body.hasOwnProperty("skip")
      ) {
        var users = [];
        var cursor =
          server.db().collection("users").find({}).
            limit(parseInt(req.body.limit)).
            skip(parseInt(req.body.skip));

        cursor.forEach(function (doc, err2) {
          if (!err2) {
            users.push(doc);
          }
        }, function () {
          if (users.length === 0) {
            res.json({ status: false, message: "no data in collection" });
          } else {
            res.json({ status: true, result: users });
          }
        })
      } else {
        res.json({ status: false, message: "some params are missing" });
      }
    })


    app.post("/get_one_user", (req, res) => {
      if (
        req.body.hasOwnProperty("user_id")
      ) {
        server.db().collection("users").countDocuments({ }, function(err, result){
          console.log(result);
        })
        // server.db().collection("users").findOne({ _id: new ObjectId(req.body.user_id) }, function (err, doc) {
        //   if (err) {
        //     console.log(err)
        //   } else {
        //     console.log(doc)
        //   }
        // });
      } else {
        res.json({ status: false, message: "some params are missing" });
      }
    })

    //API TO ADD A NEW USER TO THE USERS COLLECTION
    //required params - name, email, contact, gender
    //response - status, message, output
    app.post("/add_user", (req, res) => {
      if (
        req.body.hasOwnProperty("name") &&
        req.body.hasOwnProperty("email") &&
        req.body.hasOwnProperty("contact") &&
        req.body.hasOwnProperty("gender")
      ) {
        var userData = {
          name: req.body.name,
          email: req.body.email,
          contact: req.body.contact,
          gender: req.body.gender
        }
        server.db().collection("users").insertOne(userData, (err, result) => {
          if (err) {
            res.json({ status: false, message: "user could not be added" });
          } else {
            res.json({ status: true, message: "user has been added", output: result.insertedId });
          }
        })
      } else {
        res.json({ status: false, message: "some params missing" });
      }
    })

    app.post("/add_multiple_users", (req, res) => {
      if (
        req.body.hasOwnProperty("users")
      ) {
        var users = JSON.parse(req.body.users);
        if (users.length === 0) {
          res.json({ status: false, message: "users array is empty" });
        } else {
          server.db().collection("users").insertMany(users, (err, result) => {
            if (err) {
              res.json({ status: false, message: "user could not be added", error: err });
            } else {
              res.json({ status: true, message: "user has been added", output: result.insertedIds });
            }
          })
        }
      } else {
        res.json({ status: false, message: "some params missing" });
      }
    })

    app.post("/remove_multiple_users", (req, res) => {
      var arr = JSON.parse(req.body.user_ids);
      arr.forEach((id, i) => {
        arr[i] = new ObjectId(id);
      })

      server.db().collection("users").deleteMany({ _id: { $in: arr } }, (err, result) => {
        if (err) {
          res.json({ status: false, message: "error occured" });
        } else {
          res.json({ status: true, message: "documents deleted", result: result });
        }
      })
    })


    app.post("/user_details", (req, res) => {
      var user_details = [];
      var cursor = server.db().collection("users").aggregate([
        {
          $lookup: {
            from: "gender_count",
            localField: "gender",
            foreignField: "gender",
            as: "count"
          }
        }, {
          $unwind: "$count"
        }
      ])

      cursor.forEach((doc, err) => {
        if (!err) {
          user_details.push(doc);
        }
      }, function () {
        res.json({ status: true, result: user_details });
      })
    })


  }
})


app.get("/", (req, res) => {
  res.send("welcome to express project");
})

app.post("/login", (req, res) => {
  if (
    req.body.hasOwnProperty("email") &&
    req.body.hasOwnProperty("pwd")
  ) {
    if (req.body.email == "akash@email.com" && req.body.pwd == "random321") {
      res.json({ status: true, message: "login successful" });
    } else {
      res.json({ status: false, message: "login failed" });
    }
  } else {
    res.json({ status: false, message: "some params are missing" });
  }
})

app.listen(port, () => {
  console.log("app is running on port " + port);
});
