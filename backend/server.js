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


// TEST ENDPOINT
app.get("/test", (req,res) => {
  res.json({message: "Test endpoint working"});
});

// BULK ADD WORKERS (Must be before DELETE route with :id parameter)
app.post("/workers/bulk",(req,res)=>{
  console.log("Bulk endpoint hit with body:", req.body);
  
  const {workers} = req.body;

  if(!workers || !Array.isArray(workers) || workers.length === 0){
    console.log("Invalid workers array");
    res.status(400).json({error: "Workers array is required"});
    return;
  }

  console.log("Processing", workers.length, "workers");

  // Validate each worker
  for(let i = 0; i < workers.length; i++){
    const worker = workers[i];
    if(!worker.name || !worker.phone || !worker.site_id){
      res.status(400).json({error: `Worker at row ${i+2} is missing required fields (name, phone, site_id)`});
      return;
    }
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process workers one by one
  const processWorker = (index) => {
    if (index >= workers.length) {
      // All workers processed
      return res.json({
        message: `Bulk import completed`,
        successCount,
        errorCount,
        errors
      });
    }

    const worker = workers[index];
    const {name, phone, site_id, rate, role} = worker;
    const workerRate = rate || 500;
    const workerRole = role || 'Worker';

    db.run(
      "INSERT INTO workers(name,phone,site_id,rate,role) VALUES(?,?,?,?,?)",
      [name, phone, site_id, workerRate, workerRole],
      function(err){
        if(err){
          errorCount++;
          errors.push({row: index + 2, error: err.message});
        } else {
          successCount++;
        }
        // Process next worker
        processWorker(index + 1);
      }
    );
  };

  // Start processing from first worker
  processWorker(0);
});


// UPDATE WORKER RATE
app.put("/workers/:id/rate",(req,res)=>{

  const id=req.params.id;
  const {rate} = req.body;

  db.run(
    "UPDATE workers SET rate=? WHERE id=?",
    [rate,id],
    function(err){

      if(err){
        res.status(500).json(err);
        return;
      }

      res.json({message:"Rate updated"});

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

  const {worker_id,month,year,attendance_count,salary,advance,remark}=req.body;

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
      
      // Set default values for advance and remark if not provided
      const advanceAmount = advance || 0;
      const remarkText = remark || "";

      db.run(
        `INSERT INTO attendance(worker_id,month,year,attendance_count,salary,advance,remark)
         VALUES(?,?,?,?,?,?,?)
         ON CONFLICT(worker_id,month,year)
         DO UPDATE SET
         attendance_count=excluded.attendance_count,
         salary=excluded.salary,
         advance=excluded.advance,
         remark=excluded.remark`,
        [worker_id,month,year,attendance_count,finalSalary,advanceAmount,remarkText],
        function(err){

          if(err){
            res.status(500).json(err);
            return;
          }

          res.json({
            message:"Saved",
            salary:finalSalary,
            advance:advanceAmount,
            finalPay: finalSalary - advanceAmount
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


// GET ADVANCES FOR A WORKER IN A SPECIFIC MONTH
app.get("/advances/:workerId/:month/:year",(req,res)=>{

  const {workerId,month,year} = req.params;

  db.all(
    "SELECT * FROM advances WHERE worker_id=? AND month=? AND year=? ORDER BY created_at DESC",
    [workerId,month,year],
    (err,rows)=>{

      if(err){
        res.status(500).json(err);
        return;
      }

      res.json(rows);

    }
  );

});


// ADD NEW ADVANCE
app.post("/advances",(req,res)=>{

  const {worker_id,month,year,amount,remark} = req.body;
  
  if(!worker_id || !month || !year || !amount) {
    res.status(400).json({message: "Missing required fields"});
    return;
  }

  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  db.run(
    "INSERT INTO advances(worker_id,month,year,amount,remark,date) VALUES(?,?,?,?,?,?)",
    [worker_id,month,year,amount,remark || "",currentDate],
    function(err){

      if(err){
        res.status(500).json(err);
        return;
      }

      res.json({
        message:"Advance added",
        id: this.lastID,
        date: currentDate
      });

    }
  );

});


// DELETE ADVANCE
app.delete("/advances/:id",(req,res)=>{

  const id = req.params.id;

  db.run(
    "DELETE FROM advances WHERE id=?",
    [id],
    function(err){

      if(err){
        res.status(500).json(err);
        return;
      }

      res.json({message:"Advance deleted"});

    }
  );

});


// GET TOTAL ADVANCES FOR A WORKER IN A SPECIFIC MONTH  
app.get("/advances/total/:workerId/:month/:year",(req,res)=>{

  const {workerId,month,year} = req.params;

  db.get(
    "SELECT COALESCE(SUM(amount), 0) as total FROM advances WHERE worker_id=? AND month=? AND year=?",
    [workerId,month,year],
    (err,row)=>{

      if(err){
        res.status(500).json(err);
        return;
      }

      res.json({total: row.total});

    }
  );

});


app.listen(3001,()=>{
  console.log("Server running on port 3001");
});