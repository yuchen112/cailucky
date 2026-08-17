// Runtime image health guard. Prevents corrupted/missing raster assets from becoming visible UI.
(function(){
  const REV='20260818-0453';
  const watched=[];
  function safeSrc(src){return src+(src.includes('?')?'&':'?')+'rev='+REV;}
  const desc=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
  if(desc&&desc.set&&desc.get){
    Object.defineProperty(HTMLImageElement.prototype,'src',{
      configurable:true,enumerable:desc.enumerable,
      get:desc.get,
      set:function(v){
        if(typeof v==='string'&&v&&!v.startsWith('data:')&&!v.includes('rev=')) v=safeSrc(v);
        this.addEventListener('error',()=>{this.dataset.cxqBroken='1';},{once:true});
        this.addEventListener('load',()=>{if(this.naturalWidth&&this.naturalHeight)this.dataset.cxqBroken='0';},{once:true});
        return desc.set.call(this,v);
      }
    });
  }
  window.CXQ_ASSET_REV=REV;
})();
