var e,t;"function"==typeof(e=globalThis.define)&&(t=e,e=null),function(t,a,n,i,r){var s="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},l="function"==typeof s[i]&&s[i],o=l.cache||{},u="undefined"!=typeof module&&"function"==typeof module.require&&module.require.bind(module);function c(e,a){if(!o[e]){if(!t[e]){var n="function"==typeof s[i]&&s[i];if(!a&&n)return n(e,!0);if(l)return l(e,!0);if(u&&"string"==typeof e)return u(e);var r=Error("Cannot find module '"+e+"'");throw r.code="MODULE_NOT_FOUND",r}d.resolve=function(a){var n=t[e][1][a];return null!=n?n:a},d.cache={};var m=o[e]=new c.Module(e);t[e][0].call(m.exports,d,m,m.exports,this)}return o[e].exports;function d(e){var t=d.resolve(e);return!1===t?{}:c(t)}}c.isParcelRequire=!0,c.Module=function(e){this.id=e,this.bundle=c,this.exports={}},c.modules=t,c.cache=o,c.parent=l,c.register=function(e,a){t[e]=[function(e,t){t.exports=a},{}]},Object.defineProperty(c,"root",{get:function(){return s[i]}}),s[i]=c;for(var m=0;m<a.length;m++)c(a[m]);if(n){var d=c(n);"object"==typeof exports&&"undefined"!=typeof module?module.exports=d:"function"==typeof e&&e.amd?e(function(){return d}):r&&(this[r]=d)}}({frrV4:[function(e,t,a){e("../../../src/background")},{"../../../src/background":"bkg1o"}],bkg1o:[function(e,t,a){var n=e("@parcel/transformer-js/src/esmodule-helpers.js");n.defineInteropFlag(a),n.export(a,"fetchStats",()=>b),n.export(a,"executeSearch",()=>q),n.export(a,"fetchItems",()=>C);var i=e("~types");let r=null,s=null,l=null,o=new Map;async function u(){if(!l){try{let e=await E("affixFingerprints");if(e.affixFingerprints?.version===2&&e.affixFingerprints?.data){let t=e.affixFingerprints.data;for(let[e,a]of Object.entries(t))o.set(e,new Set(a));l={},console.log(`[PoE2] Affix fingerprints restored from cache: ${o.size} categories`);return}}catch(e){}try{let e=chrome.runtime.getURL("poe2-base-affixes.json"),t=await fetch(e);if(!t.ok)throw Error(`Affix DB load failed: ${t.status}`);for(let e of(l=await t.json()).categories){if(!e.affixes&&!e.base_items)continue;let t=new Set,a=e=>{if(!e)return;let a=e.replace(/^\d+\s+/,"").replace(/\s+[A-Z][a-zA-Z,]*\s+\d+\s*$/g,"").replace(/\s+[a-z]+\s*$/g,"").trim();if(!a)return;let n=a.replace(/\([\d.\u2014]+\)/g,"#").replace(/[\d.]+/g,"#").replace(/[+\-%]/g,"").replace(/\s+/g," ").trim().toLowerCase();n.length>3&&n.split(" ").length>=3&&t.add(n)};for(let t of e.affixes||[])a(t.details||t.stat_text||"");for(let t of e.base_items||[])for(let e of t.implicits||[])a(e);o.set(e.slug,t)}for(let[e,t]of Object.entries(p)){let a=new Set;for(let e of t){let t=o.get(e);if(t)for(let e of t)a.add(e)}o.set(e,a),console.log(`[PoE2] Merged ${e}: ${a.size} fingerprints from ${t.length} subcategories`)}console.log(`[PoE2] Affix DB loaded: ${l.categories.length} categories`),m();let a={};for(let[e,t]of o)a[e]=[...t];S({affixFingerprints:{version:2,data:a}}).catch(()=>{})}catch(e){console.warn("[PoE2] Affix DB not available:",e)}}}let c=null;function m(){if(l){for(let e of(c=new Map,l.categories))for(let t of e.affixes||[]){let e=t.details;if(!e)continue;let a=e.match(/^(\d+)\s+/);if(!a)continue;let n=parseInt(a[1],10),i=e.replace(/^\d+\s+/,"").replace(/\s+[A-Z][a-zA-Z,]*\s+\d+\s*$/g,"").replace(/\s+[a-z]+\s*$/g,"").trim();if(!i)continue;let r=i.replace(/\([\d.\u2014]+\)/g,"#").replace(/[\d.]+/g,"#").replace(/[+\-%]/g,"").replace(/\s+/g," ").trim().toLowerCase();if(!r||r.split(" ").length<2)continue;let s=c.get(r)||[];s.some(e=>e.level===n)||s.push({level:n,detail:i}),c.set(r,s)}for(let e of c.values())e.sort((e,t)=>t.level-e.level);console.log(`[PoE2] Mod tier lookup built: ${c.size} unique mod patterns`)}}let d={Ring:"Rings",Amulet:"Amulets",Belt:"Belts",Boots:"Boots",Gloves:"Gloves",Helmet:"Helmets","Body Armour":"Body Armours",Focus:"Foci",Quiver:"Quivers",Bow:"Bows",Crossbow:"Crossbows",Claw:"Claws",Dagger:"Daggers","One Handed Sword":"One_Hand_Swords","One Handed Axe":"One_Hand_Axes","One Handed Mace":"One_Hand_Maces","Two Handed Sword":"Two_Hand_Swords","Two Handed Axe":"Two_Hand_Axes","Two Handed Mace":"Two_Hand_Maces",Spear:"Spears",Flail:"Flails",Quarterstaff:"Quarterstaves",Wand:"Wands",Sceptre:"Sceptres",Staff:"Staves"},p={Boots:["Boots_str","Boots_dex","Boots_int","Boots_str_dex","Boots_str_int","Boots_dex_int"],Gloves:["Gloves_str","Gloves_dex","Gloves_int","Gloves_str_dex","Gloves_str_int","Gloves_dex_int"],Helmets:["Helmets_str","Helmets_dex","Helmets_int","Helmets_str_dex","Helmets_str_int","Helmets_dex_int"],"Body Armours":["Body_Armours_str","Body_Armours_dex","Body_Armours_int","Body_Armours_str_dex","Body_Armours_str_int","Body_Armours_dex_int"]};async function f(){if(r)return r;try{let e=await E("enZhDict");if(e.enZhDict&&Object.keys(e.enZhDict).length>0)return r=e.enZhDict,e.dictIndex&&Array.isArray(e.dictIndex)?(s=new Map(e.dictIndex),console.log(`[PoE2] Dict index restored from cache: ${s.size} entries`)):g(),console.log(`[PoE2] Dictionary loaded from cache: ${Object.keys(r).length} entries`),r}catch(e){}try{let e=chrome.runtime.getURL("poe2_en_zh.json"),t=await fetch(e);if(!t.ok)throw Error(`Dict load failed: ${t.status}`);return r=await t.json(),g(),console.log(`[PoE2] Dictionary loaded: ${Object.keys(r).length} entries`),S({enZhDict:r,dictIndex:s?[...s.entries()]:[]}).catch(()=>{}),r}catch(e){return console.warn("[PoE2] Dictionary not available, translations disabled:",e),r={},{}}}function g(){if(!r){s=null;return}for(let[e,t]of(s=new Map,Object.entries(r)))s.set(h(e),t)}function h(e){return e.replace(/[+\-]?\d+(?:\.\d+)?/g,"#").replace(/^[+\-]\s*/,"").replace(/\s+/g," ").trim().toLowerCase()}function y(e){if(!r||0===Object.keys(r).length)return null;let t=e.match(/[+\-]?\d+(?:\.\d+)?/g)||[],a=h(e);if(!a)return null;if(s){let e=s.get(a);if(e)return function(e,t){if(!t.length)return e;let a=0;return e.replace(/#/g,()=>{let e=t[a];return a=(a+1)%t.length,e||"#"})}(e,t)}return null}async function x(){return new Promise(e=>{chrome.storage.local.get("settings",t=>{if(chrome.runtime.lastError){console.warn("[PoE2] getSettings error:",chrome.runtime.lastError),e({...i.DEFAULT_SETTINGS});return}chrome.storage.local.get(null,e=>{console.log("[PoE2] getSettings: result_keys=",Object.keys(t||{}),"all_keys=",Object.keys(e||{}))}),e(t?.settings||i.DEFAULT_SETTINGS)})})}async function w(e){return new Promise((t,a)=>{console.log("[PoE2] saveSettings: saving key_len="+(e?.aiProvider?.apiKey?.length||0)),chrome.storage.local.set({settings:e},()=>{chrome.runtime.lastError?(console.error("[PoE2] saveSettings error:",chrome.runtime.lastError),a(Error("\u4fdd\u5b58\u5931\u8d25: "+chrome.runtime.lastError.message))):(console.log("[PoE2] saveSettings: set callback OK"),t())})})}function E(e){return new Promise(t=>{chrome.storage.local.get(e,e=>{chrome.runtime.lastError?(console.warn("[PoE2] storageGet error:",chrome.runtime.lastError),t({})):t(e||{})})})}function S(e){return new Promise(t=>{chrome.storage.local.set(e,()=>{chrome.runtime.lastError&&console.warn("[PoE2] storageSet error:",chrome.runtime.lastError),t()})})}let v=`## Reference: Common Stat Descriptions (exact English \u2192 Chinese)
Use these EXACT English texts when the user describes these stats:
- "adds # to # lightning damage to attacks" \u2192 \u653b\u64ca\u9644\u52a0\u9583\u96fb\u50b7\u5bb3
- "adds # to # fire damage to attacks" \u2192 \u653b\u64ca\u9644\u52a0\u706b\u7130\u50b7\u5bb3
- "adds # to # cold damage to attacks" \u2192 \u653b\u64ca\u9644\u52a0\u51b0\u51b7\u50b7\u5bb3
- "adds # to # physical damage to attacks" \u2192 \u653b\u64ca\u9644\u52a0\u7269\u7406\u50b7\u5bb3
- "+# to maximum Life" \u2192 \u6700\u5927\u751f\u547d
- "+# to maximum Mana" \u2192 \u6700\u5927\u9b54\u529b
- "+# to maximum Energy Shield" \u2192 \u6700\u5927\u80fd\u91cf\u8b77\u76fe
- "+# to maximum Energy Shield (Local)" \u2192 \u672c\u5730\u80fd\u91cf\u8b77\u76fe\uff08\u80f8\u7532/\u5934/\u624b/\u978b\uff09
- "#% increased Movement Speed" \u2192 \u79fb\u52d5\u901f\u5ea6
- "#% increased Attack Speed" \u2192 \u653b\u64ca\u901f\u5ea6
- "#% increased Cast Speed" \u2192 \u65bd\u653e\u901f\u5ea6
- "#% to Fire Resistance" \u2192 \u706b\u7130\u6297\u6027
- "#% to Cold Resistance" \u2192 \u51b0\u51b7\u6297\u6027
- "#% to Lightning Resistance" \u2192 \u9583\u96fb\u6297\u6027
- "#% to Chaos Resistance" \u2192 \u6df7\u6c8c\u6297\u6027
- "#% to all Elemental Resistances" \u2192 \u5168\u90e8\u5143\u7d20\u6297\u6027
- "+# to Strength" \u2192 \u529b\u91cf
- "+# to Dexterity" \u2192 \u654f\u6377
- "+# to Intelligence" \u2192 \u667a\u6167
- "+# to all Attributes" \u2192 \u5168\u80fd\u529b
- "+# to Spirit" \u2192 \u7cbe\u9b42
- "#% increased Rarity of Items found" \u2192 \u7269\u54c1\u7a00\u6709\u5ea6
- "#% increased Critical Hit Chance" \u2192 \u66b4\u64ca\u7387
- "+#% to Critical Damage Bonus" \u2192 \u66b4\u64ca\u50b7\u5bb3\u52a0\u6210
- "#% increased Spell Damage" \u2192 \u6cd5\u8853\u50b7\u5bb3
- "#% increased Physical Damage" \u2192 \u7269\u7406\u50b7\u5bb3
- "#% increased Lightning Damage" \u2192 \u9583\u96fb\u50b7\u5bb3
- "#% increased Fire Damage" \u2192 \u706b\u7130\u50b7\u5bb3
- "#% increased Cold Damage" \u2192 \u51b0\u51b7\u50b7\u5bb3
- "#% increased Chaos Damage" \u2192 \u6df7\u6c8c\u50b7\u5bb3
- "+# to Evasion Rating" \u2192 \u9583\u907f\u503c
- "+# to Evasion Rating (Local)" \u2192 \u672c\u5730\u9583\u907f\uff08\u8b77\u7532\u88dd\u5099\u8a5e\u7db4\uff09
- "+# to Armour" \u2192 \u8b77\u7532\u503c
- "+# to Armour (Local)" \u2192 \u672c\u5730\u8b77\u7532\uff08\u8b77\u7532\u88dd\u5099\u8a5e\u7db4\uff09
- "#% increased Armour (Local)" \u2192 \u8b77\u7532%\u63d0\u9ad8\uff08\u672c\u5730\uff09
- "#% increased Evasion Rating (Local)" \u2192 \u9583\u907f%\u63d0\u9ad8\uff08\u672c\u5730\uff09
- "+# to Accuracy Rating (Local)" \u2192 \u547d\u4e2d\u503c\uff08\u6b66\u5668\u672c\u5730\uff09
- "#% increased Attack Speed (Local)" \u2192 \u653b\u64ca\u901f\u5ea6\uff08\u6b66\u5668\u672c\u5730\uff09
- "+#% to Block chance" \u2192 \u683c\u64cb\u7387
- "#% increased Block chance (Local)" \u2192 \u683c\u64cb\u7387\uff08\u76fe\u724c\u672c\u5730\uff09
- "# Life Regeneration per second" \u2192 \u6bcf\u79d2\u751f\u547d\u56de\u5fa9
- "Leech #% of Physical Attack Damage as Life" \u2192 \u7269\u7406\u653b\u64ca\u50b7\u5bb3\u751f\u547d\u5077\u53d6
- "gain # Life per enemy killed" \u2192 \u64ca\u6bba\u56de\u5fa9\u751f\u547d
- "#% increased Skill Speed" \u2192 \u6280\u80fd\u901f\u5ea6
- "gain #% of Damage as Extra Fire Damage" \u2192 \u7372\u5f97\u984d\u5916\u706b\u7130\u50b7\u5bb3\uff08\u4efb\u610f\u4f86\u6e90\uff09
- "gain #% of Damage as Extra Cold Damage" \u2192 \u7372\u5f97\u984d\u5916\u51b0\u51b7\u50b7\u5bb3\uff08\u4efb\u610f\u4f86\u6e90\uff09
- "gain #% of Damage as Extra Lightning Damage" \u2192 \u7372\u5f97\u984d\u5916\u9583\u96fb\u50b7\u5bb3\uff08\u4efb\u610f\u4f86\u6e90\uff09
- "gain #% of Damage as Extra Chaos Damage" \u2192 \u7372\u5f97\u984d\u5916\u6df7\u6c8c\u50b7\u5bb3\uff08\u4efb\u610f\u4f86\u6e90\uff09
- "attacks gain #% of Damage as Extra Fire Damage" \u2192 \u653b\u64ca\u7372\u5f97\u984d\u5916\u706b\u7130\u50b7\u5bb3
- "gain #% of Elemental Damage as Extra Fire Damage" \u2192 \u5143\u7d20\u50b7\u5bb3\u7372\u5f97\u984d\u5916\u706b\u7130\u50b7\u5bb3
- "#% increased Mana Regeneration Rate" \u2192 \u9b54\u529b\u56de\u5fa9\u901f\u5ea6
`,_="https://www.pathofexile.com/api/trade2",T=null,A=0;async function b(){if(T&&Date.now()-A<36e5)return T;try{let e=await E("statsCache");if(e.statsCache?.entries&&e.statsCache?.timestamp&&Date.now()-e.statsCache.timestamp<36e5){let t=e.statsCache.entries,a=Array.isArray(t)&&t.length>100&&t.every(e=>"string"==typeof e.id&&e.id.length>3);if(a)return T=t,A=e.statsCache.timestamp,T;console.warn("[PoE2] Stats cache corrupted, clearing and re-fetching"),S({statsCache:null}).catch(()=>{})}}catch(e){}let e=await fetch(`${_}/data/stats`);if(!e.ok)throw Error(`Stats API returned ${e.status}`);let t=await e.json(),a=[];for(let e of t.result||[])for(let t of e.entries||[])a.push({id:t.id,text:t.text,type:t.type,option:t.option});return T=a,S({statsCache:{entries:a,timestamp:A=Date.now()}}).catch(()=>{}),a}async function q(e,t){let a=await fetch(`${_}/search/${t}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!a.ok){let e=await a.text();throw Error(`Search API returned ${a.status}: ${e}`)}return a.json()}async function C(e,t){let a=await fetch(`${_}/fetch/${e.join(",")}?query=${t}`);if(!a.ok){let e=await a.text();throw Error(`Fetch API returned ${a.status}: ${e.slice(0,200)}`)}return a.json()}let L=`You are a Path of Exile 2 trade search parser. Convert the user's Chinese natural language search into a JSON search intent.

## Output Format
You MUST output this exact JSON structure:
{
  "stats": [
    { "text": "exact English stat description", "min": number_or_null, "max": number_or_null, "statType": "explicit"|"implicit"|"pseudo"|"enchant"|"fractured"|null }
  ],
  "type": "item category in English, or null",
  "name": "unique item name in English, or null",
  "equipment": [
    { "id": "filter_id", "min": number_or_null, "max": number_or_null }
  ],
  "rarity": "normal"|"magic"|"rare"|"unique"|"nonunique"|null,
  "ilvl": { "min": number_or_null, "max": number_or_null } or null,
  "quality": { "min": number_or_null, "max": number_or_null } or null,
  "req": [
    { "id": "lvl"|"str"|"dex"|"int", "min": number_or_null, "max": number_or_null }
  ],
  "runeSockets": { "min": number_or_null, "max": number_or_null } or null,
  "saleType": "priced"|"priced_with_info"|"unpriced"|"any"|null,
  "listed": "1hour"|"3hours"|"12hours"|"1day"|"3days"|"1week"|"2weeks"|"1month"|"2months"|null,
  "sellerAccount": "account name string, or null",
  "collapse": true|false|null,
  "goldFee": { "min": number_or_null, "max": number_or_null } or null,
  "status": "online" or "any",
  "sort": "price-asc" or "price-desc",
  "price": { "min": number_or_null, "max": number_or_null, "currency": "chaos"|"divine"|"exalted" or null },
  "explanation": "brief Chinese summary"
}

## Rules

### Item Type
1. "type": identify the item category from user input. Valid values (case-sensitive):
   - Ring (\u6212\u6307), Amulet (\u9879\u94fe), Belt (\u8170\u5e26)
   - Boots (\u978b\u5b50), Gloves (\u624b\u5957), Helmet (\u5934\u76d4), Body Armour (\u80f8\u7532)
   - Shield (\u76fe\u724c), Quiver (\u7bad\u888b), Focus (\u6cd5\u5668)
   - Claw (\u722a), Dagger (\u5315\u9996), One Handed Sword (\u5355\u624b\u5251), One Handed Axe (\u5355\u624b\u65a7), One Handed Mace (\u5355\u624b\u9524)
   - Two Handed Sword (\u53cc\u624b\u5251), Two Handed Axe (\u53cc\u624b\u65a7), Two Handed Mace (\u53cc\u624b\u9524)
   - Spear (\u957f\u77db), Flail (\u8fde\u67b7), Quarterstaff (\u957f\u6756/\u6b66\u6756)
   - Bow (\u5f13), Crossbow (\u5f29), Wand (\u77ed\u6756/\u9b54\u6756), Sceptre (\u6743\u6756), Staff (\u6cd5\u6756)
   - Life Flask (\u751f\u547d\u836f\u5242), Mana Flask (\u9b54\u529b\u836f\u5242), Flask (\u901a\u7528\u836f\u5242)
   - Jewel (\u73e0\u5b9d), Waystone (\u5f02\u754c\u5730\u56fe), Tablet (\u7891\u724c), Rune (\u7b26\u6587), Soul Core (\u7075\u9b42\u6838\u5fc3)
   - Skill Gem (\u6280\u80fd\u5b9d\u77f3), Support Gem (\u8f85\u52a9\u5b9d\u77f3)

### Stats (right-side affix filters)
2. "text" MUST be an EXACT English stat description as it appears on PoE items, e.g.:
   - "adds # to # lightning damage to attacks" (NOT "lightning damage")
   - "#% increased Movement Speed" (NOT "movement speed")
   - "+# to maximum Life" 
   - "#% to Fire Resistance"
   Use # as placeholder. Copy the wording exactly from in-game.
3. "min"/"max" = the numeric threshold. null if not specified.
4. "statType": the stat category. \u26a0\ufe0f CRITICAL \u2014 detect from user wording:

   Keywords \u2192 statType mapping:
   - "\u8bcd\u7f00" / "\u8bcd\u6761" / "T1" / "T2" / "\u968f\u673a\u8bcd" \u2192 "explicit" (\u9ec4\u88c5\u8bcd\u7f00)
   - "\u57fa\u5e95" / "\u5e95\u5b50" / "\u81ea\u5e26" / "\u539f\u751f" \u2192 "implicit" (\u88c5\u5907\u57fa\u5e95\u81ea\u5e26)
   - "\u9644\u9b54" / "\u9644\u9b54\u8bcd" \u2192 "enchant" (\u9644\u9b54)
   - "\u7834\u88c2" / "\u88c2\u75d5" / "\u56fa\u5b9a" / "\u56fa\u5b9a\u8bcd" / "\u56fa\u5b9a\u4f4f" \u2192 "fractured" (\u7834\u88c2/\u56fa\u5b9a\u8bcd)
   - "\u4eb5\u6e0e" / "\u4eb5\u6e0e\u8bcd" / "desecrated" \u2192 "desecrated" (\u4eb5\u6e0e\u8bcd)
   - "\u4f2a" / "\u7efc\u5408" / "\u5408\u8ba1" \u2192 "pseudo" (\u8ba1\u7b97\u503c)
   - "\u6a21\u7cca" / "\u4efb\u610f" / "\u4e0d\u9650\u5b9a" / "\u4efb\u610f\u6765\u6e90" / no keyword \u2192 null (\u641c\u7d22\u5168\u90e8\u7c7b\u578b)
   
   \u26a0\ufe0f "null" = match ALL stat types (explicit + implicit + enchant + fractured)
   Use null when user doesn't specify, or when they say "\u6a21\u7cca"/"\u4efb\u610f\u6765\u6e90".
   
   Examples:
   - "\u57fa\u5e95\u6297\u6027\u6212\u6307" \u2192 statType:"implicit" for the resistance stat
   - "\u56fa\u5b9a\u4f4f \u653b\u901f\u7684\u5f13" \u2192 statType:"fractured" for attack speed
   - "\u9644\u9b54\u65bd\u6cd5\u901f\u5ea6\u7684\u624b\u5957" \u2192 statType:"enchant" for cast speed
   - "\u6a21\u7cca\u641c\u7d22\u51b0\u6297\u5927\u4e8e50" \u2192 statType:null (search all types)
   - "\u6df7\u6c8c\u6297\u6027\u8bcd\u7f00\u7684\u9879\u94fe" on Ming's Heart \u2192 statType:"implicit" (\u660e\u5fc3\u9879\u94fe\u7684\u6df7\u6c8c\u6297\u662f\u57fa\u5e95)
   - "T1\u751f\u547d\u7684\u80f8\u7532" \u2192 statType:"explicit"
   - "\u81f3\u5c113\u6761\u7834\u88c2\u8bcd\u7f00" \u2192 count group, each filter statType:"fractured"

   \u26a0\ufe0f "\u4efb\u610f\u6765\u6e90/\u7efc\u5408/\u603b\u548c + \u6570\u503c" RULE:
   When user says "\u4efb\u610f\u6765\u6e90XX\u603b\u548c>N" or "\u7efc\u5408XX>N" or "XX\u52a0\u8d77\u6765>N",
   put the NUMBER DIRECTLY on the stat min/max. Do NOT create a separate statGroup.
   Example: "\u80fd\u91cf\u62a4\u76fe\u603b\u548c>20" \u2192 {"text":"# to maximum Energy Shield","min":20,"statType":null}
   Example: "\u4efb\u610f\u6765\u6e90\u51b0\u6297\u5927\u4e8e30" \u2192 {"text":"#% to Cold Resistance","min":30,"statType":null}
   The system handles type expansion + weight sum automatically when min/max is set on a null-statType stat.

5. "statGroups": additional group logic for weight/count/not queries. ALWAYS an array.
   Use the flat "stats" array for individual filters (T1\u7535\u70b9\u4f24, \u751f\u547d80+, etc.)
   Use statGroups ONLY for special group logic (weight sum, count, not).
   The two are ADDITIVE \u2014 individual stats still go in "stats", group logic in "statGroups".
   
   Group types:
   - "and": ALL filters must match (you rarely need this \u2014 use flat "stats" instead)
   - "not": NONE match (exclude). E.g. "\u4e0d\u8981\u95ea\u907f" \u2192 statGroups:[{type:"not",filters:[...]}]
   - "count": at least value.min filters match. E.g. "\u81f3\u5c113\u6761\u6297\u6027" \u2192 count group, value.min=3.
        Use value.max for "\u4e0d\u8d85\u8fc7/\u6700\u591a N \u6761". E.g. "\u6297\u6027\u4e0d\u8d85\u8fc73\u6761" \u2192 count group, value.max=3.
        Both can be set together. E.g. "2-4\u6761\u6297\u6027" \u2192 count group, value.min=2, value.max=4.
   - "weight": SUM of matching filter VALUES \u2265 value.min. Use for "\u603b\u548c/\u52a0\u8d77\u6765" queries.
        "\u603b\u548c\u5927\u4e8e40" \u2192 weight group, value.min=40.
        "\u603b\u548c\u4e0d\u8d85\u8fc740" \u2192 weight group, value.max=40.
   
   COMPLETE EXAMPLE \u2014 "T1\u7535\u70b9\u4f24\u6212\u6307 \u751f\u547d80+ \u4efb\u610f\u6297\u6027\u52a0\u8d77\u6765\u5927\u4e8e30 \u4e0d\u8d85\u8fc7200e":
   {
     "stats": [
       {"text":"adds # to # lightning damage to attacks","min":null,"max":null,"statType":null},
       {"text":"+# to maximum Life","min":80,"max":null,"statType":null}
     ],
     "type": "Ring",
     "statGroups": [{
       "type": "weight",
       "value": {"min": 30},
       "filters": [
         {"text":"#% to Fire Resistance","min":null,"max":null,"statType":null},
         {"text":"#% to Cold Resistance","min":null,"max":null,"statType":null},
         {"text":"#% to Lightning Resistance","min":null,"max":null,"statType":null},
         {"text":"#% to Chaos Resistance","min":null,"max":null,"statType":null}
       ]
     }],
     "price": {"max":200,"currency":"exalted"},
     "explanation": "\u7535\u70b9\u4f24+\u751f\u547d+\u6297\u6027\u603b\u548c>30\u7684\u6212\u6307\uff0c\u9884\u7b97200e"
   }
   
   Empty array [] when no special group logic. Never omit this field.

### Equipment (left-side attribute filters)
4. "equipment": array. Use these exact "id" values:
   - ar (\u62a4\u7532), ev (\u95ea\u907f), es (\u80fd\u91cf\u62a4\u76fe/ES), block (\u683c\u6321\u7387), spirit (\u7cbe\u9b42)
   - dps (\u79d2\u4f24), pdps (\u7269\u7406\u79d2\u4f24), edps (\u5143\u7d20\u79d2\u4f24), damage (\u5355\u6b21\u4f24\u5bb3)
   - aps (\u653b\u901f), crit (\u66b4\u51fb\u7387), reload_time (\u88c5\u586b\u65f6\u95f4, use max for upper bound)
   
   \u26a0\ufe0f CRITICAL \u2014 Equipment vs Stat distinction:
   
   \u26a0\ufe0f **ARMOUR EQUIPMENT RULE \u2014 CRITICAL** \u26a0\ufe0f
   On armour pieces (Body Armour, Helmet, Boots, Gloves), **EVERY** mention of
   Energy Shield (ES/\u80fd\u91cf\u62a4\u76fe), Armour (\u62a4\u7532), or Evasion (\u95ea\u907f) goes to equipment.
   **NEVER** put them in stats.
   
   This covers ALL phrasing:
   - "\u5c5e\u6027XX" / "\u9ad8XX" / "\u4f4eXX" / "XX\u5927\u4e8eN" / "XX\u81f3\u5c11N" / "XX" alone
   - Even vague descriptors like "\u9ad8ES\u80f8\u7532" \u2192 equipment, NO stat entry
   - "\u80f8\u7532\u9700\u8981\u9ad8\u62a4\u7532" \u2192 equipment
   - "ES\u80f8\u7532 \u62a4\u76fe\u5927\u4e8e500" \u2192 equipment only (both "ES" and "\u62a4\u76fe\u5927\u4e8e500")
   
   Examples:
   - "\u9ad8ES\u80f8\u7532" \u2192 equipment:[{id:"es",min:null,max:null}], stats:[] (NO ES stat!)
   - "\u5c5e\u6027\u80fd\u91cf\u62a4\u76fe\u5927\u4e8e100" \u2192 equipment:[{id:"es",min:100,max:null}]
   - "\u9ad8\u62a4\u7532\u9ad8\u95ea\u907f\u8863\u670d" \u2192 equipment:[{id:"ar",min:null,max:null},{id:"ev",min:null,max:null}]
   - "\u80f8\u7532ES1000" \u2192 equipment:[{id:"es",min:1000,max:null}]
   - "\u80f8\u7532 \u62a4\u76fe\u8bcd\u7f00" \u2192 ONLY then use stats with (Local): "+# to maximum Energy Shield (Local)"
   - "\u9ad8ES\u80f8\u7532 \u5c5e\u6027\u80fd\u91cf\u62a4\u76fe\u5927\u4e8e100" \u2192 equipment:[{id:"es",min:100}], NO stats entry for ES
   
   Only on JEWELRY/WEAPONS: "+# to maximum Energy Shield" \u2192 stat.
   Only on ARMOUR when user EXPLICITLY says "\u8bcd\u7f00/\u8bcd\u6761/mod/affix": use (Local) variant.
   
   Other (Local) stats (when user says "\u8bcd\u7f00" on armour):
   - Armour pieces: "+# to Armour (Local)", "#% increased Armour (Local)",
     "+# to Evasion Rating (Local)", "#% increased Evasion Rating (Local)"
   - Weapons: "+# to Accuracy Rating (Local)", "#% increased Attack Speed (Local)"
   - Shields: "#% increased Block chance (Local)"
   
   E.g. "\u6212\u6307\u80fd\u91cf\u62a4\u76fe50" \u2192 stats:[{text:"+# to maximum Energy Shield",min:50}].
   E.g. "\u9ad8\u62a4\u7532\u95ea\u907f\u8863\u670d" \u2192 equipment:[{id:"ar",min:null,max:null},{id:"ev",min:null,max:null}].

   \u26a0\ufe0f **WEAPON DAMAGE RULE \u2014 CRITICAL** \u26a0\ufe0f
   On weapons (Bow, Crossbow, Sword, Axe, Mace, Dagger, Claw, Spear, Flail,
   Quarterstaff, Wand, Sceptre, Staff), **EVERY** mention of damage goes to equipment.
   **NEVER** put raw damage (\u4f24\u5bb3/\u79d2\u4f24/\u7269\u7406\u4f24\u5bb3/\u5143\u7d20\u4f24\u5bb3) in stats.

   Equipment filter IDs for weapon damage:
   - dps (\u79d2\u4f24/DPS) \u2014 damage per second
   - pdps (\u7269\u7406\u79d2\u4f24) \u2014 physical DPS
   - edps (\u5143\u7d20\u79d2\u4f24) \u2014 elemental DPS
   - damage (\u5355\u6b21\u4f24\u5bb3/\u4f24\u5bb3) \u2014 per-hit damage

   Mapping:
   - "\u79d2\u4f24" / "DPS" \u2192 equipment:[{id:"dps",...}]
   - "\u7269\u7406\u79d2\u4f24" / "pdps" \u2192 equipment:[{id:"pdps",...}]
   - "\u5143\u7d20\u79d2\u4f24" / "edps" \u2192 equipment:[{id:"edps",...}]
   - "\u4f24\u5bb3" / "\u9ad8\u4f24\u5bb3" / "\u5927\u4f24" \u2192 equipment:[{id:"damage",...}]
   - "\u7269\u7406\u4f24\u5bb3" \u2192 equipment:[{id:"damage",...}] (per-hit, not dps)

   Only when user EXPLICITLY says "\u8bcd\u7f00/\u8bcd\u6761/mod/affix" on a weapon \u2192 use stat
   with "#% increased Physical Damage" or "Adds # to # Physical Damage".

   Examples:
   - "\u5f13 \u4f24\u5bb3\u5927\u4e8e200" \u2192 equipment:[{id:"damage",min:200}], stats:[]
   - "\u9ad8\u79d2\u4f24\u5f29" \u2192 equipment:[{id:"dps",min:null,max:null}], stats:[]
   - "500+dps\u7684\u5f13\u7bad" \u2192 equipment:[{id:"dps",min:500}], stats:[]
   - "\u5355\u624b\u5251 \u7269\u7406\u79d2\u4f24300" \u2192 equipment:[{id:"pdps",min:300}], stats:[]
   - "\u5f13 \u4f24\u5bb3\u8bcd\u7f00" \u2192 ONLY then: stats with "#% increased Physical Damage"

   \u26a0\ufe0f **WEAPON APS RULE** \u26a0\ufe0f
   On weapons (Bow, Crossbow, Sword, Axe, Mace, Dagger, Claw, Spear, Flail,
   Quarterstaff, Wand, Sceptre, Staff), **attacks per second (\u653b\u901f/\u6b66\u5668\u901f\u5ea6/APS)**
   goes to equipment. NEVER put in stats.
   - equipment id: "aps"
   - "\u653b\u901f" / "\u6b66\u5668\u901f\u5ea6" / "\u9ad8\u653b\u901f" \u2192 equipment:[{id:"aps",...}]
   Only when user EXPLICITLY says "\u653b\u901f\u8bcd\u7f00/mod" \u2192 stat with "#% increased Attack Speed"

   Example: "\u9ad8\u653b\u901f\u5f13" \u2192 equipment:[{id:"aps",min:null,max:null}], stats:[]
   Example: "\u653b\u901f1.5\u4ee5\u4e0a\u7684\u5355\u624b\u5251" \u2192 equipment:[{id:"aps",min:1.5}]

   \u26a0\ufe0f **WEAPON CRIT RULE** \u26a0\ufe0f
   On weapons, **critical chance (\u66b4\u51fb\u7387/\u66b4\u51fb/crit)** goes to equipment. NEVER in stats.
   - equipment id: "crit"
   - "\u66b4\u51fb\u7387" / "\u66b4\u51fb" / "\u9ad8\u66b4\u51fb" / "crit" \u2192 equipment:[{id:"crit",...}]
   Only when user EXPLICITLY says "\u66b4\u51fb\u8bcd\u7f00/mod" \u2192 stat with "#% to Critical Hit Chance"

   Example: "\u9ad8\u66b4\u51fb\u5f13" \u2192 equipment:[{id:"crit",min:null,max:null}], stats:[]
   Example: "\u66b4\u51fb8\u4ee5\u4e0a\u7684\u5315\u9996" \u2192 equipment:[{id:"crit",min:8}]

   \u26a0\ufe0f **CROSSBOW RELOAD RULE** \u26a0\ufe0f
   On crossbows (\u5f29/Crossbow), **reload time (\u88c5\u586b\u65f6\u95f4/\u88c5\u586b)** goes to equipment. NEVER in stats.
   - equipment id: "reload_time" (in seconds, lower is faster \u2014 use max)
   - "\u88c5\u586b" / "\u88c5\u586b\u65f6\u95f4" / "\u88c5\u586b\u5feb" / "reload" \u2192 equipment:[{id:"reload_time",max:...}]

   Example: "\u88c5\u586b0.5\u4ee5\u4e0b\u7684\u5f29" \u2192 equipment:[{id:"reload_time",max:0.5}], stats:[]
   Example: "\u88c5\u586b\u5feb\u7684\u5f29" \u2192 equipment:[{id:"reload_time",min:null,max:null}], stats:[]

   \u26a0\ufe0f **SHIELD BLOCK RULE** \u26a0\ufe0f
   On shields (\u76fe\u724c/Shield), **block chance (\u683c\u6321\u7387/\u683c\u6321)** goes to equipment. NEVER in stats.
   - equipment id: "block"
   - "\u683c\u6321" / "\u683c\u6321\u7387" / "\u9ad8\u683c\u6321" \u2192 equipment:[{id:"block",...}]
   Only when user EXPLICITLY says "\u683c\u6321\u8bcd\u7f00/mod" \u2192 stat with "#% increased Block chance"

   Example: "\u9ad8\u683c\u6321\u76fe\u724c" \u2192 equipment:[{id:"block",min:null,max:null}], stats:[]
   Example: "\u683c\u632130\u4ee5\u4e0a\u7684\u76fe" \u2192 equipment:[{id:"block",min:30}]

   \u26a0\ufe0f **SPIRIT RULE** \u26a0\ufe0f
   On ANY item, **spirit (\u7cbe\u9b42)** goes to equipment. NEVER in stats.
   - equipment id: "spirit"
   - "\u7cbe\u9b42" / "\u9ad8\u7cbe\u9b42" / "spirit" \u2192 equipment:[{id:"spirit",...}]
   Only when user EXPLICITLY says "\u7cbe\u9b42\u8bcd\u7f00/mod" \u2192 stat with "+# to Spirit"

   Example: "\u9ad8\u7cbe\u9b42\u80f8\u7532" \u2192 equipment:[{id:"spirit",min:null,max:null}], stats:[]
   Example: "\u7cbe\u9b4250\u4ee5\u4e0a\u7684\u6743\u6756" \u2192 equipment:[{id:"spirit",min:50}]

### Type Filters
5. "rarity": "rare" if user says \u7a00\u6709/\u9ec4\u88c5, "unique" for \u4f20\u5947/\u6697\u91d1, "magic" for \u9b54\u6cd5/\u84dd\u88c5, "normal" for \u767d\u88c5/\u666e\u901a, "nonunique" for \u975e\u4f20\u5947. null = any.
6. "ilvl": item level (\u7269\u54c1\u7b49\u7ea7). E.g. "\u7269\u54c1\u7b49\u7ea780+" \u2192 {min:80,max:null}, "ilvl 70-85" \u2192 {min:70,max:85}. null if not specified.
7. "quality": item quality (\u54c1\u8d28). E.g. "\u54c1\u8d2820" \u2192 {min:20,max:null}. null if not specified.
8. "runeSockets": augmentable sockets (\u53ef\u6253\u5b54\u6570/\u7b26\u6587\u5b54). E.g. "2\u5b54" \u2192 {min:2,max:null}. null if not specified.

### Requirements
9. "req": array. IDs: lvl (\u9700\u6c42\u7b49\u7ea7), str (\u9700\u6c42\u529b\u91cf), dex (\u9700\u6c42\u654f\u6377), int (\u9700\u6c42\u667a\u6167).
   E.g. "\u9700\u6c42\u7b49\u7ea760\u4ee5\u4e0b \u529b\u91cf50+" \u2192 [{id:"lvl",min:null,max:60},{id:"str",min:50,max:null}]
   Empty [] if not mentioned.

### Trade Filters
10. "price": buyout price. "currency": "chaos"|"divine"|"exalted". Currency abbreviations:
    - c/chaos/C = chaos (\u6df7\u6c8c\u77f3)
    - d/div/D/divine = divine (\u795e\u5723\u77f3)  
    - e/ex/E/exalted = exalted (\u5d07\u9ad8\u77f3)
    E.g. "\u6700\u9ad850e" or "\u4e0d\u8d85\u8fc7200e" \u2192 {max:200,currency:"exalted"}, "10d\u4ee5\u4e0a" \u2192 {min:10,currency:"divine"}, "5c-20c" \u2192 {min:5,max:20,currency:"chaos"}
    null if no price limit. "\u6700\u9ad8"/"\u4e0d\u8d85\u8fc7"/"\u6700\u591a" = max, "\u4ee5\u4e0a"/"\u6700\u5c11"/"\u6700\u4f4e" = min.
11. "saleType": "priced" for \u4e00\u53e3\u4ef7/\u6807\u4ef7, "priced_with_info" for \u5e26\u5907\u6ce8\u4ef7\u683c, "unpriced" for \u65e0\u6807\u4ef7, "any" or null.
12. "listed": time since listed (\u4e0a\u67b6\u65f6\u95f4). "1hour"/"3hours"/"12hours"/"1day"/"3days"/"1week"/"2weeks"/"1month"/"2months". E.g. "\u4e0a\u67b61\u5929\u5185" \u2192 "1day". null = any time.
13. "sellerAccount": seller name (\u5356\u5bb6\u540d). null if not specified.
14. "collapse": true to collapse listings by account (\u5408\u5e76\u540c\u4e00\u5356\u5bb6). null for default (no).
15. "goldFee": gold fee (\u91d1\u5e01\u8d39\u7528). E.g. "\u91d1\u5e01\u8d39\u4e0d\u8d85\u8fc7500" \u2192 {min:null,max:500}. null if not specified.

### General
16. "name" = null unless user names a specific unique item.
17. "status": "online" by default.
18. "sort": "price-asc" by default.
19. "explanation" in Chinese.
20. \u26a0\ufe0f BOOTS MOVEMENT SPEED RULE:
   When user searches boots (\u978b\u5b50/Boots), always include movement speed as a stat:
   - EXACT stat text: "#% increased Movement Speed"
   - statType: match user's wording \u2014 "\u4efb\u610f\u6765\u6e90" \u2192 null, "\u8bcd\u7f00" \u2192 "explicit", otherwise null
   - min/max: apply user's number if given (e.g. "30%\u4ee5\u4e0a" \u2192 min:30)
   
   Example: "\u4efb\u610f\u6765\u6e90\u79fb\u52a8\u901f\u5ea630%\u4ee5\u4e0a\u7684\u978b\u5b50" \u2192 stats:[{text:"#% increased Movement Speed",min:30,statType:null}]
   Example: "20\u79fb\u901f\u978b\u5b50" \u2192 stats:[{text:"#% increased Movement Speed",min:20,statType:null}]
   This stat is MANDATORY for any boot query. Never skip it.

## \u26a0\ufe0f CRITICAL: ALWAYS include price when mentioned
If the user says ANY price limit \u2014 "\u6700\u9ad8X", "\u4e0d\u8d85\u8fc7X", "X\u4ee5\u4e0b", "X\u4ee5\u4e0a", "\u6700\u5c11X", "X-Yc/d/e", "budget X" \u2014 you MUST output the "price" field. Never skip it.
Double-check before responding: did the user mention a price? If yes, output it.

## \u26a0\ufe0f Weapon stat types
On weapons (Bow, Sword, Axe, etc.), critical chance is "#% to Critical Hit Chance" NOT "#% increased Critical Hit Chance".
On weapons, added damage is "Adds # to # Physical Damage" NOT "#% increased Physical Damage" (that's a prefix).
Always use the EXACT stat text from the reference above.

Respond with ONLY the JSON. No markdown, no code fences.

${v}`;function k(e,t){let a=e.toLowerCase().replace(/[#+\-%]/g,"").replace(/\s+/g," ").trim(),n=null,i=0,r=e.toLowerCase(),s=/gain|extra|\u989d\u5916/.test(r),l=/add|\u9644\u52a0/.test(r);for(let e of t){let t=(e.text||"").toLowerCase().replace(/[#+\-%]/g,"").replace(/\s+/g," ").trim();if(t===a&&!String(e.id).startsWith("pseudo."))return e;if(!String(e.id).startsWith("pseudo.")&&(t.includes(a)||a.includes(t))){let r=Math.min(t.length,a.length)/Math.max(t.length,a.length),o=(e.text||"").toLowerCase(),u=/^adds\b/.test(o),c=/^gain\b.*\bextra\b/.test(o);s&&u&&!c&&(r*=.1),l&&!s&&c&&(r*=.1),r>i&&(i=r,n=e)}}if(!n)for(let e of t){let t=(e.text||"").toLowerCase().replace(/[#+\-%]/g,"").replace(/\s+/g," ").trim();if(t===a)return e}if(!n){let e=a.split(/\s+/).filter(e=>e.length>2);for(let a of t){let t=(a.text||"").toLowerCase(),r=e.filter(e=>t.includes(e)).length,o=r/e.length,u=(a.text||"").toLowerCase(),c=/^adds\b/.test(u),m=/^gain\b.*\bextra\b/.test(u);s&&c&&!m&&(o*=.1),l&&!s&&m&&(o*=.1),o>.5&&o>i&&(i=o,n=a)}}return n}async function O(e,t){if(!t.apiKey||t.apiKey.length<3)throw Error("API Key \u672a\u8bbe\u7f6e\u6216\u592a\u77ed \u2014 \u8bf7\u5728 \u2699\ufe0f \u8bbe\u7f6e\u4e2d\u586b\u5199");if(!t.apiUrl)throw Error("API URL \u672a\u8bbe\u7f6e \u2014 \u8bf7\u5728 \u2699\ufe0f \u8bbe\u7f6e\u4e2d\u586b\u5199");let a=await fetch(t.apiUrl,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t.apiKey}`},body:JSON.stringify({model:t.model,messages:[{role:"system",content:L},{role:"user",content:e}],temperature:.1,max_tokens:2e3})});if(!a.ok){let e=await a.text(),t=e.slice(0,200);throw console.error("[PoE2] AI API error:",a.status,t),Error(`AI API \u8fd4\u56de ${a.status}: ${t}`)}let n=await a.json();return n.choices?.[0]?.message?.content||""}let R=new Map,P={"to maximum Life":"\u6700\u5927\u751f\u547d","to maximum Mana":"\u6700\u5927\u9b54\u529b","to maximum Energy Shield":"\u6700\u5927\u80fd\u91cf\u62a4\u76fe","to Strength":"\u529b\u91cf","to Dexterity":"\u654f\u6377","to Intelligence":"\u667a\u6167","to all Attributes":"\u5168\u5c5e\u6027","to Fire Resistance":"\u706b\u7130\u6297\u6027","to Cold Resistance":"\u51b0\u51b7\u6297\u6027","to Lightning Resistance":"\u95ea\u7535\u6297\u6027","to Chaos Resistance":"\u6df7\u6c8c\u6297\u6027","to all Elemental Resistances":"\u5168\u5143\u7d20\u6297\u6027","increased Rarity of Items found":"\u7269\u54c1\u7a00\u6709\u5ea6\u63d0\u9ad8","increased Movement Speed":"\u79fb\u52a8\u901f\u5ea6\u63d0\u9ad8","increased Attack Speed":"\u653b\u51fb\u901f\u5ea6\u63d0\u9ad8","increased Cast Speed":"\u65bd\u6cd5\u901f\u5ea6\u63d0\u9ad8","to Spirit":"\u7cbe\u9b42","physical damage":"\u7269\u7406\u4f24\u5bb3","fire damage":"\u706b\u7130\u4f24\u5bb3","cold damage":"\u51b0\u51b7\u4f24\u5bb3","lightning damage":"\u95ea\u7535\u4f24\u5bb3","chaos damage":"\u6df7\u6c8c\u4f24\u5bb3",adds:"\u9644\u52a0",increased:"\u63d0\u9ad8",reduced:"\u964d\u4f4e",more:"\u66f4\u591a",less:"\u66f4\u5c11",gain:"\u7372\u5f97",extra:"\u984d\u5916","gain as extra":"\u7372\u5f97\u984d\u5916","Critical Strike Chance":"\u66b4\u51fb\u7387","Critical Hit Chance":"\u66b4\u51fb\u7387","Critical Damage Bonus":"\u66b4\u51fb\u4f24\u5bb3\u52a0\u6210","attack damage":"\u653b\u51fb\u4f24\u5bb3","spell damage":"\u6cd5\u672f\u4f24\u5bb3","elemental damage":"\u5143\u7d20\u4f24\u5bb3","minion damage":"\u53ec\u5524\u7269\u4f24\u5bb3",Armour:"\u62a4\u7532",Evasion:"\u95ea\u907f","Energy Shield":"\u80fd\u91cf\u62a4\u76fe","Life Regeneration":"\u751f\u547d\u56de\u590d","Mana Regeneration":"\u9b54\u529b\u56de\u590d","Life Recovery":"\u751f\u547d\u6062\u590d","stun recovery":"\u6655\u7729\u56de\u590d","Block chance":"\u683c\u6321\u7387","Spell Suppression":"\u6cd5\u672f\u538b\u5236","chance to Suppress Spell Damage":"\u6cd5\u672f\u538b\u5236\u7387"};async function D(e){switch(e.type){case"AI_SEARCH":{let t;let a=await x(),n=await O(e.payload.text,a.aiProvider),i=n.replace(/```(?:json)?\s*/g,"").trim();try{t=JSON.parse(i)}catch{return{status:"error",error:`Failed to parse AI response: ${n.slice(0,200)}`}}let r=await b(),s=function(e,t){let a=[],n=["explicit","implicit","enchant","fractured","desecrated"],i=e=>{if(!e.text)return null;let a=k(e.text,t);if(!a)return null;let n={id:a.id,value:{min:e.min??void 0,max:e.max??void 0},disabled:!1};return e.statType&&(n.type=e.statType),n},r=(e,a)=>{let i=new Set(t.map(e=>e.id)),r=[];for(let t=0;t<e.length;t++){let s=e[t],l=a[t];if(l?.statType)r.push(s);else{let e=String(s.id).split("."),t=e.length>1?e.slice(1).join("."):e[0];for(let e of n){let a=e+"."+t;i.has(a)&&r.push({...s,id:a,type:e})}}}return r},s=e=>!e.statType;if(e.stats?.length){let t=[];for(let n=0;n<e.stats.length;n++){let l=e.stats[n],o=i(l);if(o){if(s(l)){let e=r([o],[l]);if(!e.length)continue;if(null!=l.min||null!=l.max){let t=e.map(e=>({...e,value:{}}));a.push({type:"weight",filters:t,value:{min:l.min??void 0,max:l.max??void 0}})}else a.push({type:"count",filters:e,value:{min:1}})}else t.push(o)}}t.length&&a.push({type:"and",filters:t})}if(e.statGroups?.length)for(let t of e.statGroups){let e=t.filters.map(i).filter(Boolean),n=r(e,t.filters);n.length&&a.push({type:t.type,filters:n,value:t.value?.min!=null||t.value?.max!=null?{min:t.value.min,max:t.value.max}:void 0})}let l={query:{status:{option:e.status||"online"},stats:a,filters:{}},sort:"price-desc"===e.sort?{price:"desc"}:{price:"asc"}},o={};if(e.type){let t={Ring:"accessory.ring",Amulet:"accessory.amulet",Belt:"accessory.belt",Boots:"armour.boots",Gloves:"armour.gloves",Helmet:"armour.helmet","Body Armour":"armour.chest",Shield:"armour.shield",Quiver:"armour.quiver",Focus:"armour.focus",Claw:"weapon.claw",Dagger:"weapon.dagger","One Handed Sword":"weapon.onesword","One Handed Axe":"weapon.oneaxe","One Handed Mace":"weapon.onemace",Spear:"weapon.spear",Flail:"weapon.flail","Two Handed Sword":"weapon.twosword","Two Handed Axe":"weapon.twoaxe","Two Handed Mace":"weapon.twomace",Quarterstaff:"weapon.warstaff",Bow:"weapon.bow",Crossbow:"weapon.crossbow",Wand:"weapon.wand",Sceptre:"weapon.sceptre",Staff:"weapon.staff","Life Flask":"flask.life","Mana Flask":"flask.mana",Flask:"flask",Jewel:"jewel",Waystone:"map.waystone",Tablet:"map.tablet",Rune:"currency.rune","Soul Core":"currency.soulcore","Skill Gem":"gem.activegem","Support Gem":"gem.supportgem"}[e.type];t&&(o.category={option:t})}if(e.rarity&&(o.rarity={option:e.rarity}),e.ilvl&&(o.ilvl={},null!=e.ilvl.min&&(o.ilvl.min=e.ilvl.min),null!=e.ilvl.max&&(o.ilvl.max=e.ilvl.max)),e.quality&&(o.quality={},null!=e.quality.min&&(o.quality.min=e.quality.min),null!=e.quality.max&&(o.quality.max=e.quality.max)),Object.keys(o).length&&(l.query.filters={...l.query.filters,type_filters:{filters:o}}),e.equipment?.length||e.runeSockets){let t={};for(let a of e.equipment||[])a.id&&(t[a.id]={},null!=a.min&&(t[a.id].min=a.min),null!=a.max&&(t[a.id].max=a.max));e.runeSockets&&(t.rune_sockets={},null!=e.runeSockets.min&&(t.rune_sockets.min=e.runeSockets.min),null!=e.runeSockets.max&&(t.rune_sockets.max=e.runeSockets.max)),Object.keys(t).length&&(l.query.filters={...l.query.filters,equipment_filters:{filters:t}})}if(e.req?.length){let t={};for(let a of e.req)a.id&&(t[a.id]={},null!=a.min&&(t[a.id].min=a.min),null!=a.max&&(t[a.id].max=a.max));Object.keys(t).length&&(l.query.filters={...l.query.filters,req_filters:{filters:t}})}if(e.name&&(l.query.name=e.name),e.price?.currency||e.saleType||e.listed||e.sellerAccount||null!=e.collapse||e.goldFee){let t={};e.price?.currency&&(t.price={min:e.price.min??void 0,max:e.price.max??void 0,option:e.price.currency}),e.saleType&&(t.sale_type={option:"priced"===e.saleType?null:e.saleType}),e.listed&&(t.indexed={option:e.listed}),e.sellerAccount&&(t.account={input:e.sellerAccount}),null!=e.collapse&&(t.collapse={option:e.collapse?"true":null}),e.goldFee&&(t.fee={},null!=e.goldFee.min&&(t.fee.min=e.goldFee.min),null!=e.goldFee.max&&(t.fee.max=e.goldFee.max)),l.query.filters={...l.query.filters,trade_filters:{filters:t}}}return l}(t,r),c=s.query.stats?.flatMap(e=>e.filters)||[],m=c.filter(e=>!e.disabled).length;await u();let p=[];if(t.type)for(let e of c){if(e.disabled)continue;let a=r.find(t=>t.id===e.id);if(a?.text){let n=function(e,t){if(!l||!t)return{valid:!0};let a=d[t];if(!a)return{valid:!0};let n=o.get(a);if(!n||0===n.size)return{valid:!0};let i=e.replace(/\([\d.\u2014]+\)/g,"#").replace(/[\d.]+/g,"#").replace(/[+\-%]/g,"").replace(/\s+/g," ").trim().toLowerCase();for(let e of n)if(i.startsWith(e))return{valid:!0,categorySlug:a};return{valid:!1,categorySlug:a}}(a.text,t.type);n.valid||(e.disabled=!0,p.push(a.text))}}let g={es:/energy shield/i,ar:/armour(?!.*evasion)/i,ev:/evasion/i};if(["Body Armour","Helmet","Boots","Gloves"].includes(t.type||"")&&t.equipment?.length)for(let e of t.equipment){let t=g[e.id];if(t)for(let e of c){if(e.disabled)continue;let a=r.find(t=>t.id===e.id);a?.text&&t.test(a.text)&&(e.disabled=!0,p.push(a.text+" (\u5df2\u7531\u88c5\u5907\u5c5e\u6027\u8986\u76d6)"))}}let h=(t.statGroups?.flatMap(e=>e.filters)||t.stats||[]).filter(e=>e.text),w=h.filter(e=>!!e.text&&!k(e.text,r)),v={lvl:"\u9700\u6c42\u7b49\u7ea7",str:"\u9700\u6c42\u529b\u91cf",dex:"\u9700\u6c42\u654f\u6377",int:"\u9700\u6c42\u667a\u6167"},_={ar:"\u62a4\u7532",ev:"\u95ea\u907f",es:"\u80fd\u91cf\u62a4\u76fe",block:"\u683c\u6321\u7387",spirit:"\u7cbe\u9b42",dps:"\u79d2\u4f24",pdps:"\u7269\u7406DPS",edps:"\u5143\u7d20DPS",damage:"\u4f24\u5bb3",aps:"\u653b\u901f",crit:"\u66b4\u51fb\u7387",reload_time:"\u88c5\u586b\u65f6\u95f4"},T=[];if(t.rarity&&T.push({normal:"\u767d\u88c5",magic:"\u84dd\u88c5",rare:"\u7a00\u6709",unique:"\u4f20\u5947",nonunique:"\u975e\u4f20\u5947"}[t.rarity]||t.rarity),t.ilvl){let e=null!=t.ilvl.min&&null!=t.ilvl.max?`${t.ilvl.min}-${t.ilvl.max}`:null!=t.ilvl.min?`\u2265${t.ilvl.min}`:`\u2264${t.ilvl.max}`;T.push(`\u7269\u54c1\u7b49\u7ea7${e}`)}if(t.quality){let e=null!=t.quality.min?`\u2265${t.quality.min}`:`\u2264${t.quality.max}`;T.push(`\u54c1\u8d28${e}`)}if(t.runeSockets){let e=null!=t.runeSockets.min?`\u2265${t.runeSockets.min}`:`\u2264${t.runeSockets.max}`;T.push(`${e}\u5b54`)}if(t.req?.length)for(let e of t.req){let t=v[e.id]||e.id,a=null!=e.min&&null!=e.max?`${e.min}-${e.max}`:null!=e.min?`\u2265${e.min}`:`\u2264${e.max}`;T.push(`${t}${a}`)}if(t.saleType&&T.push({priced:"\u4e00\u53e3\u4ef7",priced_with_info:"\u5e26\u5907\u6ce8\u4ef7",unpriced:"\u65e0\u6807\u4ef7"}[t.saleType]||t.saleType),t.listed&&T.push(`\u4e0a\u67b6${{"1hour":"1\u5c0f\u65f6\u5185","3hours":"3\u5c0f\u65f6\u5185","12hours":"12\u5c0f\u65f6\u5185","1day":"1\u5929\u5185","3days":"3\u5929\u5185","1week":"1\u5468\u5185","2weeks":"2\u5468\u5185","1month":"1\u6708\u5185","2months":"2\u6708\u5185"}[t.listed]||t.listed}`),t.sellerAccount&&T.push(`\u5356\u5bb6:${t.sellerAccount}`),t.goldFee){let e=null!=t.goldFee.min&&null!=t.goldFee.max?`${t.goldFee.min}-${t.goldFee.max}`:null!=t.goldFee.min?`\u2265${t.goldFee.min}`:`\u2264${t.goldFee.max}`;T.push(`\u91d1\u5e01\u8d39${e}`)}if(t.price?.currency){let e={chaos:"c",divine:"d",exalted:"e"}[t.price.currency]||t.price.currency,a=null!=t.price.min&&null!=t.price.max?`${t.price.min}-${t.price.max} ${e}`:null!=t.price.min?`\u2265${t.price.min} ${e}`:`\u2264${t.price.max} ${e}`;T.push(`\ud83d ${a}`)}let A=(t.equipment||[]).filter(e=>e.id).map(e=>{let t=_[e.id]||e.id,a=null!=e.min&&null!=e.max?`${e.min}-${e.max}`:null!=e.min?`\u2265${e.min}`:`\u2264${e.max}`;return`${t}${a}`});await f();let q=s.query.stats?.flatMap(e=>e.filters).filter(e=>!e.disabled)||[],C={},L={};for(let e of q){let t=r.find(t=>t.id===e.id);if(t?.text){let a=y(t.text);if(a){let n=t.text+(e.type?"::"+e.type:"");C[n]=a,e.type&&(L[n]=e.type)}}}let R={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),text:e.payload.text,explanation:t.explanation||"",type:t.type||null,tags:T,matched:m,timestamp:Date.now()};try{let e=await E("searchHistory"),t=e.searchHistory||[];t.unshift(R),t.length>50&&(t.length=50),await S({searchHistory:t})}catch(e){console.warn("[PoE2] Failed to save history:",e)}let P=[];for(let e of t.statGroups||[]){let t="count"===e.type?"\u6761\u6570":"weight"===e.type?"\u603b\u548c":e.type,a=[];e.value?.min!=null&&a.push(`\u2265${e.value.min}`),e.value?.max!=null&&a.push(`\u2264${e.value.max}`),P.push(`${t}(${a.join(",")})`)}return{status:"success",result:{query:s.query,sort:s.sort,explanation:t.explanation||"",type:t.type||null,equipment:A,tags:T,matched:m,unmatched:w.map(e=>e.text),translations:C,statTypes:L,excluded:p,statSummary:P}}}case"GET_STATS":{let e=await b();return{status:"success",result:e}}case"TRANSLATE_STAT":{let t=function(e){if(R.has(e))return R.get(e);let t=e;for(let[e,a]of Object.entries(P))t=t.replace(RegExp(e,"gi"),a);return t=t.replace(/(\d+\.?\d*)/g,"$1").replace(/^([+-]?\d+\.?\d*)\s*/,"$1 "),R.set(e,t),t}(e.payload.statText);return{status:"success",result:t}}case"EXECUTE_SEARCH":{let t=await q(e.payload.query,e.payload.league);return{status:"success",result:t}}case"FETCH_ITEMS":{let t=await C(e.payload.hashes,e.payload.searchId);return{status:"success",result:t}}case"GET_SETTINGS":{let e=await x();return{status:"success",result:e}}case"SAVE_SETTINGS":{await w(e.payload);let t=await x(),a=t?.aiProvider?.apiKey===e.payload?.aiProvider?.apiKey;return console.log("[PoE2] Settings saved. Verify:",a?"OK":"MISMATCH","saved_key_len="+(e.payload?.aiProvider?.apiKey?.length||0),"read_key_len="+(t?.aiProvider?.apiKey?.length||0)),{status:"success",result:t}}case"TRANSLATE_BATCH":{await f();let t={};for(let a of e.payload.texts){let e=y(a);e&&(t[a]=e)}return{status:"success",result:t}}case"GET_HISTORY":{let e=await E("searchHistory");return{status:"success",result:e.searchHistory||[]}}case"CLEAR_HISTORY":return await new Promise(e=>{chrome.storage.local.remove("searchHistory",()=>{chrome.runtime.lastError&&console.warn("[PoE2] storageRemove error:",chrome.runtime.lastError),e()})}),{status:"success"};case"RESOLVE_MOD_TIERS":{let{mods:t}=e.payload;c||(l&&l.categories||(l=null),await u(),c||m());let a={};for(let e=0;e<t.length;e++)a[e]=function(e,t){if(!c)return null;let a=e.replace(/\([\d.\u2014]+\)/g,"#").replace(/[\d.]+/g,"#").replace(/[+\-%]/g,"").replace(/\s+/g," ").trim().toLowerCase(),n=c.get(a);if(!n||0===n.length)return null;let i=e.match(/[\d.]+/g)?.map(Number)||[];for(let e=0;e<n.length;e++){let t=n[e],a=t.detail.match(/[\d.]+/g)?.map(Number)||[];if(i.length&&a.length&&a.length>=2&&i.length>=1){let t=Math.min(a[0],a[1]),n=Math.max(a[0],a[1]),r=i[0];if(r>=t&&r<=n)return{tier:e,label:`T${e}`}}}return{tier:0,label:"T0"}}(t[e].text,t[e].category);return{status:"success",result:a}}default:return{status:"error",error:"Unknown message type"}}}chrome.runtime.onMessage.addListener((e,t,a)=>(D(e).then(a).catch(e=>{a({status:"error",error:String(e)})}),!0)),chrome.runtime.onInstalled.addListener(()=>{b().catch(()=>{})}),console.log("[PoE2 Trade Enhancer] Background worker ready")},{"~types":"bzU1O","@parcel/transformer-js/src/esmodule-helpers.js":"fRZO2"}],bzU1O:[function(e,t,a){var n=e("@parcel/transformer-js/src/esmodule-helpers.js");n.defineInteropFlag(a),n.export(a,"DEFAULT_SETTINGS",()=>i);let i={aiProvider:{apiUrl:"https://api.deepseek.com/v1/chat/completions",apiKey:"",model:"deepseek-chat"},showChineseAffixes:!0,showTierLabels:!0,autoCollapseOutOfTier:!1}},{"@parcel/transformer-js/src/esmodule-helpers.js":"fRZO2"}],fRZO2:[function(e,t,a){a.interopDefault=function(e){return e&&e.__esModule?e:{default:e}},a.defineInteropFlag=function(e){Object.defineProperty(e,"__esModule",{value:!0})},a.exportAll=function(e,t){return Object.keys(e).forEach(function(a){"default"===a||"__esModule"===a||t.hasOwnProperty(a)||Object.defineProperty(t,a,{enumerable:!0,get:function(){return e[a]}})}),t},a.export=function(e,t,a){Object.defineProperty(e,t,{enumerable:!0,get:a})}},{}]},["frrV4"],"frrV4","parcelRequire1dc8"),globalThis.define=t;