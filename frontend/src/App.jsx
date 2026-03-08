import { useEffect, useState } from "react";
import axios from "axios";

function App(){

const API="http://localhost:3001";

const [sites,setSites]=useState([]);
const [siteName,setSiteName]=useState("");
const [selectedSite,setSelectedSite]=useState("");

const [workers,setWorkers]=useState([]);
const [attendanceData,setAttendanceData]=useState([]);
const [advancesData,setAdvancesData]=useState({});  // {workerId: [advances...]}

const [name,setName]=useState("");
const [phone,setPhone]=useState("");
const [workerRate,setWorkerRate]=useState("");
const [role,setRole]=useState("Worker");

const [attendance,setAttendance]=useState({});
const [salaryEdit,setSalaryEdit]=useState({});
const [advanceEdit,setAdvanceEdit]=useState({});
const [remarkEdit,setRemarkEdit]=useState({});

const [month,setMonth]=useState(new Date().getMonth()+1);
const [year,setYear]=useState(new Date().getFullYear());

const monthNames=[
"January","February","March","April",
"May","June","July","August",
"September","October","November","December"
];


// GET SITES
const getSites=async()=>{
const res=await axios.get(`${API}/sites`);
setSites(res.data);
};


// ADD SITE
const addSite=async()=>{

if(!siteName){
alert("Enter site name");
return;
}

await axios.post(`${API}/sites`,{
name:siteName
});

setSiteName("");

getSites();

};


// GET WORKERS
const getWorkers=async(siteId)=>{

if(!siteId) return;

const res=await axios.get(`${API}/workers?site_id=${siteId}`);

setWorkers(res.data);

};


// GET ATTENDANCE
const getAttendance=async()=>{
const res=await axios.get(`${API}/attendance`);
setAttendanceData(res.data);
};


// GET ADVANCES FOR ALL WORKERS
const getAdvances=async()=>{
if(workers.length === 0) return;

const advancesMap = {};
for(const worker of workers) {
  try {
    const res = await axios.get(`${API}/advances/${worker.id}/${month}/${year}`);
    advancesMap[worker.id] = res.data;
  } catch(err) {
    advancesMap[worker.id] = [];
  }
}
setAdvancesData(advancesMap);
};


// ADD NEW ADVANCE
const addAdvance=async(workerId, amount, remark)=>{

if(!amount || amount <= 0) {
  alert("Enter valid advance amount");
  return;
}

await axios.post(`${API}/advances`, {
  worker_id: workerId,
  month,
  year,
  amount: Number(amount),
  remark: remark || ""
});

// Refresh advances data
getAdvances();
alert(`Advance of ₹${amount} added successfully!`);

};


// ADD WORKER
const addWorker=async()=>{

if(!name||!phone||!selectedSite||!workerRate){
alert("Enter worker details, rate and select site");
return;
}

await axios.post(`${API}/workers`,{
name,
phone,
site_id:selectedSite,
rate: Number(workerRate),
role
});

setName("");
setPhone("");
setWorkerRate("");
setRole("Worker");

getWorkers(selectedSite);

};


// DELETE WORKER
const deleteWorker=async(id)=>{
await axios.delete(`${API}/workers/${id}`);
getWorkers(selectedSite);
};



// CHANGE ATTENDANCE
const handleAttendanceChange=(workerId,value)=>{

setAttendance({
...attendance,
[workerId]:value
});

};


// CHANGE SALARY
const handleSalaryChange=(workerId,value)=>{

setSalaryEdit({
...salaryEdit,
[workerId]:value
});

};


// CHANGE ADVANCE
const handleAdvanceChange=(workerId,value)=>{

setAdvanceEdit({
...advanceEdit,
[workerId]:value
});

};


// CHANGE REMARK
const handleRemarkChange=(workerId,value)=>{

setRemarkEdit({
...remarkEdit,
[workerId]:value
});

};


// SAVE ATTENDANCE
const saveAttendance=async(workerId)=>{

const count=attendance[workerId] ?? 0;
const manualSalary=salaryEdit[workerId];
const advanceAmount=advanceEdit[workerId] ?? 0;
const remarkText=remarkEdit[workerId] ?? "";

const res=await axios.post(`${API}/attendance`,{
worker_id:workerId,
month,
year,
attendance_count:count,
salary:manualSalary,
advance:advanceAmount,
remark:remarkText
});

alert(`Saved! Salary: ₹${res.data.salary}, Advance: ₹${res.data.advance}, Final Pay: ₹${res.data.finalPay}`);

getAttendance();

};


// MARK PAID
const markPaid=async(id)=>{

await axios.put(`${API}/attendance/paid/${id}`);

alert("Salary marked paid");

getAttendance();

};


// LOAD INITIAL DATA
useEffect(()=>{
getSites();
getAttendance();
},[]);


// LOAD WORKERS WHEN SITE CHANGES
useEffect(()=>{
if(selectedSite){
getWorkers(selectedSite);
}
},[selectedSite]);


// LOAD ADVANCES WHEN WORKERS, MONTH, OR YEAR CHANGES
useEffect(()=>{
if(workers.length > 0) {
  getAdvances();
}
},[workers, month, year]);


return(

<div style={{padding:"40px",fontFamily:"Arial",maxWidth:"900px",margin:"auto"}}>

<h1>Worker Salary System</h1>


<h2>Add Site</h2>

<input
placeholder="Site Name"
value={siteName}
onChange={(e)=>setSiteName(e.target.value)}
/>

<button onClick={addSite} style={{marginLeft:"10px"}}>
Add Site
</button>



<h2>Select Site</h2>

<select
value={selectedSite}
onChange={(e)=>setSelectedSite(Number(e.target.value))}
>

<option value="">Select Site</option>

{sites.map(site=>(
<option key={site.id} value={site.id}>
{site.name}
</option>
))}

</select>



<h2>Add Worker</h2>

<input
placeholder="Name"
value={name}
onChange={(e)=>setName(e.target.value)}
/>

<input
placeholder="Phone"
value={phone}
onChange={(e)=>setPhone(e.target.value)}
style={{marginLeft:"10px"}}
/>

<input
type="number"
placeholder="Rate (per day)"
value={workerRate}
onChange={(e)=>setWorkerRate(e.target.value)}
style={{marginLeft:"10px"}}
/>

<select
value={role}
onChange={(e)=>setRole(e.target.value)}
style={{marginLeft:"10px"}}
>
<option value="Worker">Worker</option>
<option value="Mason">Mason</option>
<option value="Helper">Helper</option>
<option value="Supervisor">Supervisor</option>
</select>

<button onClick={addWorker} style={{marginLeft:"10px"}}>
Add Worker
</button>




<h2>
Attendance - {monthNames[month-1]} {year}
</h2>

<table border="1" cellPadding="10" style={{width:"100%"}}>

<thead>
<tr>
<th>Site</th>
<th>Worker</th>
<th>Role</th>
<th>Rate</th>
<th>Attendance</th>
<th>Salary</th>
<th>Advances</th>
<th>Final Pay</th>
<th>Save</th>
<th>Paid</th>
</tr>
</thead>

<tbody>

{workers.map(worker=>{

const site = sites.find(s => s.id === worker.site_id);

const saved=attendanceData.find(
a=>a.worker_id===worker.id && a.month===month && a.year===year
);

const attendanceValue=
attendance[worker.id] ??
saved?.attendance_count ??
0;

const salaryValue=
salaryEdit[worker.id] ??
saved?.salary ??
attendanceValue*(worker.rate||0);

// Get advances for this worker
const workerAdvances = advancesData[worker.id] || [];
const totalAdvances = workerAdvances.reduce((sum, advance) => sum + advance.amount, 0);

const finalPayValue = salaryValue - totalAdvances;

const isPaid=saved?.paid===1;

return(

<tr key={worker.id}>

<td>{site ? site.name : "-"}</td>

<td>{worker.name}</td>

<td>{worker.role || "Worker"}</td>

<td>₹{worker.rate || 0}</td>

<td>
<input
type="number"
value={attendanceValue}
disabled={isPaid}
onChange={(e)=>handleAttendanceChange(worker.id,e.target.value)}
/>
</td>

<td>
<input
type="number"
value={salaryValue}
disabled={isPaid}
onChange={(e)=>handleSalaryChange(worker.id,e.target.value)}
/>
</td>

<td style={{verticalAlign: "top", padding: "8px"}}>
<div style={{minWidth:"200px"}}>
  {/* Total Advances Display */}
  {totalAdvances > 0 ? (
    <div style={{marginBottom:"8px", padding:"6px", backgroundColor:"#fff3cd", border:"1px solid #ffeaa7", borderRadius:"4px", textAlign:"center"}}>
      <strong style={{color:"#856404"}}>Total: ₹{totalAdvances}</strong>
    </div>
  ) : null}
  
  {/* Advanced History List */}
  {workerAdvances.length > 0 && (
    <div style={{marginBottom:"8px"}}>
      {workerAdvances.map((advance, idx) => (
        <div key={advance.id} style={{
          display:"flex", 
          justifyContent:"space-between", 
          alignItems:"center",
          padding:"4px 6px", 
          marginBottom:"3px", 
          backgroundColor:"#f8f9fa", 
          border:"1px solid #dee2e6", 
          borderRadius:"3px",
          fontSize:"11px"
        }}>
          <div>
            <span style={{fontWeight:"bold", color:"#dc3545"}}>₹{advance.amount}</span>
            <div style={{color:"#6c757d", fontSize:"10px"}}>{advance.remark || "No reason"}</div>
          </div>
          <span style={{fontSize:"10px", color:"#495057", fontWeight:"500"}}>{advance.date}</span>
        </div>
      ))}
    </div>
  )}
  
  {/* Add New Advance */}
  {!isPaid && (
    <div style={{border:"1px dashed #ced4da", borderRadius:"4px", padding:"6px", backgroundColor:"#f8f9fa"}}>
      <div style={{display:"flex", gap:"4px", marginBottom:"4px"}}>
        <input
          type="number"
          placeholder="Amount"
          id={`advance-${worker.id}`}
          style={{
            flex:"1", 
            padding:"4px", 
            fontSize:"11px", 
            border:"1px solid #ced4da", 
            borderRadius:"3px",
            outline:"none"
          }}
        />
        <input
          type="text"
          placeholder="Reason"
          id={`remark-${worker.id}`}
          style={{
            flex:"2", 
            padding:"4px", 
            fontSize:"11px", 
            border:"1px solid #ced4da", 
            borderRadius:"3px",
            outline:"none"
          }}
        />
      </div>
      <button
        onClick={()=>{
          const amount = document.getElementById(`advance-${worker.id}`).value;
          const remark = document.getElementById(`remark-${worker.id}`).value;
          if(amount && Number(amount) > 0) {
            addAdvance(worker.id, amount, remark);
            document.getElementById(`advance-${worker.id}`).value = '';
            document.getElementById(`remark-${worker.id}`).value = '';
          } else {
            alert("Please enter a valid amount");
          }
        }}
        style={{
          width:"100%", 
          padding:"4px", 
          fontSize:"11px", 
          backgroundColor:"#28a745", 
          color:"white", 
          border:"none", 
          borderRadius:"3px", 
          cursor:"pointer"
        }}
      >
        + Add Advance
      </button>
    </div>
  )}
  
  {/* Empty State */}
  {workerAdvances.length === 0 && (
    <div style={{textAlign:"center", color:"#6c757d", fontSize:"11px", fontStyle:"italic", padding:"12px"}}>
      No advances given
    </div>
  )}
</div>
</td>

<td style={{fontWeight:"bold", color: finalPayValue < 0 ? "red" : "green"}}>
₹{finalPayValue}
</td>

<td>
<button
disabled={isPaid}
onClick={()=>saveAttendance(worker.id)}
>
Save
</button>
</td>

<td>
{isPaid ?
<span style={{color:"green"}}>Paid ✔</span>
:
saved ?
<button onClick={()=>markPaid(saved.id)}>
Mark Paid
</button>
:
"-"
}
</td>

</tr>

);

})}

</tbody>

</table>

</div>

);

}

export default App;