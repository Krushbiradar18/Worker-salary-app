import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
const [rateEdit,setRateEdit]=useState({}); // Add rate editing state
const [viewAdvancesFor,setViewAdvancesFor]=useState(null); // Track which worker's advances are being viewed
const [autoSaveEnabled,setAutoSaveEnabled]=useState(false); // Auto-save toggle
const [autoSaveStatus,setAutoSaveStatus]=useState(""); // Auto-save feedback

const [month,setMonth]=useState(new Date().getMonth()+1);
const [year,setYear]=useState(new Date().getFullYear());

// Excel Upload States
const [excelFile, setExcelFile] = useState(null);
const [previewWorkers, setPreviewWorkers] = useState([]);
const [showPreview, setShowPreview] = useState(false);
const [isUploading, setIsUploading] = useState(false);

// Column visibility states
const [hideRateColumn, setHideRateColumn] = useState(false);

const monthNames=[
"January","February","March","April",
"May","June","July","August",
"September","October","November","December"
];

// COLOR BADGE FUNCTION FOR ADVANCES
const getAdvanceBadgeColor=(amount)=>{
if(amount >= 5000) return {bg:"#dc3545", text:"white"}; // Red for high amounts
if(amount >= 2000) return {bg:"#fd7e14", text:"white"}; // Orange for medium amounts  
if(amount >= 1000) return {bg:"#ffc107", text:"black"}; // Yellow for moderate amounts
if(amount >= 500) return {bg:"#20c997", text:"white"};  // Teal for small amounts
return {bg:"#6f42c1", text:"white"}; // Purple for very small amounts
};

