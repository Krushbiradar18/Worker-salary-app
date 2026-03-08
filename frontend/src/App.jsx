import { useEffect, useState } from "react";
import axios from "axios";

function App(){

const API="http://localhost:3001";

const [sites,setSites]=useState([]);
const [selectedSite,setSelectedSite]=useState("");

const [workers,setWorkers]=useState([]);
const [attendanceData,setAttendanceData]=useState([]);

const [name,setName]=useState("");
const [phone,setPhone]=useState("");

const [attendance,setAttendance]=useState({});
const [salaryEdit,setSalaryEdit]=useState({});

const [month,setMonth]=useState(new Date().getMonth()+1);
const [year,setYear]=useState(new Date().getFullYear());
const [rate,setRate]=useState("");

const [siteName,setSiteName] = useState("");
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


// GET WORKERS BY SITE
const getWorkers=async()=>{

if(!selectedSite) return;

const res=await axios.get(`${API}/workers?site_id=${selectedSite}`);

setWorkers(res.data);

};


// GET ATTENDANCE
const getAttendance=async()=>{
const res=await axios.get(`${API}/attendance`);
setAttendanceData(res.data);
};


// ADD WORKER
const addWorker=async()=>{

if(!name||!phone||!selectedSite){
alert("Enter name, phone and select site");
return;
}

await axios.post(`${API}/workers`,{
name,
phone,
site_id:selectedSite
});

setName("");
setPhone("");

getWorkers();

};


// DELETE WORKER
const deleteWorker=async(id)=>{
await axios.delete(`${API}/workers/${id}`);
getWorkers();
};
// ADD SITE
const addSite = async () => {

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

// SAVE RATE
const saveRate=async()=>{

if(!rate){
alert("Enter rate");
return;
}

await axios.post(`${API}/rate`,{
month,
year,
rate
});

alert("Rate saved");

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


// LOAD DATA
useEffect(()=>{
getSites();
getAttendance();
},[]);


// LOAD WORKERS WHEN SITE CHANGES
useEffect(()=>{
getWorkers();
},[selectedSite]);


return(

<div style={{
padding:"40px",
fontFamily:"Arial",
maxWidth:"900px",
margin:"auto"
}}>

<h1>Worker Salary System</h1>
<div style={{
border:"1px solid #ddd",
padding:"20px",
marginBottom:"20px",
borderRadius:"8px"
}}>

<h2>Add Site</h2>

<input
placeholder="Site Name"
value={siteName}
onChange={(e)=>setSiteName(e.target.value)}
/>

<button
onClick={addSite}
style={{marginLeft:"10px"}}
>
Add Site
</button>

</div>

{/* SELECT SITE */}

<div style={{
border:"1px solid #ddd",
padding:"20px",
marginBottom:"20px",
borderRadius:"8px"
}}>

<h2>Select Site</h2>

<select
value={selectedSite}
onChange={(e)=>setSelectedSite(e.target.value)}
>

<option value="">Select Site</option>

{sites.map(site=>(
<option key={site.id} value={site.id}>
{site.name}
</option>
))}

</select>

</div>



{/* ADD WORKER */}

<div style={{
border:"1px solid #ddd",
padding:"20px",
marginBottom:"20px",
borderRadius:"8px"
}}>

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

<button
onClick={addWorker}
style={{marginLeft:"10px"}}
>
Add Worker
</button>

</div>



{/* MONTH SETUP */}

<div style={{
border:"1px solid #ddd",
padding:"20px",
marginBottom:"20px",
borderRadius:"8px"
}}>

<h2>Salary Month Setup</h2>

<label>Month:</label>

<select
value={month}
onChange={(e)=>setMonth(Number(e.target.value))}
style={{marginLeft:"10px"}}
>

<option value={1}>January</option>
<option value={2}>February</option>
<option value={3}>March</option>
<option value={4}>April</option>
<option value={5}>May</option>
<option value={6}>June</option>
<option value={7}>July</option>
<option value={8}>August</option>
<option value={9}>September</option>
<option value={10}>October</option>
<option value={11}>November</option>
<option value={12}>December</option>

</select>


<label style={{marginLeft:"20px"}}>Year:</label>

<input
type="number"
value={year}
min="2020"
max="2100"
onChange={(e)=>setYear(Number(e.target.value))}
style={{marginLeft:"10px"}}
/>


<label style={{marginLeft:"20px"}}>Rate:</label>

<input
type="number"
value={rate}
onChange={(e)=>setRate(e.target.value)}
style={{marginLeft:"10px"}}
/>

<button
onClick={saveRate}
style={{marginLeft:"10px"}}
>
Save Rate
</button>

</div>



{/* ATTENDANCE */}

<h2>
Attendance - {monthNames[month-1]} {year}
</h2>

<table
style={{
width:"100%",
borderCollapse:"collapse"
}}
border="1"
cellPadding="10"
>

<thead>

<tr>
<th>Worker</th>
<th>Attendance</th>
<th>Salary</th>
<th>Save</th>
<th>Paid</th>
</tr>

</thead>

<tbody>

{workers.map(worker=>{

const saved=attendanceData.find(
a=>a.worker_id===worker.id && a.month==month && a.year==year
);

const attendanceValue=
attendance[worker.id] ??
saved?.attendance_count ??
0;

const salaryValue=
salaryEdit[worker.id] ??
saved?.salary ??
attendanceValue*(rate||0);

const isPaid=saved?.paid===1;

return(

<tr key={worker.id}>

<td>{worker.name}</td>


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