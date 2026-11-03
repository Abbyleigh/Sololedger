export const KEY='sololedger-v2';
export const MAX_BACKUP_BYTES=5000000;
export function serialise(s){const raw=JSON.stringify(s);if(new TextEncoder().encode(raw).length>MAX_BACKUP_BYTES)throw Error('Records exceed the 5 MB backup limit. Export your existing backup; reduce the imported file size.');return raw;}
export function nextInvoiceNumber(s){const used=new Set(s.invoices.map(i=>i.number));let n=s.invoices.length+1;while(used.has('SL-'+String(n).padStart(4,'0')))n++;return 'SL-'+String(n).padStart(4,'0');}
export const fresh=()=>({version:2,profile:{name:'',address:'',email:'',payment:''},customers:[],invoices:[],transactions:[]});
const text=(x,max=500)=>typeof x==='string'&&x.length<=max;
const nonempty=(x,max=500)=>text(x,max)&&x.trim().length>0;
export function dateOK(x){return typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;}
export function pennies(x){if(!/^\d{1,8}(\.\d{1,2})?$/.test(String(x)))throw Error('Use a positive amount with at most two decimal places.');const [a,b='']=String(x).split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));if(n<1||n>1e10)throw Error('Amount out of range.');return n;}
const money=x=>Number.isSafeInteger(x)&&x>0&&x<=1e10;
const ids=a=>new Set(a.map(x=>x.id)).size===a.length&&a.every(x=>nonempty(x.id,100));
export function validate(s){
 if(!s||s.version!==2||!s.profile||!['name','address','email','payment'].every(k=>text(s.profile[k]))||!['customers','invoices','transactions'].every(k=>Array.isArray(s[k])&&s[k].length<=10000&&ids(s[k])))throw Error('Invalid backup structure or duplicate IDs.');
 if(!s.customers.every(c=>nonempty(c.name,120)&&text(c.email,200)&&text(c.address)))throw Error('Invalid customer.');
 if(!s.transactions.every(t=>nonempty(t.description,120)&&['income','expense'].includes(t.type)&&(t.invoiceId ? Number.isSafeInteger(t.pence)&&t.pence>0&&t.pence<=1e12 : money(t.pence))&&dateOK(t.date)&&(t.invoiceId===undefined||nonempty(t.invoiceId,100))))throw Error('Invalid transaction.');
 const numbers=new Set();
 for(const i of s.invoices){if(!nonempty(i.number,40)||numbers.has(i.number)||!dateOK(i.date)||!dateOK(i.due)||!dateOK(i.supply)||i.due<i.date||!['draft','issued','paid','void'].includes(i.status)||!s.customers.some(c=>c.id===i.customerId)||!i.seller||!i.customer||!nonempty(i.seller.name)||!nonempty(i.seller.address)||!nonempty(i.seller.email)||!text(i.seller.payment)||!nonempty(i.customer.name,120)||!nonempty(i.customer.address)||!text(i.customer.email,200)||!Array.isArray(i.items)||!i.items.length||i.items.length>100||!i.items.every(l=>nonempty(l.description,120)&&Number.isInteger(l.quantity)&&l.quantity>0&&l.quantity<=10000&&money(l.pence))||!Number.isSafeInteger(total(i))||total(i)>1e12)throw Error('Invalid invoice.');numbers.add(i.number);const payments=s.transactions.filter(t=>t.invoiceId===i.id);if(i.status==='paid'?(payments.length!==1||payments[0].pence!==total(i)||payments[0].type!=='income'):payments.length!==0)throw Error('Invoice payment mismatch.');}
 if(s.transactions.some(t=>t.invoiceId&&!s.invoices.some(i=>i.id===t.invoiceId)))throw Error('Orphan payment.');const totals=summary(s);if(!Object.values(totals).every(Number.isSafeInteger))throw Error('Aggregate total exceeds the safe integer range.');return s;
}
export const total=i=>i.items.reduce((n,l)=>n+l.quantity*l.pence,0);
export const summary=s=>{let income=0,expenses=0;for(const t of s.transactions)t.type==='income'?income+=t.pence:expenses+=t.pence;return {income,expenses,profit:income-expenses,outstanding:s.invoices.filter(i=>i.status==='issued').reduce((n,i)=>n+total(i),0)};};
export function migrate(a){if(!Array.isArray(a))throw Error('Invalid legacy backup.');const s=fresh();s.transactions=a.map(t=>({...t,pence:pennies(Number(t.amount).toFixed(2))}));return validate(s);}
export function restore(raw){if(new TextEncoder().encode(raw).length>MAX_BACKUP_BYTES)throw Error('Backup exceeds 5 MB.');const data=JSON.parse(raw);return Array.isArray(data)?migrate(data):validate(data);}
export function pay(s,id,date,paymentId){const n=structuredClone(s),i=n.invoices.find(i=>i.id===id);if(!i||i.status!=='issued'||!dateOK(date))throw Error('Only issued invoices can be paid.');i.status='paid';n.transactions.push({id:paymentId,invoiceId:id,date,description:`Payment ${i.number}`,type:'income',pence:total(i)});return validate(n);}
export const csvCell=x=>'"'+String(/^[\s]*[=+\-@\t\r]/.test(String(x))?"'"+x:x).replaceAll('"','""')+'"';
export const csv=s=>['Date,Description,Type,Amount',...s.transactions.map(t=>[t.date,t.description,t.type,(t.pence/100).toFixed(2)].map(csvCell).join(','))].join('\r\n');
export function persist(storage,s){validate(s);storage.setItem(KEY,serialise(s));return s;}

// Remove only SoloLedger keys; never clear unrelated origin storage.
export function eraseRecords(storage,expected){if(storage.getItem(KEY)!==expected)throw Error('Records changed in another tab. Reload before deleting.');storage.removeItem('sololedger-v1');storage.removeItem(KEY);}