// DOWNLOAD PDF FUNCTION
const downloadAttendancePDF = () => {
  if (!selectedSite) {
    alert("Please select a site first");
    return;
  }

  // Filter workers for selected site
  const siteWorkers = workers.filter(w => w.site_id === selectedSite);
  if (siteWorkers.length === 0) {
    alert("No workers found for selected site");
    return;
  }

  const site = sites.find(s => s.id === selectedSite);
  
  try {
    const doc = new jsPDF();
    
    // Check if autoTable is available
    if (typeof doc.autoTable !== 'function') {
      console.error('autoTable plugin not loaded');
      alert('PDF generation error: autoTable plugin not available. Please refresh the page and try again.');
      return;
    }
    
    // Add title and header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(`Attendance Report`, 14, 20);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(`Site: ${site?.name || 'Unknown Site'}`, 14, 30);
    
    doc.setFontSize(12);
    doc.text(`Period: ${monthNames[month-1]} ${year}`, 14, 37);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 120, 37);
    
    // Prepare table data
    const tableData = siteWorkers.map(worker => {
      const saved = attendanceData.find(
        a => a.worker_id === worker.id && a.month === month && a.year === year
      );
      
      const attendanceValue = attendance[worker.id] ?? saved?.attendance_count ?? 0;
      const salaryValue = salaryEdit[worker.id] ?? saved?.salary ?? (attendanceValue * (worker.rate || 0));
      const workerAdvances = advancesData[worker.id] || [];
      const totalAdvances = workerAdvances.reduce((sum, advance) => sum + advance.amount, 0);
      const finalPay = salaryValue - totalAdvances;
      const isPaid = saved?.paid === 1;
      
      return [
        worker.name,
        worker.role || 'Worker',
        'Rs. ' + (worker.rate || 0).toString(),
        attendanceValue.toString(),
        'Rs. ' + salaryValue.toString(),
        'Rs. ' + totalAdvances.toString(),
        'Rs. ' + finalPay.toString(),
        isPaid ? 'Paid' : 'Pending'
      ];
    });
    
    // Prepare table data - ALWAYS exclude rate AND role columns from PDF
    console.log('PDF Generation - Rate and Role columns always excluded from PDF');
    const headers = ['Worker', 'Days', 'Salary', 'Advances', 'Final Pay', 'Status'];
    
    console.log('PDF Headers:', headers);
    const processedTableData = tableData.map(row => [row[0], row[3], row[4], row[5], row[6], row[7]]); // Always skip rate (index 2) and role (index 1) columns
    
    // Calculate totals for summary - Rate column always excluded from PDF
    const totalWorkers = siteWorkers.length;
    
    // Calculate totals using the processedTableData (rate and role always excluded from PDF)
    const salaryIndex = 1; // Salary column index (rate and role always excluded)
    const advancesIndex = 2; // Advances column index (rate and role always excluded)
    const finalPayIndex = 3; // Final pay column index (rate and role always excluded)
    
    const totalSalary = processedTableData.reduce((sum, row) => {
      const salary = parseFloat(row[salaryIndex].replace('Rs. ', ''));
      return sum + (isNaN(salary) ? 0 : salary);
    }, 0);
    
    const totalAdvancesAll = processedTableData.reduce((sum, row) => {
      const advances = parseFloat(row[advancesIndex].replace('Rs. ', ''));
      return sum + (isNaN(advances) ? 0 : advances);
    }, 0);
        
    const totalFinalPay = processedTableData.reduce((sum, row) => {
      const finalPay = parseFloat(row[finalPayIndex].replace('Rs. ', ''));
      return sum + (isNaN(finalPay) ? 0 : finalPay);
    }, 0);
    
    console.log('PDF Table Data Sample:', processedTableData[0]);
    
    doc.autoTable({
      head: [headers],
      body: processedTableData,
      startY: 42,
      styles: {
        fontSize: 10,
        cellPadding: 4,
        halign: 'center',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: {halign: 'left', cellWidth: 35}, // Worker name
        1: {halign: 'center', cellWidth: 25}, // Days
        2: {halign: 'right', cellWidth: 35}, // Salary
        3: {halign: 'right', cellWidth: 35}, // Advances
        4: {halign: 'right', cellWidth: 35}, // Final pay
        5: {halign: 'center', cellWidth: 30}  // Status
      },
      margin: { top: 42, left: 14, right: 14 }
    });
    
    // Add summary section
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Summary Report', 14, finalY);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Workers: ${totalWorkers}`, 14, finalY + 12);
    doc.text(`Total Salary: Rs. ${totalSalary.toLocaleString()}`, 14, finalY + 22);
    doc.text(`Total Advances: Rs. ${totalAdvancesAll.toLocaleString()}`, 14, finalY + 32);
    doc.text(`Net Amount: Rs. ${totalFinalPay.toLocaleString()}`, 14, finalY + 42);
    
    // Save the PDF
    const fileName = `${site?.name || 'Site'}-Attendance-${monthNames[month-1]}-${year}.pdf`;
    doc.save(fileName);
    
    alert(`PDF downloaded successfully: ${fileName}`);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Error generating PDF. Please try again or refresh the page.');
  }
};


// EXCEL UPLOAD FUNCTIONS

// HANDLE EXCEL FILE UPLOAD
const handleExcelUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  setExcelFile(file);
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Get first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        alert('Excel file should have at least one header row and one data row');
        return;
      }
      
      // Parse data - expecting columns: Name, Phone, Rate, Role (optional)
      const headers = jsonData[0].map(h => h.toString().toLowerCase().trim());
      console.log('Excel headers detected:', headers);
      const nameIndex = headers.findIndex(h => h.includes('name'));
      const phoneIndex = headers.findIndex(h => h.includes('phone'));
      const rateIndex = headers.findIndex(h => h.includes('rate'));
      const roleIndex = headers.findIndex(h => h.includes('role'));
      
      console.log('Column indices - Name:', nameIndex, 'Phone:', phoneIndex, 'Rate:', rateIndex, 'Role:', roleIndex);
      
      if (nameIndex === -1 || phoneIndex === -1) {
        alert('Excel file must have "Name" and "Phone" columns');
        return;
      }
      
      const parsedWorkers = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        console.log('Processing row', i, ':', row);
        if (!row[nameIndex] || !row[phoneIndex]) continue;
        
        const workerData = {
          name: row[nameIndex].toString().trim(),
          phone: row[phoneIndex].toString().trim(),
          rate: rateIndex !== -1 && row[rateIndex] ? Number(row[rateIndex]) || 500 : 500,
          role: roleIndex !== -1 && row[roleIndex] ? row[roleIndex].toString().trim() : 'Worker',
          site_id: selectedSite
        };
        
        console.log('Parsed worker:', workerData);
        parsedWorkers.push(workerData);
      }
      
      if (parsedWorkers.length === 0) {
        alert('No valid worker data found in Excel file');
        return;
      }
      
      setPreviewWorkers(parsedWorkers);
      setShowPreview(true);
      
    } catch (error) {
      console.error('Excel parsing error:', error);
      alert('Error reading Excel file. Please check the file format.');
    }
  };
  
  reader.readAsArrayBuffer(file);
};

