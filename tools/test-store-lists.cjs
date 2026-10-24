const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const s=fs.readFileSync(__dirname+'/../assets/index-XdRDscQx.js','utf8');
const hooks=[],db={},alerts=[];let cursor=0;
const clothes={id:'c',code:'C',name:'衣服',storeSection:'一般商店',price:490,stock:1,stockLimited:true,externalPurchase:true};
const hair={id:'h',code:'H',name:'髮圈',storeSection:'薰衣草小舖',price:20,unit:'條',stock:3,stockLimited:true,externalPurchase:true};
const ear={id:'e',code:'E',name:'耳環',storeSection:'薰衣草小舖',price:45,stock:1,stockLimited:true,externalPurchase:true};
const catalog=[clothes,hair,ear];
const ctx={D:{useState:init=>{const i=cursor++;if(!(i in hooks))hooks[i]=typeof init==='function'?init():init;return[hooks[i],next=>hooks[i]=typeof next==='function'?next(hooks[i]):next]},useEffect:f=>f()},_r:(k,f)=>db[k]??f,zl:(k,v)=>db[k]=v,Fe:{cart:'legacy'},Ld:x=>x.storeSection||'一般商店',Js:x=>x.code||'',Ut:x=>x.name,gf:x=>Number(x.price),jg:x=>'NT$ '+Number(x.price)*x.qty,Jm:x=>'NT$ '+x.price,zn:n=>'NT$ '+n,tn:n=>n+'點',alert:m=>alerts.push(m)};
vm.createContext(ctx);vm.runInContext(s.slice(s.indexOf('function inventoryLimit('),s.indexOf('function EarringLineGroup('))+s.slice(s.indexOf('function kg('),s.indexOf('const Md=',s.indexOf('function kg('))),ctx);
function render(){cursor=0;return ctx.kg(catalog)}
let c=render();assert.equal(c.add(clothes,'store'),true);c=render();assert.equal(c.count,1);c.add(clothes,'store',99);c=render();assert.equal(c.count,1);assert.equal(c.add(hair,'store'),false);
c.setScope('薰衣草小舖');c=render();assert.equal(c.count,0);c.add(hair,'store',2);c.add(ear,'store',1);c=render();assert.equal(c.count,3);assert.equal(c.moneyTotal,85);assert(c.text.includes('單價 NT$ 20'));assert(c.text.includes('小計 NT$ 40'));assert(!c.text.includes('衣服'));
c.changeQty(c.items.find(x=>x.id==='h').key,999);c=render();assert.equal(c.count,4);assert.equal(c.moneyTotal,105);c.changeQty(c.items.find(x=>x.id==='e').key,999);c=render();assert.equal(c.items.find(x=>x.id==='e').qty,1);
c.setScope('一般商店');c=render();assert.equal(c.count,1);assert(!c.text.includes('髮圈'));c.clear();c=render();assert.equal(c.count,0);c.setScope('薰衣草小舖');c=render();assert.equal(c.count,4);
hooks.length=0;c=render();assert.equal(c.count,4);hair.price=25;hair.stock=1;c=render();assert.equal(c.moneyTotal,70);assert.equal(c.count,2);ear.stock=0;c=render();assert.equal(c.count,1);assert.equal(c.add(ear,'store'),false);
hair.storeSection='一般商店';c=render();assert.equal(c.count,0);c.setScope('全部商品');c=render();assert.equal(c.add(hair,'store'),false);
hooks.length=0;delete db.cxq_store_carts_v2;db.cxq_cart_scope_v2='薰衣草小舖';ear.stock=1;hair.storeSection='薰衣草小舖';db.legacy=[{...clothes,mode:'store',key:'oldc',qty:8},{...ear,mode:'store',key:'olde',qty:8}];c=render();assert.equal(c.count,1);c.setScope('一般商店');c=render();assert.equal(c.count,1);
console.log('PASS: external-purchase additions, store isolation, copy totals, repeated/direct stock limits, independent clear, refresh persistence, price/stock changes, moved products and legacy migration');

