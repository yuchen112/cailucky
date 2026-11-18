export function migrateCombatSave(value){
 if(!value||value.combatRulesVersion===2)return value;
 const save=structuredClone(value);save.combatRulesVersion=2;
 if(save.wallet)save.wallet.gold=Math.min(Number.MAX_SAFE_INTEGER,save.wallet.gold*15);
 if(save.state){save.state=null;save.log=[];save.combatMigrationNotice=true;}
 for(const v of Object.values(save.daily??{}))if(v){v.legacyHighest=v.highest;v.highest=0;v.rulesVersion=2;}
 save.combatMigrationNotice=true;
 return save;
}