// UPDATE PREVIEW WORKER ROLE
const updatePreviewWorkerRole = (index, newRole) => {
  const updatedWorkers = [...previewWorkers];
  updatedWorkers[index].role = newRole;
  setPreviewWorkers(updatedWorkers);
};

// DELETE PREVIEW WORKER
const deletePreviewWorker = (index) => {
  const updatedWorkers = previewWorkers.filter((_, i) => i !== index);
  setPreviewWorkers(updatedWorkers);
};

// BULK IMPORT WORKERS
const bulkImportWorkers = async () => {
  if (!selectedSite) {
    alert('Please select a site first');
    return;
  }
  
  if (previewWorkers.length === 0) {
    alert('No workers to import');
    return;
  }
  
  setIsUploading(true);
  
  try {
    const response = await axios.post(`${API}/workers/bulk`, {
      workers: previewWorkers
    });
    
    alert(`Import completed! ${response.data.successCount} workers added successfully.${response.data.errorCount > 0 ? ` ${response.data.errorCount} errors occurred.` : ''}`);
    
    // Reset states
    setExcelFile(null);
    setPreviewWorkers([]);
    setShowPreview(false);
    
    // Reset file input
    const fileInput = document.getElementById('excel-upload');
    if (fileInput) fileInput.value = '';
    
    // Refresh workers list
    getWorkers(selectedSite);
    
  } catch (error) {
    console.error('Bulk import error:', error);
    alert('Error importing workers: ' + (error.response?.data?.error || error.message));
  } finally {
    setIsUploading(false);
  }
};

// CANCEL PREVIEW
const cancelPreview = () => {
  setExcelFile(null);
  setPreviewWorkers([]);
  setShowPreview(false);
  
  // Reset file input
  const fileInput = document.getElementById('excel-upload');
  if (fileInput) fileInput.value = '';
};


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


// CHANGE RATE
const handleRateChange=(workerId,value)=>{

setRateEdit({
...rateEdit,
[workerId]:value
});

};


// UPDATE WORKER RATE IN DATABASE
const updateWorkerRate=async(workerId)=>{

const newRate = rateEdit[workerId];

if(!newRate || newRate <= 0){
alert("Enter valid rate");
return;
}

try {
  await axios.put(`${API}/workers/${workerId}/rate`, {
    rate: Number(newRate)
  });
  
  alert("Rate updated successfully!");
  
  // Refresh workers list
  getWorkers(selectedSite);
  
  // Clear the edit state 
  setRateEdit({
    ...rateEdit,
    [workerId]: undefined
  });
  
} catch (error) {
  console.error('Rate update error:', error);
  alert("Error updating rate. Please try again.");
}

};


