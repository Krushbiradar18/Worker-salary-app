const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>{
    res.send("Worker Salary API Running");
});


// ADD WORKER
app.post("/workers",(req,res)=>{

const {name,phone,site_id}=req.body;

db.run(
"INSERT INTO workers(name,phone,site_id) VALUES(?,?,?)",
[name,phone,site_id],
function(err){

if(err){
res.status(500).json(err);
return;
}

res.json({
message:"Worker added"
});

});

});


// GET ALL WORKERS
app.get("/workers",(req,res)=>{

const site_id=req.query.site_id;

db.all(
"SELECT * FROM workers WHERE site_id=?",
[site_id],
(err,rows)=>{

if(err){
res.status(500).json(err);
return;
}

res.json(rows);

});

});

// DELETE WORKER

app.delete("/workers/:id", (req, res) => {

    const workerId = req.params.id;

    db.run(
        "DELETE FROM workers WHERE id = ?",
        [workerId],
        function(err){

            if(err){
                res.status(500).json(err);
                return;
            }

            if(this.changes === 0){
                res.status(404).json({message:"Worker not found"});
                return;
            }

            res.json({
                message: "Worker deleted"
            });

        }
    );

});

// SET MONTHLY RATE
app.post("/rate", (req, res) => {

    const {month, year, rate} = req.body;

    db.run(
        "INSERT INTO monthly_settings (month, year, rate) VALUES (?,?,?)",
        [month, year, rate],
        function(err){

            if(err){
                res.status(500).json(err);
                return;
            }

            res.json({
                message: "Rate saved"
            });

        }
    );

});

app.get("/rate", (req,res)=>{

    db.all("SELECT * FROM monthly_settings", [], (err, rows)=>{

        if(err){
            res.status(500).json(err);
            return;
        }

        res.json(rows);

    });

});

// ADD OR UPDATE ATTENDANCE
app.post("/attendance", (req, res) => {

    const { worker_id, month, year, attendance_count, salary } = req.body;

    // check if record already exists
    db.get(
        "SELECT * FROM attendance WHERE worker_id=? AND month=? AND year=?",
        [worker_id, month, year],
        (err, existing) => {

            if(err){
                res.status(500).json(err);
                return;
            }

            // if salary already paid → block update
            if(existing && existing.paid === 1){
                res.status(400).json({
                    message:"Salary already paid. Cannot edit."
                });
                return;
            }

            // get rate
            db.get(
                "SELECT rate FROM monthly_settings WHERE month=? AND year=?",
                [month, year],
                (err,row)=>{

                    if(err){
                        res.status(500).json(err);
                        return;
                    }

                    if(!row){
                        res.status(400).json({message:"Rate not set"});
                        return;
                    }

                    const rate=row.rate;

                    const finalSalary = salary ? salary : attendance_count * rate;

                    // insert or update
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

        }
    );

});

app.get("/attendance", (req,res)=>{

    db.all("SELECT * FROM attendance", [], (err, rows)=>{

        if(err){
            res.status(500).json(err);
            return;
        }

        res.json(rows);

    });

});

// MARK SALARY AS PAID
app.put("/attendance/paid/:id", (req, res) => {

    const id = req.params.id;

    db.run(
        "UPDATE attendance SET paid = 1 WHERE id = ?",
        [id],
        function(err){

            if(err){
                res.status(500).json(err);
                return;
            }

            res.json({
                message:"Salary marked as paid"
            });

        }
    );

});

// ADD SITE

app.post("/sites",(req,res)=>{

const {name}=req.body;

db.run(
"INSERT INTO sites(name) VALUES(?)",
[name],
function(err){

if(err){
res.status(500).json(err);
return;
}

res.json({
message:"Site added",
id:this.lastID
});

});

});

// GET ALL SITES
app.get("/sites",(req,res)=>{

db.all("SELECT * FROM sites",[],(err,rows)=>{

if(err){
res.status(500).json(err);
return;
}

res.json(rows);

});

});

app.listen(3001, ()=>{
    console.log("Server running on port 3001");
});