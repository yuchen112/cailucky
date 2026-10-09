// Limit bitmap decoding across simultaneously downloaded packs.
let active=0;
const queue=[];
function pump(){while(active<4&&queue.length){active++;const job=queue.shift();Promise.resolve().then(job.task).then(job.resolve,job.reject).finally(()=>{active--;pump()})}}
export function queuedDecode(task){return new Promise((resolve,reject)=>{queue.push({task,resolve,reject});pump()})}