// SAVE ATTENDANCE
const saveAttendance=async(workerId, isAutoSave = false)=>{

const count=attendance[workerId] ?? 0;
const manualSalary=salaryEdit[workerId];
const advanceAmount=advanceEdit[workerId] ?? 0;
const remarkText=remarkEdit[workerId] ?? "";

try {
  const res=await axios.post(`${API}/attendance`,{
    worker_id:workerId,
    month,
    year,
    attendance_count:count,
    salary:manualSalary,
    advance:advanceAmount,
    remark:remarkText
  });

  if (isAutoSave) {
    setAutoSaveStatus("✓ Auto-saved");
    setTimeout(() => setAutoSaveStatus(""), 2000);
  } else {
    alert(`Saved! Salary: ₹${res.data.salary}, Advance: ₹${res.data.advance}, Final Pay: ₹${res.data.finalPay}`);
  }

  getAttendance();
} catch (error) {
  console.error('Save error:', error);
  if (isAutoSave) {
    setAutoSaveStatus("❌ Auto-save failed");
    setTimeout(() => setAutoSaveStatus(""), 3000);
  } else {
    alert("Error saving attendance. Please try again.");
  }
}

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

// RESET ATTENDANCE STATES WHEN MONTH/YEAR CHANGES
useEffect(() => {
  // Reset all form states when month/year changes
  setAttendance({});
  setSalaryEdit({});
  setAdvanceEdit({});
  setRemarkEdit({});
  setRateEdit({});
  setViewAdvancesFor(null);
  
  // Reload attendance data for the new month/year
  getAttendance();
}, [month, year]);

// AUTO-SAVE FUNCTIONALITY
useEffect(() => {
  if (!autoSaveEnabled) return;
  
  const saveTimeouts = {};
  
  Object.keys(attendance).forEach(workerId => {
    if (saveTimeouts[workerId]) {
      clearTimeout(saveTimeouts[workerId]);
    }
    
    saveTimeouts[workerId] = setTimeout(() => {
      const worker = workers.find(w => w.id === parseInt(workerId));
      if (worker) {
        const saved = attendanceData.find(
          a => a.worker_id === worker.id && a.month === month && a.year === year
        );
        if (!saved?.paid) {
          saveAttendance(parseInt(workerId), true);
        }
      }
    }, 2000); // Auto-save after 2 seconds of no changes
  });
  
  return () => {
    Object.values(saveTimeouts).forEach(timeout => clearTimeout(timeout));
  };
}, [attendance, salaryEdit, advanceEdit, remarkEdit, autoSaveEnabled]);


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



{/* Excel Upload Section */}
{selectedSite && (
<div style={{margin:"20px 0", padding:"20px", backgroundColor:"#f8f9fa", borderRadius:"8px", border:"2px dashed #dee2e6"}}>
  <h3 style={{color:"#495057", marginBottom:"15px"}}> Bulk Import Workers</h3>
  
  {!showPreview ? (
    <div>
      <p style={{color:"#6c757d", fontSize:"14px", marginBottom:"15px"}}>
        Upload an Excel file with worker details. Required columns: <strong>Name</strong>, <strong>Phone</strong>. Optional: <strong>Rate</strong> (default: 500), <strong>Role</strong> (default: Worker). Note: Rates can be edited later in the attendance table.
      </p>
      
      <div style={{display:"flex", alignItems:"center", gap:"15px"}}>
        <input
          id="excel-upload"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleExcelUpload}
          style={{
            padding:"10px",
            border:"1px solid #ced4da",
            borderRadius:"4px",
            backgroundColor:"white",
            cursor:"pointer",
            flex:"1"
          }}
        />
        
        <button
          onClick={() => alert('Excel Template Format:\n\nRequired columns:\n• Name: Worker\'s name\n• Phone: Phone number\n\nOptional columns:\n• Rate: Daily rate (default: 500, editable later in attendance)\n• Role: Worker, Mason, Helper, Supervisor\n\nExample:\nName | Phone | Rate | Role\nJohn | 9876543210 | 600 | Mason\nJane | 8765432109 | 500 | Worker\n\nNote: Rates can be edited in the attendance table after import.')}
          style={{
            padding:"8px 16px",
            backgroundColor:"#6c757d",
            color:"white",
            border:"none",
            borderRadius:"4px",
            fontSize:"12px",
            fontWeight:"bold",
            whiteSpace:"nowrap",
            cursor:"pointer"
          }}
        >
          📄 Template Format
        </button>
      </div>
    </div>
  ) : (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
        <h4 style={{margin:"0", color:"#495057"}}>Preview Workers ({previewWorkers.length} found)</h4>
        <div>
          <button
            onClick={cancelPreview}
            style={{
              padding:"8px 16px",
              backgroundColor:"#6c757d",
              color:"white",
              border:"none",
              borderRadius:"4px",
              cursor:"pointer",
              marginRight:"10px",
              fontSize:"12px"
            }}
          >
            Cancel
          </button>
          <button
            onClick={bulkImportWorkers}
            disabled={isUploading}
            style={{
              padding:"8px 16px",
              backgroundColor: isUploading ? "#6c757d" : "#28a745",
              color:"white",
              border:"none",
              borderRadius:"4px",
              cursor: isUploading ? "not-allowed" : "pointer",
              fontSize:"12px",
              fontWeight:"bold"
            }}
          >
            {isUploading ? "Importing..." : "✓ Import All"}
          </button>
        </div>
      </div>
      
      <div style={{maxHeight:"300px", overflowY:"auto", border:"1px solid #dee2e6", borderRadius:"4px", backgroundColor:"white"}}>
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead style={{backgroundColor:"#e9ecef", position:"sticky", top:"0"}}>
            <tr>
              <th style={{padding:"10px", textAlign:"left", borderBottom:"1px solid #dee2e6", width:"25%", color:"#212529"}}>Name</th>
              <th style={{padding:"10px", textAlign:"left", borderBottom:"1px solid #dee2e6", width:"20%", color:"#212529"}}>Phone</th>
              <th style={{padding:"10px", textAlign:"left", borderBottom:"1px solid #dee2e6", width:"15%", color:"#212529"}}>Rate</th>
              <th style={{padding:"10px", textAlign:"left", borderBottom:"1px solid #dee2e6", width:"20%", color:"#212529"}}>Role</th>
              <th style={{padding:"10px", textAlign:"center", borderBottom:"1px solid #dee2e6", width:"20%", color:"#212529"}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {previewWorkers.map((worker, index) => {
              console.log('Rendering worker', index, ':', worker);
              return (
              <tr key={index} style={{borderBottom:"1px solid #f1f3f4"}}>
                <td style={{padding:"10px", fontSize:"14px", fontWeight:"500", color:"#212529"}}>{worker.name}</td>
                <td style={{padding:"10px", fontSize:"14px", color:"#495057"}}>{worker.phone}</td>
                <td style={{padding:"10px", fontSize:"14px", color:"#212529"}}>₹{worker.rate}</td>
                <td style={{padding:"8px"}}>
                  <select
                    value={worker.role}
                    onChange={(e) => updatePreviewWorkerRole(index, e.target.value)}
                    style={{
                      padding:"6px",
                      border:"1px solid #ced4da",
                      borderRadius:"4px",
                      fontSize:"14px",
                      width:"100px",
                      backgroundColor:"white"
                    }}
                  >
                    <option value="Worker">Worker</option>
                    <option value="Mason">Mason</option>
                    <option value="Helper">Helper</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                </td>
                <td style={{padding:"8px", textAlign:"center"}}>
                  <button
                    onClick={() => deletePreviewWorker(index)}
                    style={{
                      padding:"6px 12px",
                      backgroundColor:"#dc3545",
                      color:"white",
                      border:"none",
                      borderRadius:"4px",
                      cursor:"pointer",
                      fontSize:"12px",
                      fontWeight:"bold"
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
                    onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
                  >
                    🗑 Delete
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <p style={{fontSize:"12px", color:"#6c757d", marginTop:"10px", fontStyle:"italic"}}>
        Review the data above, edit roles if needed, and delete unwanted entries. Rates will be editable in the attendance table after import. Click "Import All" to add these workers to the selected site.
      </p>
    </div>
  )}
</div>
)}



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




<div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px"}}>
  <h2 style={{margin:"0"}}>
    Attendance - {monthNames[month-1]} {year}
  </h2>
  
  {/* Month and Year Selection */}
  <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
    <label style={{fontSize:"14px", fontWeight:"500"}}>Period:</label>
    <select
      value={month}
      onChange={(e) => {
        setMonth(Number(e.target.value));
        // Reset attendance, salary, advances when month changes
        setAttendance({});
        setSalaryEdit({});
        setAdvanceEdit({});
        setRemarkEdit({});
        setAutoSaveStatus("");
      }}
      style={{
        padding:"6px",
        border:"1px solid #ced4da",
        borderRadius:"4px",
        fontSize:"14px"
      }}
    >
      {monthNames.map((monthName, index) => (
        <option key={index + 1} value={index + 1}>{monthName}</option>
      ))}
    </select>
    
    <select
      value={year}
      onChange={(e) => {
        setYear(Number(e.target.value));
        // Reset attendance, salary, advances when year changes
        setAttendance({});
        setSalaryEdit({});
        setAdvanceEdit({});
        setRemarkEdit({});
        setAutoSaveStatus("");
      }}
      style={{
        padding:"6px",
        border:"1px solid #ced4da",
        borderRadius:"4px",
        fontSize:"14px"
      }}
    >
      {[...Array(10)].map((_, i) => {
        const yearOption = new Date().getFullYear() - 2 + i;
        return <option key={yearOption} value={yearOption}>{yearOption}</option>;
      })}
    </select>
  </div>
</div>

{/* Auto-Save Toggle and PDF Download */}
<div style={{marginBottom:"15px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
  {/* Auto-Save Toggle */}
  <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
    <label style={{display:"flex", alignItems:"center", cursor:"pointer"}}>
      <input
        type="checkbox"
        checked={autoSaveEnabled}
        onChange={(e) => setAutoSaveEnabled(e.target.checked)}
        style={{marginRight:"8px"}}
      />
      <span style={{fontSize:"14px", fontWeight:"500"}}>Auto-Save</span>
    </label>
    {autoSaveStatus && (
      <span style={{
        fontSize:"12px",
        color: autoSaveStatus.includes("failed") ? "#dc3545" : "#28a745",
        fontWeight:"500"
      }}>
        {autoSaveStatus}
      </span>
    )}
  </div>
  
  {/* Download PDF Button */}
  {selectedSite && workers.length > 0 && (
    <div style={{textAlign:"right"}}>
      <button
        onClick={downloadAttendancePDF}
        style={{
          padding:"10px 20px",
          backgroundColor:"#dc3545",
          color:"white",
          border:"none",
          borderRadius:"5px",
          cursor:"pointer",
          fontSize:"14px",
          fontWeight:"bold",
          boxShadow:"0 2px 4px rgba(0,0,0,0.2)",
          transition:"background-color 0.3s ease"
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
        onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
      >
        📄 Download PDF Report
      </button>
      <div style={{fontSize:"11px", color:"#6c757d", marginTop:"5px"}}>
        {sites.find(s => s.id === selectedSite)?.name} - {monthNames[month-1]} {year}
      </div>
    </div>
  )}
</div>

<table border="1" cellPadding="10" style={{width:"100%"}}>

<thead>
<tr>
<th>Site</th>
<th>Worker</th>
<th>Role</th>
{!hideRateColumn && (
<th style={{position: 'relative'}}>
  Rate (₹/Day)
  <button
    onClick={() => setHideRateColumn(true)}
    style={{
      position: 'absolute',
      top: '2px',
      right: '2px',
      background: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '3px',
      fontSize: '12px',
      padding: '2px 4px',
      cursor: 'pointer',
      lineHeight: '1',
      display: 'flex',
      alignItems: 'center'
    }}
    title="Hide Rate Column"
  >
    👁️
  </button>
</th>
)}
<th>Attendance</th>
<th>Salary</th>
<th>Advances</th>
<th>Final Pay</th>
<th>Save</th>
<th>Paid</th>
{hideRateColumn && (
<th style={{background: '#f8f9fa', border: '1px dashed #6c757d'}}>
  <button
    onClick={() => setHideRateColumn(false)}
    style={{
      background: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      padding: '4px 8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '3px'
    }}
    title="Show Rate Column"
  >
    👁️ Show Rate
  </button>
</th>
)}
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

{!hideRateColumn && (
<td style={{padding:"8px"}}>
<div style={{display:"flex", alignItems:"center", gap:"5px"}}>
  <input
    type="number"
    value={rateEdit[worker.id] ?? (worker.rate || 0)}
    disabled={isPaid}
    onChange={(e)=>handleRateChange(worker.id,e.target.value)}
    style={{
      width:"70px",
      padding:"4px",
      border:"1px solid #ced4da",
      borderRadius:"4px",
      fontSize:"12px"
    }}
  />
  ₹
  {rateEdit[worker.id] !== undefined && (
    <button
      onClick={()=>updateWorkerRate(worker.id)}
      disabled={isPaid}
      style={{
        padding:"2px 6px",
        fontSize:"10px",
        backgroundColor:"#28a745",
        color:"white",
        border:"none",
        borderRadius:"3px",
        cursor:"pointer"
      }}
    >
      ✓
    </button>
  )}
</div>
</td>
)}

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

<td style={{textAlign:"center", padding:"8px"}}>
<div>
  {/* Total Advances Display */}
  <div style={{marginBottom:"8px", padding:"6px", backgroundColor:totalAdvances > 0 ? "#fff3cd" : "#f8f9fa", border:"1px solid #dee2e6", borderRadius:"4px"}}>
    <strong style={{color:totalAdvances > 0 ? "#856404" : "#6c757d"}}>
      ₹{totalAdvances || 0}
    </strong>
  </div>
  
  {/* View Button */}
  <button
    onClick={()=>setViewAdvancesFor(worker.id)}
    style={{
      padding:"6px 12px", 
      fontSize:"12px", 
      backgroundColor:"#007bff", 
      color:"white", 
      border:"none", 
      borderRadius:"4px", 
      cursor:"pointer",
      width:"80px"
    }}
  >
    View
  </button>
</div>
</td>

<td style={{fontWeight:"bold", color: finalPayValue < 0 ? "red" : "green"}}>
₹{finalPayValue}
</td>

<td>
{autoSaveEnabled ? (
  <span style={{color:"#28a745", fontSize:"12px", fontStyle:"italic"}}>
    Auto-Save {isPaid ? "(Disabled - Paid)" : "On"}
  </span>
) : (
  <button
    disabled={isPaid}
    onClick={()=>saveAttendance(worker.id)}
  >
    Save
  </button>
)}
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

{/* Advances Modal */}
{viewAdvancesFor && (
  <div style={{
    position:"fixed",
    top:"0",
    left:"0",
    width:"100%",
    height:"100%",
    backgroundColor:"rgba(0,0,0,0.5)",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    zIndex:"1000"
  }}>
    <div style={{
      backgroundColor:"white",
      padding:"20px",
      borderRadius:"8px",
      maxWidth:"500px",
      width:"90%",
      maxHeight:"80vh",
      overflow:"auto"
    }}>
      {(() => {
        const currentWorker = workers.find(w => w.id === viewAdvancesFor);
        const currentWorkerAdvances = advancesData[viewAdvancesFor] || [];
        const currentTotalAdvances = currentWorkerAdvances.reduce((sum, advance) => sum + advance.amount, 0);
        const isPaidWorker = attendanceData.find(a=>a.worker_id===viewAdvancesFor && a.month===month && a.year===year)?.paid===1;
        
        return (
          <>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px"}}>
              <h3 style={{margin:"0"}}>Advances for {currentWorker?.name}</h3>
              <button
                onClick={()=>setViewAdvancesFor(null)}
                style={{
                  backgroundColor:"#dc3545",
                  color:"white",
                  border:"none",
                  borderRadius:"4px",
                  padding:"6px 12px",
                  cursor:"pointer"
                }}
              >
                ✕ Close
              </button>
            </div>
            
            {/* Total */}
            <div style={{marginBottom:"16px", padding:"12px", backgroundColor:"#e9ecef", borderRadius:"6px", textAlign:"center"}}>
              <strong style={{fontSize:"16px", color:"#495057"}}>Total Advances: ₹{currentTotalAdvances}</strong>
            </div>
            
            {/* Previous Advances */}
            <h4>Previous Advances</h4>
            {currentWorkerAdvances.length > 0 ? (
              <div style={{
                maxHeight:"200px",
                overflowY:"auto",
                border:"1px solid #dee2e6",
                borderRadius:"4px",
                marginBottom:"20px"
              }}>
                {currentWorkerAdvances.map((advance, idx) => {
                  const badgeColor = getAdvanceBadgeColor(advance.amount);
                  return (
                    <div key={advance.id} style={{
                      display:"flex",
                      justifyContent:"space-between",
                      alignItems:"center",
                      padding:"12px",
                      borderBottom: idx === currentWorkerAdvances.length - 1 ? "none" : "1px solid #f1f3f4",
                      borderLeft:`4px solid ${badgeColor.bg}`
                    }}>
                      <div style={{flex:"1"}}>
                        <div style={{
                          display:"inline-block",
                          padding:"4px 8px",
                          backgroundColor:badgeColor.bg,
                          color:badgeColor.text,
                          borderRadius:"12px",
                          fontSize:"12px",
                          fontWeight:"bold",
                          marginRight:"8px"
                        }}>
                          ₹{advance.amount}
                        </div>
                        <div style={{color:"#6c757d", fontSize:"12px", marginTop:"4px"}}>
                          {advance.remark || "No reason provided"}
                        </div>
                      </div>
                      <span style={{fontSize:"11px", color:"#495057", fontWeight:"500"}}>
                        {advance.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{textAlign:"center", color:"#6c757d", fontStyle:"italic", padding:"20px", marginBottom:"20px"}}>
                No advances given yet
              </div>
            )}
            
            {/* Add New Advance */}
            {!isPaidWorker ? (
              <div>
                <h4>Add New Advance</h4>
                <div style={{border:"1px solid #dee2e6", borderRadius:"6px", padding:"15px", backgroundColor:"#f8f9fa"}}>
                  <div style={{display:"flex", gap:"10px", marginBottom:"10px"}}>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      id={`modal-advance-${viewAdvancesFor}`}
                      style={{
                        flex:"1",
                        padding:"8px",
                        fontSize:"14px",
                        border:"1px solid #ced4da",
                        borderRadius:"4px",
                        outline:"none"
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Reason (optional)"
                      id={`modal-remark-${viewAdvancesFor}`}
                      style={{
                        flex:"2",
                        padding:"8px",
                        fontSize:"14px",
                        border:"1px solid #ced4da",
                        borderRadius:"4px",
                        outline:"none"
                      }}
                    />
                  </div>
                  <button
                    onClick={()=>{
                      const amount = document.getElementById(`modal-advance-${viewAdvancesFor}`).value;
                      const remark = document.getElementById(`modal-remark-${viewAdvancesFor}`).value;
                      if(amount && Number(amount) > 0) {
                        addAdvance(viewAdvancesFor, amount, remark);
                        document.getElementById(`modal-advance-${viewAdvancesFor}`).value = '';
                        document.getElementById(`modal-remark-${viewAdvancesFor}`).value = '';
                      } else {
                        alert("Please enter a valid amount");
                      }
                    }}
                    style={{
                      width:"100%",
                      padding:"10px",
                      fontSize:"14px",
                      backgroundColor:"#28a745",
                      color:"white",
                      border:"none",
                      borderRadius:"4px",
                      cursor:"pointer",
                      fontWeight:"bold"
                    }}
                  >
                    + Add Advance
                  </button>
                </div>
              </div>
            ) : (
              <div style={{padding:"15px", backgroundColor:"#d4edda", border:"1px solid #c3e6cb", borderRadius:"6px", textAlign:"center"}}>
                <strong style={{color:"#155724"}}>Worker has been marked as paid. No new advances can be added.</strong>
              </div>
            )}
          </>
        );
      })()}
    </div>
  </div>
)}

</div>

);

}

export default App;