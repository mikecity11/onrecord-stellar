export const categories=['Infrastructure','Electricity','Education','Public services','Crypto projects','Other'];
export const templates={
 Infrastructure:{question:'Will [road / bridge] reopen to public traffic by [date]?',rules:'Yes only if the named road or bridge is open to ordinary public traffic by the outcome deadline. An announcement or opening ceremony alone does not qualify. Require a dated operational notice from the responsible authority and corroborating reporting. No if reliable evidence shows it remained closed at the deadline. Unclear if reliable evidence is insufficient or conflicting.'},
 Electricity:{question:'Will [utility] restore electricity to [named area] by [date]?',rules:'Define the exact area and required duration of restored supply before publishing. Yes requires a dated utility notice and corroborating evidence that supply was restored for that duration before the deadline. A repair announcement alone does not qualify. No requires reliable evidence the stated threshold was not met. Unclear if coverage or duration cannot be established.'},
 Education:{question:'Will [university] publish [admission results] by [date]?',rules:'Yes only if the named results are accessible on the official university admissions portal by the deadline. A promise to publish or an unofficial list does not qualify. Record the official publication timestamp and accessible portal evidence. No if reliable official evidence shows publication occurred after the deadline or had not occurred. Unclear if timing cannot be established.'},
 'Public services':{question:'Will [clinic] begin accepting patients in [location] by [date]?',rules:'Yes only if the named clinic begins accepting ordinary patients for the specified service by the deadline. An inauguration ceremony alone does not qualify. Require a dated operational notice from the responsible health authority and corroborating reporting. No requires reliable evidence the service had not begun by the deadline. Unclear if reliable evidence is insufficient or conflicting.'},
 'Crypto projects':{question:'Will [project] launch [specified product] by [date]?',rules:'Define the product, access requirements and working functionality. Yes requires an official release and evidence that the defined product is usable by the deadline. A teaser or roadmap update alone does not qualify. No requires reliable evidence the criteria were not met. Unclear if the evidence is insufficient or conflicting.'}
};
const prefix='ONRECORD-PROMISE-V1\n';
export function encodePromise({category,organisation,place,criteria}){
 if(!categories.includes(category))throw Error('Select a promise category.');
 const rules=prefix+JSON.stringify({category,organisation:organisation.trim(),place:place.trim()})+'\n\n'+criteria.trim();
 if(rules.length>2000)throw Error('The promise details and criteria must fit within 2,000 characters.');
 if(/\[[^\]]+\]/.test(criteria))throw Error('Replace template placeholders with specific details.');
 return rules;
}
export function parsePromise(rules){
 if(rules.startsWith(prefix)){const split=rules.indexOf('\n\n',prefix.length);try{const p=JSON.parse(rules.slice(prefix.length,split));if(categories.includes(p.category)&&typeof p.organisation==='string'&&typeof p.place==='string')return {...p,criteria:rules.slice(split+2)};}catch{}}
 return {category:'Other',organisation:'Not specified',place:'Not specified',criteria:rules};
}
export function promiseRecord(m,contract,resolver){return {format:'onrecord-promise-receipt-v1',network:'Stellar Testnet',contract,marketId:m.id,resolver,question:m.question,...parsePromise(m.rules),source:m.source,predictionsClose:new Date(Number(m.close)*1000).toISOString(),outcomeDeadline:new Date(Number(m.deadline)*1000).toISOString(),outcome:['Pending','Yes','No','Unclear'][Number(m.outcome)],evidence:m.evidence,reason:m.reason,claimsAvailable:Number(m.claim_at)?new Date(Number(m.claim_at)*1000).toISOString():null,scope:'Current onchain record. Source URLs are references, not archived webpage snapshots. Human resolution; not independent verification.'};}
