const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>{
  res.send("Worker Salary API Running");
});


// ADD SITE
app.post("/sites",(req,res)=>{

  const {name} = req.body;

  db.run(
    "INSERT INTO sites(name) VALUES(?)",
    [name],
    function(err){

      if(err){
        res.status(500).json(err);
        return;
      }

      res.json({message:"Site added"});
    }
  );

});


// GET SITES
app.get("/sites",(req,res)=>{

  db.all("SELECT * FROM sites",[],(err,rows)=>{

    if(err){
      res.status(500).json(err);
      return;
    }

    res.json(rows);

  });

});


// ADD WORKER
app.post("/workers",(req,res)=>{

  const {name, phone, site_id, rate, role} = req.body;

  // Set default values if not provided
  const workerRate = rate || 500;
  const workerRole = role || 'Worker';

  db.run(
    "INSERT INTO workers(name,phone,site_id,rate,role) VALUES(?,?,?,?,?)",
    [name,phone,site_id,workerRate,workerRole],
    function(err){

      if(err){
        res.status(500).json(err);
        return;
      }

      res.json({
        message:"Worker added",
        id: this.lastID
      });

    }
  );

});


// GET WORKERS BY SITE
app.get("/workers",(req,res)=>{

  const site_id = req.query.site_id;

  db.all(
    "SELECT * FROM workers WHERE site_id=?",
    [site_id],
    (err,rows)=>{

      if(err){
        res.status(500).json(err);
        return;
      }

      res.json(rows);

    }
  );

});


// DELETE WORKER
app.delete("/workers/:id",(req,res)=>{

  const id=req.params.id;

  db.run(
    "DELETE FROM workers WHERE id=?",
    [id],
    function(err){

      if(err){
        res.status(500).json(err);
        return;
      }

      res.json({message:"Worker deleted"});

    }
  );

});


// SAVE MONTHLY RATE
app.post("/rate",(req,res)=>{

  const {month,year,rate}=req.body;

  db.run(
    "INSERT INTO monthly_settings(month,year,rate) VALUES(?,?,?)",
    [month,year,rate],
    function(err){

      if(err){
        res.status(500).json(err);
        return;
      }

      res.json({message:"Rate saved"});

    }
  );

});


// GET ATTENDANCE
app.get("/attendance",(req,res)=>{

  db.all(
    "SELECT * FROM attendance",
    [],
    (err,rows)=>{

      if(err){
        res.status(500).json(err);
        return;
      }

      res.json(rows);

    }
  );

});


// SAVE ATTENDANCE
app.post("/attendance",(req,res)=>{

  const {worker_id,month,year,attendance_count,salary}=req.body;

  // Get worker rate from workers table
  db.get(
    "SELECT rate FROM workers WHERE id=?",
    [worker_id],
    (err,row)=>{

      if(err){
        res.status(500).json(err);
        return;
      }

      if(!row){
        res.status(400).json({message:"Worker not found"});
        return;
      }

      const workerRate = row.rate;

      // Calculate salary using worker rate or use manual salary if provided
      const finalSalary = salary ? salary : attendance_count * workerRate;

      db.run(
        `INSERT INTO attendance(worker_id,month,year,attendance_count,salary)
         VALUES(?,?,?,?,?)
         ON CONFLICT(worker_id,month,year)
         DO UPDATE SET
         attendance_count=excluded.attendance_count,
         salary=excluded.salary`,
        [worker_id,month,year,attendance_count,finalSalary],
        function(err){

          if(err){
            res.status(500).json(err);
            return;
          }

          res.json({
            message:"Saved",
            salary:finalSalary
          });

        }
      );

    }
  );

});


// MARK PAID
app.put("/attendance/paid/:id",(req,res)=>{

  const id=req.params.id;

  db.run(
    "UPDATE attendance SET paid=1 WHERE id=?",
    [id],
    function(err){

      if(err){
        res.status(500).json(err);
        return;
      }

      res.json({message:"Salary marked paid"});

    }
  );

});


app.listen(3001,()=>{
  console.log("Server running on port 3001");
});