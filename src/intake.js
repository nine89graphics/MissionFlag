import { STYLES,projectFundraiser,requireMoney } from './core.js';

const ORG_TYPES=new Set(['school','pta-pto','booster','league','team','cheer-dance',
  'band','club','community','church','other']);
const allowedCounts=['schools','students','teams','players','households','alumni',
  'staff','previousBuyers','socialReach','emailReach','adultHelpers'];
const str=(v,max=160)=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=max;
const optCount=(value,label)=>{
  if(value===undefined||value===null||value==='')return null;
  if(!Number.isSafeInteger(value)||value<0||value>10000000)
    throw new Error(label+' must be a nonnegative whole-number estimate');
  return value;
};
const color=(v)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
export function validateFundraiserIntake(payload){
  if(!payload||typeof payload!=='object'||Array.isArray(payload))
    throw new Error('Missing fundraiser intake');
  const {organizationName,organizationType,city,state,contactName,contactEmail,
    primaryColor,secondaryColor,logoAssetKey,logoHelpRequested,artworkAuthorized,
    adultAuthorityConfirmed,styleChoices=[],durationDays=7,goalCents=null}=payload;
  if(!str(organizationName)||!ORG_TYPES.has(organizationType)||
    !str(city)||!str(state,2)||!/^[A-Z]{2}$/.test(state)||
    !str(contactName)||!str(contactEmail,254)||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
    throw new Error('Required organization/contact information is incomplete');
  if(!color(primaryColor)||!color(secondaryColor))
    throw new Error('School colors must be HEX values');
  if(!str(logoAssetKey)&&logoHelpRequested!==true)
    throw new Error('Logo upload or artwork assistance is required');
  if(adultAuthorityConfirmed!==true)
    throw new Error('An authorized adult must submit the fundraiser');
  if(typeof artworkAuthorized!=='boolean')
    throw new Error('Artwork authorization status is required');
  if(!Array.isArray(styleChoices)||styleChoices.length===0||
    new Set(styleChoices).size!==styleChoices.length||
    !styleChoices.every(x=>Number.isSafeInteger(x)&&x>=1&&x<=STYLES.length))
    throw new Error('Select one or more of the twelve signature styles');
  if(![7,14].includes(durationDays)) throw new Error('Fundraisers run for 7 or 14 days');
  if(goalCents!==null)requireMoney(goalCents,'goalCents');
  const counts={};
  for(const field of allowedCounts) counts[field]=optCount(payload[field],field);
  // No roster, student names, birthdates, grades or children's contact details.
  const forbidden=['studentNames','athleteNames','roster','birthdates','grades',
    'studentEmails','studentPhones','childContacts'];
  if(forbidden.some(field=>Object.hasOwn(payload,field)))
    throw new Error('Individual student information is not collected');
  const reachableHouseholds=optCount(payload.uniqueReachableHouseholds,'uniqueReachableHouseholds');
  return Object.freeze({
    organizationName:organizationName.trim(),organizationType,city:city.trim(),state,
    contactName:contactName.trim(),contactEmail:contactEmail.trim().toLowerCase(),
    primaryColor:primaryColor.toUpperCase(),secondaryColor:secondaryColor.toUpperCase(),
    logoAssetKey:str(logoAssetKey)?logoAssetKey:null,
    logoHelpRequested:logoHelpRequested===true,artworkAuthorized,
    adultAuthorityConfirmed:true,styleChoices:[...styleChoices],durationDays,goalCents,
    counts,uniqueReachableHouseholds:reachableHouseholds,
    overlapWarning:reachableHouseholds===null&&
      (counts.students!==null||counts.players!==null||counts.socialReach!==null)
  });
}

/** Makes assumptions explicit. Never sums overlapping team/student/follower counts. */
export function previewEarningsScenarios(intake,{
  earningsPerFlagCents,unitsPerBuyer=1,
  conversionRates={low:0.02,base:0.05,high:0.10}
}){
  const households=intake?.uniqueReachableHouseholds;
  if(households===null||households===undefined)
    throw new Error('Unique reachable households are required for a projection');
  const projections={};
  for(const [scenario,rate] of Object.entries(conversionRates))
    projections[scenario]=projectFundraiser({uniqueHouseholds:households,
      conversionRate:rate,unitsPerBuyer,earningsPerFlagCents});
  return {uniqueHouseholds:households,projections,disclaimer:
    'Illustrative estimates based on assumed conversion and verified group earnings. Not a guaranteed result.'};
}
