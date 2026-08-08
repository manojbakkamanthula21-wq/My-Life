import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";

const KEY="my-life-data-v1";
const blank={expenses:[],tasks:[],goals:[],reminders:[],loans:[],bills:[],income:[],hours:[],notes:[]};

function load(){try{return {...blank,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return blank}}
function App(){
 const [data,setData]=useState(load);
 const [page,setPage]=useState("Home");
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(data)),[data]);
 const today=new Date().toISOString().slice(0,10);
 const todayExpenses=data.expenses.filter(x=>x.date===today).reduce((s,x)=>s+Number(x.amount||0),0);
 const pendingTasks=data.tasks.filter(x=>!x.done).length;
 const dueBills=data.bills.filter(x=>x.dueDate===today).length;
 const nav=[["Home","⌂"],["Money","₹"],["Tasks","✓"],["Goals","◎"],["Calendar","□"],["Notes","✎"],["Insights","▥"]];
 const exportData=()=>{const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="my-life-backup.json";a.click()};
 const importData=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{setData({...blank,...JSON.parse(r.result)})}catch{alert("Invalid backup file")}};r.readAsText(f)};
 return <div className="app">
  <header><div><div className="brand">My Life</div><div className="sub">A simple place for everything that matters.</div></div><button className="ghost" onClick={exportData}>Export</button><label className="ghost">Import<input hidden type="file" accept=".json" onChange={importData}/></label></header>
  <nav>{nav.map(([n,i])=><button className={page===n?"active":""} onClick={()=>setPage(n)} key={n}><span>{i}</span>{n}</button>)}</nav>
  <main>
   {page==="Home"&&<><h1>Good day.</h1><p className="muted">Here is your quick overview.</p><div className="grid">
    <Card title="Today’s expenses" value={`₹${todayExpenses.toLocaleString("en-IN")}`} text={`${data.expenses.filter(x=>x.date===today).length} entries`}/>
    <Card title="Tasks" value={pendingTasks} text="pending"/>
    <Card title="Goals" value={data.goals.length} text="active goals"/>
    <Card title="Hours" value={sumHours(data.hours)} text="tracked"/>
    <Card title="Friends who owe you" value={data.loans.filter(x=>Number(x.remaining)>0).length} text="open loans"/>
    <Card title="Bills due today" value={dueBills} text="due"/>
   </div><Quick onAdd={()=>setPage("Money")}/></>}
   {page==="Money"&&<Money data={data} setData={setData}/>}
   {page==="Tasks"&&<SimpleList title="Tasks" items={data.tasks} field="title" setData={setData} keyName="tasks" extra="done"/>}
   {page==="Goals"&&<SimpleList title="Goals" items={data.goals} field="title" setData={setData} keyName="goals" extra="progress"/>}
   {page==="Calendar"&&<Calendar data={data}/>}
   {page==="Notes"&&<SimpleList title="Notes & Folders" items={data.notes} field="title" setData={setData} keyName="notes"/>}
   {page==="Insights"&&<Insights data={data}/>}
  </main>
  <footer>My Life • Phase 1 foundation • Data saves automatically in this browser</footer>
 </div>
}
function Card(p){return <section className="card"><div className="muted">{p.title}</div><strong>{p.value}</strong><small>{p.text}</small></section>}
function Quick({onAdd}){return <button className="quick" onClick={onAdd}>＋ Quick add</button>}
function Money({data,setData}){
 const [form,setForm]=useState({amount:"",category:"Food",method:"Cash",currency:"INR",date:new Date().toISOString().slice(0,10),notes:""});
 const add=()=>{if(!form.amount)return;setData({...data,expenses:[{id:Date.now(),...form},...data.expenses]});setForm({...form,amount:"",notes:""})};
 return <><h1>Money</h1><p className="muted">Expenses are saved automatically.</p><section className="panel"><h2>Add expense</h2><div className="form"><input placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{["Food","Travel","Bills","Shopping","Work","Health","Other"].map(x=><option key={x}>{x}</option>)}</select><select value={form.method} onChange={e=>setForm({...form,method:e.target.value})}><option>Cash</option><option>Card</option></select><select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}><option>INR</option><option>GBP</option></select><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/><input placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/><button onClick={add}>Add expense</button></div></section><section className="panel"><h2>Recent expenses</h2>{data.expenses.length?<div>{data.expenses.slice(0,10).map(x=><div className="row" key={x.id}><span><b>{x.category}</b><small>{x.date} · {x.method} · {x.notes}</small></span><strong>{x.currency==="GBP"?"£":"₹"}{Number(x.amount).toLocaleString()}</strong></div>)}</div>:<p className="muted">No expenses yet.</p>}</section></>
}
function SimpleList({title,items,field,setData,keyName,extra}){const [v,setV]=useState("");const add=()=>{if(!v.trim())return;setData(d=>({...d,[keyName]:[{id:Date.now(),[field]:v, ...(extra==="done"?{done:false}:{progress:0})},...d[keyName]]}));setV("")};return <><h1>{title}</h1><section className="panel"><div className="form"><input value={v} placeholder={`Add ${title.toLowerCase().replace(" & folders","")}`} onChange={e=>setV(e.target.value)}/><button onClick={add}>Add</button></div></section><section className="panel">{items.length?items.map(x=><div className="row" key={x.id}><span>{extra==="done"&&<input type="checkbox" checked={x.done} onChange={()=>setData(d=>({...d,[keyName]:d[keyName].map(y=>y.id===x.id?{...y,done:!y.done}:y)}))}/>}<b className={x.done?"strike":""}>{x[field]}</b></span>{extra==="progress"?<span>{x.progress}%</span>:null}</div>):<p className="muted">Nothing here yet.</p>}</section></>}
function Calendar({data}){return <><h1>Calendar</h1><p className="muted">Your future unified calendar will combine tasks, reminders, bills, loans and goal milestones.</p><section className="panel"><h2>Today</h2>{data.tasks.filter(x=>x.dueDate===new Date().toISOString().slice(0,10)).map(x=><div className="row" key={x.id}>✓ {x.title}</div>)}<p className="muted">Calendar foundation ready.</p></section></>}
function Insights({data}){const total=data.expenses.reduce((s,x)=>s+Number(x.amount||0),0);return <><h1>Insights</h1><div className="grid"><Card title="Total expenses" value={`₹${total.toLocaleString("en-IN")}`} text="all recorded entries"/><Card title="Expense entries" value={data.expenses.length} text="recorded"/><Card title="Tasks completed" value={data.tasks.filter(x=>x.done).length} text="completed"/><Card title="Goals" value={data.goals.length} text="created"/></div><section className="panel"><h2>Charts</h2><p className="muted">Charts for monthly spending, categories, cash/card, income, savings, loans, hours and goal progress will be added in the Insights phase.</p></section></>}
function sumHours(a){return a.reduce((s,x)=>s+Number(x.hours||0),0)+"h"}
createRoot(document.getElementById("root")).render(<App/>);
export default App;
