import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFundraiserIntake,previewEarningsScenarios} from '../src/intake.js';
const valid={organizationName:'Wildcats Booster Club',organizationType:'booster',
  city:'Saginaw',state:'MI',contactName:'Adult Organizer',
  contactEmail:'coach@example.org',primaryColor:'#112233',secondaryColor:'#AABBCC',
  logoHelpRequested:true,artworkAuthorized:false,adultAuthorityConfirmed:true,
  styleChoices:[1,4,12],durationDays:7,schools:1,students:350,players:68};
test('progressive form accepts unknown household counts and warns against overlapping reach',()=>{
  const intake=validateFundraiserIntake(valid);
  assert.equal(intake.overlapWarning,true);
  assert.equal(intake.counts.players,68);
  assert.equal(intake.uniqueReachableHouseholds,null);
});
test('intake accepts 14-day programs, 12 signature styles, and adult authorized artwork',()=>{
  const intake=validateFundraiserIntake({...valid,logoAssetKey:'assets/logo.png',
    logoHelpRequested:false,artworkAuthorized:true,durationDays:14,
    styleChoices:Array.from({length:12},(_,i)=>i+1)});
  assert.equal(intake.styleChoices.length,12);
  assert.equal(intake.durationDays,14);
});
test('intake rejects roster, invalid colors and unauthorized submission',()=>{
  assert.throws(()=>validateFundraiserIntake({...valid,studentNames:['student']}),/not collected/);
  assert.throws(()=>validateFundraiserIntake({...valid,primaryColor:'orange'}),/HEX/);
  assert.throws(()=>validateFundraiserIntake({...valid,adultAuthorityConfirmed:false}),/adult/);
  assert.throws(()=>validateFundraiserIntake({...valid,styleChoices:[1,1]}),/Select/);
});
test('earnings projection derives from unique reachable households only',()=>{
  const intake=validateFundraiserIntake({...valid,uniqueReachableHouseholds:500,
    students:2000,players:2500});
  const estimate=previewEarningsScenarios(intake,{earningsPerFlagCents:500});
  assert.equal(estimate.projections.base.buyers,25);
  assert.equal(estimate.projections.base.estimatedGroupEarningsCents,12500);
  assert.match(estimate.disclaimer,/Not a guaranteed/);
  assert.throws(()=>previewEarningsScenarios(validateFundraiserIntake(valid),{earningsPerFlagCents:500}),/households/);
});
