export const categories=['Sports','Politics','Entertainment','Business','Crypto','Technology','World events','Everyday life','Other'];
const legacyCategories=['Infrastructure','Electricity','Education','Public services','Crypto projects'];
export const templates={
 Sports:{question:'Will [team] win against [opponent] on [match date]?',yes:'The official organiser records the named team as the winner of the specified match. State whether extra time and penalties count.',no:'The named team loses or draws under the agreed match rules.',unclear:'Refund if the match is cancelled or not completed before the outcome deadline.'},
 Politics:{question:'Will [candidate] be officially declared the winner of [election] by [date]?',yes:'The designated election authority officially declares the named candidate the winner by the outcome deadline.',no:'The designated election authority declares another candidate the winner by the outcome deadline.',unclear:'Refund if there is no official result by the deadline or the result is disputed under the stated criteria.'},
 Entertainment:{question:'Will [artist] release [named album] by [date]?',yes:'The complete named album is publicly available on the specified official streaming service before the deadline.',no:'The complete named album is not publicly available on that service by the deadline. A single, teaser or announcement does not qualify.',unclear:'Refund if the album identity, availability or release timing cannot be reliably established.'},
 Business:{question:'Will [company] announce [specific milestone] by [date]?',yes:'The company publishes a dated official announcement confirming the precisely defined milestone before the deadline.',no:'No qualifying official announcement is published by the deadline. Specify which announcement channels will be checked.',unclear:'Refund if official sources are unavailable or contradict each other.'},
 Crypto:{question:'Will [project] launch [named product] by [date]?',yes:'The named product is publicly usable with the specified functionality before the deadline, supported by an official release and working product evidence.',no:'The defined product is not usable by the deadline. A teaser, roadmap or closed preview does not qualify unless explicitly included.',unclear:'Refund if product access or release timing cannot be verified from the agreed sources.'},
 Technology:{question:'Will [company] release [named device] by [date]?',yes:'The exact named device becomes available to purchase from the specified official retailer before the deadline. Define the region and whether preorders qualify.',no:'The device is not available under the stated purchase criteria by the deadline.',unclear:'Refund if availability or product identity cannot be reliably established.'},
 'World events':{question:'Will [official agency] report [measurable event] by [date]?',yes:'The named official agency publishes a dated report confirming the exact measurable event before the deadline.',no:'The agreed official record shows that the specified event or threshold was not reached by the deadline.',unclear:'Refund if the official record is unavailable, incomplete or contradictory.'},
 'Everyday life':{question:'Will [named event] happen in [location] by [date]?',yes:'The precisely defined event occurs at the named location before the deadline, verified using the stated public source.',no:'The agreed source provides reliable evidence that the defined event did not occur by the deadline.',unclear:'Refund if the event is cancelled or sufficient public evidence is unavailable.'}
};
const prefix='ONRECORD-PROMISE-V1\n',marketPrefix='ONRECORD-MARKET-V2\n';
const size=s=>new TextEncoder().encode(s).length;
export function encodePromise({category,organisation,place,criteria}){
 if(![...categories,...legacyCategories].includes(category))throw Error('Select a category.');
 const rules=prefix+JSON.stringify({category,organisation:organisation.trim(),place:place.trim()})+'\n\n'+criteria.trim();
 if(size(rules)>2000)throw Error('The details and criteria must fit within 2,000 bytes.');
 if(/\[[^\]]+\]/.test(criteria))throw Error('Replace template placeholders with specific details.');
 return rules;
}
export function encodeMarket({category,yes,no,unclear,context=''}){
 if(!categories.includes(category))throw Error('Select a category.');
 for(const [label,value] of Object.entries({Yes:yes,No:no,Unclear:unclear})){
  if(typeof value!=='string'||value.trim().length<20)throw Error(label+' rules need at least 20 characters.');
  if(/\[[^\]]+\]/.test(value))throw Error('Replace all rule placeholders with specific details.');
 }
 const rules=marketPrefix+JSON.stringify({category,yes:yes.trim(),no:no.trim(),unclear:unclear.trim(),context:context.trim()});
 if(size(rules)>2000)throw Error('Combined outcome rules are too long. Shorten them to fit the Stellar record (2,000 bytes).');
 return rules;
}
export function parsePromise(rules){
 if(rules.startsWith(marketPrefix)){try{const p=JSON.parse(rules.slice(marketPrefix.length));if(categories.includes(p.category)&&['yes','no','unclear','context'].every(k=>typeof p[k]==='string'))return {...p,organisation:'',place:'',criteria:'YES: '+p.yes+'\n\nNO: '+p.no+'\n\nUNCLEAR / REFUND: '+p.unclear+(p.context?'\n\nADDITIONAL CONDITIONS: '+p.context:'')};}catch{}}
 if(rules.startsWith(prefix)){const split=rules.indexOf('\n\n',prefix.length);try{const p=JSON.parse(rules.slice(prefix.length,split));if([...categories,...legacyCategories].includes(p.category)&&typeof p.organisation==='string'&&typeof p.place==='string')return {...p,criteria:rules.slice(split+2)};}catch{}}
 return {category:'Other',organisation:'',place:'',criteria:rules};
}
export function displayCategory(m){const c=parsePromise(m.rules).category;return c==='Crypto projects'?'Crypto':categories.includes(c)?c:'Everyday life';}
export function filterMarkets(markets,{category='All',query='',state='all',sort='newest'}={}){
 const q=query.trim().toLowerCase(),now=Date.now()/1000;
 const rows=markets.filter(m=>(category==='All'||displayCategory(m)===category)&&(!q||(m.question+' '+parsePromise(m.rules).criteria+' '+m.creator).toLowerCase().includes(q))&&(state==='all'||(state==='open'?Number(m.outcome)===0&&now<Number(m.close):Number(m.outcome)!==0&&now>=Number(m.claim_at))));
 return rows.sort((a,b)=>sort==='pooled'?Number(b.yes)+Number(b.no)-Number(a.yes)-Number(a.no):sort==='closing'?Number(a.close)-Number(b.close):b.id-a.id);
}
export function promiseRecord(m,contract,resolver){return {format:'onrecord-market-receipt-v2',network:'Stellar Testnet',contract,marketId:m.id,feeBps:Number(m.feeBps||0),feeBasis:'positive-net-profit',issuerFeeBps:Number(m.issuerFeeBps||0),resolverFeeBps:Number(m.resolverFeeBps??m.feeBps??0),issuerFeeRecipient:m.creator,feeRecipient:resolver,issuer:m.creator,resolver,question:m.question,...parsePromise(m.rules),source:m.source,predictionsClose:new Date(Number(m.close)*1000).toISOString(),outcomeDeadline:new Date(Number(m.deadline)*1000).toISOString(),outcome:['Pending','Yes','No','Unclear'][Number(m.outcome)],evidence:m.evidence,reason:m.reason,claimsAvailable:Number(m.claim_at)?new Date(Number(m.claim_at)*1000).toISOString():null,scope:'Current onchain record. Source URLs are references, not archived snapshots. Human resolution; not independent verification.'};}
