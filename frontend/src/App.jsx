import { useEffect, useState } from "react";
import axios from "axios";

function App(){

const API="http://localhost:3001";

const [sites,setSites]=useState([]);
const [siteName,setSiteName]=useState("");
const [selectedSite,setSelectedSite]=useState("");

const [workers,setWorkers]=useState([]);
const [attendanceData,setAttendanceData]=useState([]);

const [name,setName]=useState("");
const [phone,setPhone]=useState("");
const [workerRate,setWorkerRate]=useState("");
const [role,setRole]=useState("Worker");

const [attendance,setAttendance]=useState({});
const [salaryEdit,setSalaryEdit]=useState({});

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


// SAVE ATTENDANCE
const saveAttendance=async(workerId)=>{

const count=attendance[workerId] ?? 0;

const manualSalary=salaryEdit[workerId];

const res=await axios.post(`${API}/attendance`,{
worker_id:workerId,
month,
year,
attendance_count:count,
salary:manualSalary
});

alert("Saved salary ₹"+res.data.salary);

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