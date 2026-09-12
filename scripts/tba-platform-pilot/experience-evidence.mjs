import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseByRules, LEXICON_VERSION, RULE_VERSION } from './rules.mjs';
import { parseByRules as parseByRulesV3, LEXICON_VERSION as LEXICON_VERSION_V3, RULE_VERSION as RULE_VERSION_V3 } from './rules-v3.mjs';
import { parseByRules as parseByRulesV4, LEXICON_VERSION as LEXICON_VERSION_V4, RULE_VERSION as RULE_VERSION_V4 } from './rules-v4.mjs';
import { resolveWithAI, rawAnswerHash, atomKey, validateStoredAIArtifact, purgeAICache } from './ai-extraction.mjs';

export const FIXTURE_TIME = '2026-09-06T12:00:00.000Z';
const stable = value => JSON.stringify(value, (_, v) => v && !Array.isArray(v) && typeof v === 'object' ? Object.fromEntries(Object.entries(v).sort(([a],[b]) => a.localeCompare(b))) : v);
export const hash = value => createHash('sha256').update(stable(value)).digest('hex');
const fail = code => { throw new Error(code); };
export function ruleResultFor(answer, source={}, {evidenceClass='synthetic_fixture',parser=parseByRules}={}) {
  if(!['synthetic_fixture','user_report'].includes(evidenceClass)) fail('INVALID_EVIDENCE_CLASS');
  const parsed=parser(answer,{source});
  return {...parsed,observations:parsed.observations.map(atom=>({...atom,evidenceClass,extractionMethod:'rules',confirmationStatus:answer.question==='free_text'?'rule_extracted_statement':'explicit_user_choice'})),
    unresolved:parsed.unresolved.map(signal=>({...signal,target:answer.target??'unspecified',phase:answer.phase??'unspecified',
      sourceSpans:signal.sourceSpans.map(span=>({...span,...(signal.choiceId?{choiceId:signal.choiceId}:{})})),
      sourceAnswerRefs:[{...source,phrase:signal.phrase,question:answer.question,questionVersion:answer.questionVersion,choiceVersion:answer.choiceVersion}],evidenceClass}))};
}
export function extractAnswer(answer, source={}) { return ruleResultFor(answer,source).observations; }
const ruleParserForVersions=versions=>{
  if(stable(versions)===stable({lexicon:LEXICON_VERSION,rules:RULE_VERSION})||stable(versions)===stable({lexicon:'1',rules:'1'})) return parseByRules;
  if(stable(versions)===stable({lexicon:LEXICON_VERSION_V3,rules:RULE_VERSION_V3})) return parseByRulesV3;
  if(stable(versions)===stable({lexicon:LEXICON_VERSION_V4,rules:RULE_VERSION_V4})) return parseByRulesV4;
  fail('UNKNOWN_RULE_ARTIFACT_VERSION');
};
export function validateStoredRuleArtifact(artifact,{answer,context}) {
  if(artifact.rawHash!==rawAnswerHash(answer)) fail('RULE_ARTIFACT_RAW_MISMATCH');
  for(const field of ['owner','experienceId','answerId','eventId','answerKey']) if(artifact[field]!==context[field]) fail('RULE_ARTIFACT_CONTEXT_MISMATCH');
  const expected=ruleResultFor(answer,{answerId:context.answerId,eventId:context.eventId,answerKey:context.answerKey},{evidenceClass:artifact.evidenceClass??'synthetic_fixture',parser:ruleParserForVersions(artifact.result?.versions)});
  if(stable(expected)!==stable(artifact.result)) fail('RULE_ARTIFACT_MAPPING_MISMATCH');
  return expected;
}
const semanticKey = atomKey;
const rows = async (db, sql, params=[]) => (await db.query(sql,params)).rows;
const confirmationFor = observation => {
  const statuses=observation.sourceAnswerRefs?.map(ref=>ref.confirmationStatus).filter(Boolean)??[];
  if(statuses.includes('explicit_user_choice')) return 'explicit_user_choice';
  if(statuses.includes('rule_extracted_statement')) return 'rule_extracted_statement';
  if(statuses.includes('model_extracted_unconfirmed')) return 'model_extracted_unconfirmed';
  return 'unresolved';
};
const isVerifiedSource = observation => ['explicit_user_choice','rule_extracted_statement'].includes(observation.confirmationStatus);


export async function createExperiencePilot({aiConfig={},aiFetch=globalThis.fetch,dataDir,evidenceClass='synthetic_fixture'}={}) {
  if(!['synthetic_fixture','user_report'].includes(evidenceClass)) fail('INVALID_EVIDENCE_CLASS');
  const aiCache=new Map();
  const db = new PGlite(dataDir);
  try {
    const exists=(await rows(db,"SELECT to_regclass('public.users') AS name"))[0].name;
    if(!exists) await db.transaction(tx=>readFile(new URL('./schema.sql',import.meta.url),'utf8').then(sql=>tx.exec(sql)));
    await db.exec('CREATE TABLE IF NOT EXISTS engine_storage_metadata(key text PRIMARY KEY, value text NOT NULL)');
    await db.exec("ALTER TABLE experiences ADD COLUMN IF NOT EXISTS context jsonb NOT NULL DEFAULT '{}'::jsonb");
    const configured=(await rows(db,"SELECT value FROM engine_storage_metadata WHERE key='evidence_class'"))[0]?.value;
    const incompatible=await rows(db,'SELECT id FROM users WHERE evidence_class <> $1 LIMIT 1',[evidenceClass]);
    if((configured&&configured!==evidenceClass)||incompatible.length) fail('STORAGE_EVIDENCE_CLASS_MISMATCH');
    await db.query("INSERT INTO engine_storage_metadata VALUES('evidence_class',$1) ON CONFLICT DO NOTHING",[evidenceClass]);
  } catch(error) {await db.close();throw error;}
  async function owned(tx, owner, id) {
    const e = (await rows(tx,'SELECT * FROM experiences WHERE id=$1',[id]))[0];
    if (!e) {
      const dead = (await rows(tx,'SELECT owner FROM tombstones WHERE experience_id=$1',[id]))[0];
      if (dead && dead.owner !== owner) fail('OWNER_MISMATCH');
      fail(dead ? 'EXPERIENCE_DELETED' : 'EXPERIENCE_NOT_FOUND');
    }
    if (e.owner !== owner) fail('OWNER_MISMATCH');
    return e;
  }
  async function derive(tx,e) {
    await tx.query('DELETE FROM interpretations WHERE experience_id=$1',[e.id]);
    const obs = await rows(tx,'SELECT id,payload FROM observations WHERE experience_id=$1 AND active ORDER BY id',[e.id]);
    const items = obs.map(x=>({...x.payload,id:x.id,confirmationStatus:confirmationFor(x.payload)}));
    const interpretation = [];
    for (const o of items) {
      const modelOnly=o.confirmationStatus==='model_extracted_unconfirmed';
      const unclassifiedDetail=o.kind==='sensory_detail'&&o.attribute?.endsWith('.unspecified');
      const text = modelOnly ? `사용자 확인 전 원문 해석 후보: “${o.phrase}” (${o.kind}=${String(o.value)}).` : unclassifiedDetail ? `감각 영역만 확인된 원문 “${o.phrase}”의 구체적인 뜻은 미확정입니다.` : o.kind === 'sensory_detail' ? `이번 음식에서 표현한 감각의 세부 원문: “${o.value}”.` : o.kind === 'overall_liking' ? `이번 음식 전체 평가: ${o.phrase}.` : o.kind === 'attribute_liking' ? `이번 음식의 ${o.attribute} 직접 평가: ${o.phrase}.` : o.kind === 'unresolved' ? `“${o.phrase}”의 구체적인 뜻은 미확정입니다.` : `이번 음식에서 “${o.phrase}”을 보고했습니다 (${o.kind}).`;
      interpretation.push({status:modelOnly||unclassifiedDetail?'candidate':'scoped_fact',confirmationStatus:o.confirmationStatus,text,scope:{experienceId:e.id,target:o.target,phase:o.phase},observationRefs:[o.id]});
    }
    const negative = items.find(o=>o.kind==='overall_liking'&&o.value==='negative');
    const umami = items.find(o=>o.kind==='sensory_presence'&&o.attribute==='taste.umami');
    if (negative && umami) {
      const direct = items.filter(o=>o.kind==='attribute_liking'&&o.attribute==='taste.umami'&&o.target===umami.target&&o.phase===umami.phase);
      const verifiedDirect=direct.filter(isVerifiedSource);
      const counter=verifiedDirect.filter(o=>o.value==='positive');
      const sourceItems=[negative,umami,...direct];
      const modelCandidates=sourceItems.filter(o=>o.confirmationStatus==='model_extracted_unconfirmed');
      interpretation.push({status:counter.length?'contested':'candidate',claim:'감칠맛 회피 가능성 확인 후보',
        confirmationStatus:confirmationFor({sourceAnswerRefs:sourceItems.flatMap(o=>o.sourceAnswerRefs)}),
        text:counter.length?'음식 전체의 아쉬움과 감칠맛 직접 긍정이 함께 있어 감칠맛 회피를 단정할 수 없습니다.':modelCandidates.length?'감칠맛 관련 원문 해석에 사용자 확인 전 후보가 남아 있습니다. 미확인 모델 추출을 감칠맛 회피의 직접 지지로 쓰지 않습니다.':'전체 아쉬움과 감칠맛 보고만으로 감칠맛 회피를 지지할 수 없습니다.',
        scope:{experienceId:e.id,target:umami.target,phase:umami.phase},directSupportRefs:verifiedDirect.filter(o=>o.value==='negative').map(o=>o.id),cooccurrenceRefs:[],counterRefs:counter.map(o=>o.id),
        modelCandidateRefs:modelCandidates.map(o=>o.id),contextRefs:[negative.id,umami.id],contextEvidence:[negative,umami].map(o=>({observationId:o.id,confirmationStatus:o.confirmationStatus})),observationRefs:sourceItems.map(o=>o.id),allowedUses:['internal_review','optional_confirmation'],unresolvedFactors:['전체 평가의 이유','다른 음식 및 식사의 반복 근거',...(modelCandidates.length?['모델 추출의 사용자 확인']:[])],probability:null});
    }
    for (let i=0;i<interpretation.length;i++) {
      const p=interpretation[i], id=`${e.id}:interpretation:${i}`;
      await tx.query('INSERT INTO interpretations VALUES($1,$2,$3,$4,$5,$6)',[id,e.id,e.owner,e.revision,p.status,p]);
      for(const ref of p.observationRefs) await tx.query('INSERT INTO interpretation_dependencies VALUES($1,$2,$3,$4)',[id,ref,e.id,e.owner]);
    }
    return interpretation;
  }
  async function storeRules(tx,answerRow) {
    const context={owner:answerRow.owner,experienceId:answerRow.experience_id,answerId:answerRow.id,eventId:answerRow.event_id,answerKey:answerRow.answer_key};
    const result=ruleResultFor(answerRow.payload,{answerId:answerRow.id,eventId:answerRow.event_id,answerKey:answerRow.answer_key},{evidenceClass});
    const payload={origin:'rules',...context,...(evidenceClass==='user_report'?{evidenceClass}:{}),rawHash:rawAnswerHash(answerRow.payload),result};
    await tx.query('INSERT INTO extraction_artifacts VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[`${answerRow.id}:rules`,answerRow.experience_id,answerRow.owner,answerRow.id,'rules','rules_ready',null,payload,answerRow.recorded_at]);
  }
  async function rebuild(tx,e) {
    await tx.query('UPDATE observations SET active=false WHERE experience_id=$1 AND active',[e.id]);
    await tx.query('UPDATE unresolved_signals SET active=false WHERE experience_id=$1 AND active',[e.id]);
    const generation=(await rows(tx,'SELECT (SELECT count(*) FROM observations WHERE experience_id=$1)+(SELECT count(*) FROM unresolved_signals WHERE experience_id=$1) AS n',[e.id]))[0].n;
    const answers=await rows(tx,'SELECT * FROM answers WHERE experience_id=$1 AND active ORDER BY answer_key',[e.id]);
    const atoms=new Map(),signals=[];
    for(const answer of answers) {
      const allArtifacts=await rows(tx,'SELECT * FROM extraction_artifacts WHERE answer_id=$1 ORDER BY recorded_at DESC,id DESC',[answer.id]);
      const rulesArtifact=allArtifacts.find(a=>a.origin==='rules');
      const selectedAI=allArtifacts.find(a=>a.origin==='ai'&&['resolved','partially_resolved'].includes(a.status))??allArtifacts.find(a=>a.origin==='ai');
      const artifacts=[rulesArtifact,...(selectedAI?[selectedAI]:[])];
      if(!rulesArtifact) fail('MISSING_RULE_ARTIFACT');
      const context={owner:e.owner,experienceId:e.id,answerId:answer.id,eventId:answer.event_id,answerKey:answer.answer_key,rawHash:rawAnswerHash(answer.payload)};
      const ruleResult=validateStoredRuleArtifact(rulesArtifact.payload,{answer:answer.payload,context});
      for(const artifact of artifacts) {
        const extracted=artifact.origin==='rules'?ruleResult:validateStoredAIArtifact(artifact.payload,{answer:answer.payload,ruleResult,context});
        const knownAt=new Date(Math.max(new Date(answer.recorded_at).getTime(),new Date(artifact.recorded_at).getTime())).toISOString();
        for(const sourceAtom of extracted.observations) {
          const refs=sourceAtom.sourceAnswerRefs.map(ref=>({...ref,artifactId:artifact.id,sourceSpans:sourceAtom.sourceSpans,recordedAt:knownAt,extractionMethod:artifact.origin,confirmationStatus:sourceAtom.confirmationStatus}));
          const atom={...sourceAtom,evidenceClass,sourceAnswerRefs:refs};
          const key=semanticKey(atom);
          if(atoms.has(key)) {
            const existing=atoms.get(key);
            existing.atom.sourceAnswerRefs.push(...refs);
            if(knownAt<existing.recordedAt) existing.recordedAt=knownAt;
          } else atoms.set(key,{atom,answer,recordedAt:knownAt});
        }
        for(const signal of extracted.unresolved) signals.push({signal:{...signal,target:signal.target??answer.payload.target??'unspecified',phase:signal.phase??answer.payload.phase??'unspecified',evidenceClass,sourceAnswerRefs:[{answerId:answer.id,eventId:answer.event_id,answerKey:answer.answer_key,artifactId:artifact.id,phrase:signal.phrase,question:answer.question,questionVersion:answer.payload.questionVersion,choiceVersion:answer.payload.choiceVersion,sourceSpans:signal.sourceSpans,recordedAt:knownAt}]},answer,artifact});
      }
    }
    let index=0;
    for(const [key,{atom,answer,recordedAt}] of atoms) {
      const id=`${e.id}:r${e.revision}:g${generation}:o${index++}`;
      atom.sourceAnswerRefs=[...new Map(atom.sourceAnswerRefs.map(ref=>[stable(ref),ref])).values()];
      await tx.query('INSERT INTO observations VALUES($1,$2,$3,$4,$5,$6,true,$7)',[id,e.id,e.owner,answer.id,key,atom,recordedAt]);
      for(const ref of atom.sourceAnswerRefs) await tx.query('INSERT INTO observation_sources VALUES($1,$2,$3,$4,$5,$6)',[id,ref.answerId,e.id,e.owner,ref.artifactId,ref]);
    }
    let unresolvedIndex=0;
    for(const {signal,answer,artifact} of signals) await tx.query('INSERT INTO unresolved_signals VALUES($1,$2,$3,$4,$5,$6,true)',[`${e.id}:r${e.revision}:g${generation}:u${unresolvedIndex++}`,e.id,e.owner,answer.id,artifact.id,signal]);
    await derive(tx,e);
  }
  async function sourceAnswers(owner,reader=db) {
    const answers=await rows(reader,'SELECT * FROM answers WHERE owner=$1 AND active ORDER BY id',[owner]);
    const artifacts=await rows(reader,'SELECT * FROM extraction_artifacts WHERE owner=$1 ORDER BY id',[owner]);
    return new Map(answers.map(a=>[a.id,{answerId:a.id,eventId:a.event_id,owner:a.owner,experienceId:a.experience_id,answerKey:a.answer_key,originalAnswer:a.payload,rawHash:rawAnswerHash(a.payload),recordedAt:a.recorded_at,artifacts:artifacts.filter(artifact=>artifact.answer_id===a.id)}]));
  }
  return {
    db,
    async importFoods(bundle) {
      await db.transaction(async tx=>{
        for(const s of bundle.sources) {
          const id=s.id ?? s.sourceId;
          if(!id) fail('INVALID_SOURCE');
          await tx.query('INSERT INTO sources VALUES($1,$2)',[id,s]);
        }
        for(const f of bundle.foods) {
          await tx.query('INSERT INTO foods VALUES($1,$2,$3)',[f.id,f.name,f]);
          for(const c of f.claims) {
            if(!c.sourceRefs?.length) fail('MISSING_PROVENANCE');
            await tx.query('INSERT INTO food_claims VALUES($1,$2,$3)',[`${f.id}:${c.id}`,f.id,c]);
            for(const ref of c.sourceRefs) {
              if(!ref.sourceId || !ref.recordHash || !ref.recordPointer || !ref.pointer || !ref.field || typeof ref.quote!=='string') fail('INVALID_PROVENANCE');
              await tx.query('INSERT INTO claim_sources VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[`${f.id}:${c.id}`,ref.sourceId,ref]);
            }
          }
        }
      });
    },
    async createUser(id) {
      if(typeof id!=='string'||!id.trim()) fail('INVALID_USER');
      await db.query('INSERT INTO users VALUES($1,$2)',[id,evidenceClass]);
    },
    async createExperience({owner,id,mealId,foodId,observedAt=null,dishKindIDs=[],restaurantID=null,menuItemID=null}) {
      if(observedAt!==null&&!Number.isFinite(Date.parse(observedAt)))fail('INVALID_OBSERVED_AT');
      if(!Array.isArray(dishKindIDs)||dishKindIDs.some(id=>typeof id!=='string')||[restaurantID,menuItemID].some(id=>id!==null&&typeof id!=='string'))fail('INVALID_EXPERIENCE_CONTEXT');
      const context={observedAt:observedAt===null?null:new Date(observedAt).toISOString(),dishKindIDs:[...new Set(dishKindIDs)].sort(),restaurantID,menuItemID};
      return db.transaction(async tx=>{
        if((await rows(tx,'SELECT 1 FROM tombstones WHERE experience_id=$1',[id])).length) fail('EXPERIENCE_DELETED');
        await tx.query('INSERT INTO meals VALUES($1,$2) ON CONFLICT DO NOTHING',[mealId,owner]);
        await tx.query('INSERT INTO experiences(id,owner,meal_id,food_id,context) VALUES($1,$2,$3,$4,$5)',[id,owner,mealId,foodId,context]);
      });
    },
    async mutate(owner,event) {
      const result=await db.transaction(async tx=>{
        if(!event.mutationId || !Number.isInteger(event.baseRevision) || event.baseRevision<0) fail('INVALID_EVENT');
        const payloadHash=hash(event);
        const receipt=(await rows(tx,'SELECT * FROM receipts WHERE owner=$1 AND mutation_id=$2',[owner,event.mutationId]))[0];
        if(receipt) {
          if(receipt.payload_hash!==payloadHash) fail('MUTATION_PAYLOAD_CONFLICT');
          return {revision:receipt.revision,mutationId:event.mutationId};
        }
        const e=await owned(tx,owner,event.experienceId);
        if(e.revision!==event.baseRevision) fail('REVISION_CONFLICT');
        if(!['set','remove','clear','delete'].includes(event.operation)) fail('INVALID_OPERATION');
        if(!Number.isFinite(Date.parse(event.recordedAt))) fail('INVALID_TIME');
        const next=e.revision+1;
        if(event.operation==='delete') {
          await tx.query('INSERT INTO tombstones VALUES($1,$2,$3)',[e.id,owner,next]);
          await tx.query('DELETE FROM experiences WHERE id=$1',[e.id]);
        } else {
          if(event.operation==='set') ruleResultFor(event.answer,{answerId:'validation',eventId:'validation'});
          else if(!event.answerKey && !['overall','sensory','structured_sensory','structured_overall','attribute_liking','free_text'].includes(event.question)) fail('UNKNOWN_QUESTION');
          const question=event.operation==='set'?event.answer.question:event.question;
          const answerKey=event.answerKey??event.answer?.answerKey??question;
          if(typeof answerKey!=='string'||!answerKey.trim()||answerKey.length>200) fail('INVALID_ANSWER_KEY');
          const eventId=`${owner}:${event.mutationId}`;
          await tx.query('INSERT INTO input_events VALUES($1,$2,$3,$4,$5,$6)',[eventId,e.id,owner,next,event,event.recordedAt]);
          const previous=(await rows(tx,'SELECT * FROM answers WHERE experience_id=$1 AND answer_key=$2 AND active',[e.id,answerKey]))[0];
          const canonicalAnswer=answer=>stable({...answer,value:['sensory','structured_sensory'].includes(answer.question)?[...new Map(answer.value.map(choice=>[stable(choice),choice])).entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([,choice])=>choice):answer.value});
          const unchanged=event.operation==='set'&&previous&&canonicalAnswer(previous.payload)===canonicalAnswer(event.answer);
          if(!unchanged) {
            await tx.query('UPDATE answers SET active=false WHERE experience_id=$1 AND answer_key=$2 AND active',[e.id,answerKey]);
            if(event.operation==='set') {
              const answerRow={id:`${eventId}:answer`,experience_id:e.id,owner,question,answer_key:answerKey,event_id:eventId,payload:event.answer,recorded_at:event.recordedAt};
              await tx.query('INSERT INTO answers VALUES($1,$2,$3,$4,$5,$6,$7,true,$8)',[answerRow.id,e.id,owner,question,answerKey,eventId,event.answer,event.recordedAt]);
              await storeRules(tx,answerRow);
            }
          }
          await tx.query('UPDATE experiences SET revision=$1 WHERE id=$2',[next,e.id]);
          if(unchanged) await derive(tx,{...e,revision:next}); else await rebuild(tx,{...e,revision:next});
        }
        await tx.query('INSERT INTO receipts VALUES($1,$2,$3,$4,$5)',[owner,event.mutationId,e.id,payloadHash,next]);
        return {revision:next,mutationId:event.mutationId};
      });
      if(event.operation==='delete') purgeAICache(aiCache,{owner,experienceId:event.experienceId});
      return result;
    },
    async processAnswerAI(owner,{experienceId,answerKey,baseRevision},{fetchImpl=aiFetch,config={},recordedAt=new Date().toISOString()}={}) {
      const captured=await db.transaction(async tx=>{
        const e=await owned(tx,owner,experienceId);
        if(e.revision!==baseRevision) fail('STALE_ANALYSIS');
        const answer=(await rows(tx,'SELECT * FROM answers WHERE experience_id=$1 AND answer_key=$2 AND active',[experienceId,answerKey]))[0];
        if(!answer) fail('ANSWER_NOT_FOUND');
        const artifact=(await rows(tx,"SELECT * FROM extraction_artifacts WHERE answer_id=$1 AND origin='rules'",[answer.id]))[0];
        const context={owner,experienceId,answerKey,answerId:answer.id,eventId:answer.event_id,revision:e.revision,rawHash:rawAnswerHash(answer.payload),...(evidenceClass==='user_report'?{evidenceClass}:{})};
        return {answer,context,ruleResult:validateStoredRuleArtifact(artifact.payload,{answer:answer.payload,context})};
      });
      // 원문 트랜잭션은 끝났다. 네트워크 대기 중에도 수정과 삭제가 가능하다.
      const result=await resolveWithAI({answer:captured.answer.payload,ruleResult:captured.ruleResult,context:captured.context,fetchImpl,cache:aiCache,config:{...aiConfig,...config}});
      if(result.status==='skipped_rule_complete') return {...result,applied:false};
      if(!Number.isFinite(Date.parse(recordedAt))) fail('INVALID_TIME');
      try { await db.transaction(async tx=>{
        const e=await owned(tx,owner,experienceId);
        if(e.revision!==captured.context.revision) fail('STALE_ANALYSIS');
        const answer=(await rows(tx,'SELECT * FROM answers WHERE experience_id=$1 AND answer_key=$2 AND active',[experienceId,answerKey]))[0];
        if(!answer||answer.id!==captured.answer.id||rawAnswerHash(answer.payload)!==captured.context.rawHash) fail('STALE_ANSWER_ANALYSIS');
        validateStoredAIArtifact(result.artifact,{answer:answer.payload,ruleResult:captured.ruleResult,context:captured.context});
        const artifactId=`${answer.id}:ai:${result.artifact.requestKey}`;
        const previous=(await rows(tx,'SELECT payload FROM extraction_artifacts WHERE id=$1',[artifactId]))[0];
        if(previous&&stable(previous.payload.response)===stable(result.artifact.response)&&previous.payload.status===result.artifact.status) return;
        await tx.query('INSERT INTO extraction_artifacts VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(id) DO UPDATE SET status=EXCLUDED.status,payload=EXCLUDED.payload,recorded_at=EXCLUDED.recorded_at',[artifactId,experienceId,owner,answer.id,'ai',result.status,result.artifact.requestKey,result.artifact,recordedAt]);
        await rebuild(tx,e);
      }); } catch(error) {purgeAICache(aiCache,{owner,experienceId});throw error;}
      return {...result,applied:true};
    },
    async applyAnalysis(owner,id,baseRevision) {
      return db.transaction(async tx=>{
        const e=await owned(tx,owner,id);
        if(e.revision!==baseRevision) fail('STALE_ANALYSIS');
        return derive(tx,e);
      });
    },
    async currentState(owner) {
      const observations=await rows(db,'SELECT o.id,o.experience_id,o.payload,o.recorded_at FROM observations o WHERE owner=$1 AND active ORDER BY o.id',[owner]);
      const interpretations=await rows(db,'SELECT id,experience_id,revision,status,payload FROM interpretations WHERE owner=$1 ORDER BY id',[owner]);
      const coverage=(await rows(db,'SELECT count(DISTINCT o.experience_id)::int AS experiences,count(DISTINCT e.meal_id)::int AS meals,count(*)::int AS observations FROM observations o JOIN experiences e ON e.id=o.experience_id WHERE o.owner=$1 AND o.active',[owner]))[0];
      return {evidenceClass,coverage,observations,interpretations,independentSampleCount:null};
    },
    async currentEvidenceRows(owner,reader=db) {
      const sources=await sourceAnswers(owner,reader);
      const result=await rows(reader,`SELECT o.id,o.owner,o.experience_id,o.answer_id,o.payload,o.active,o.recorded_at,
        e.meal_id,e.food_id,e.context AS experience_context,f.name AS food_name,a.event_id,a.payload AS original_answer
        FROM observations o JOIN experiences e ON e.id=o.experience_id AND e.owner=o.owner JOIN foods f ON f.id=e.food_id
        JOIN answers a ON a.id=o.answer_id AND a.experience_id=o.experience_id AND a.owner=o.owner
        WHERE o.owner=$1 AND o.active AND a.active ORDER BY o.id`,[owner]);
      return result.map(row=>({...row,evidence_class:evidenceClass,source_answers:[...new Set(row.payload.sourceAnswerRefs.map(ref=>ref.answerId))].map(id=>sources.get(id))}));
    },
    async currentUnresolvedRows(owner,reader=db) {
      const sources=await sourceAnswers(owner,reader);
      const result=await rows(reader,`SELECT u.id,u.owner,u.experience_id,u.answer_id,u.payload,u.active,e.meal_id,e.food_id,e.context AS experience_context,f.name AS food_name,a.event_id,a.payload AS original_answer,a.recorded_at
        FROM unresolved_signals u JOIN experiences e ON e.id=u.experience_id AND e.owner=u.owner JOIN foods f ON f.id=e.food_id
        JOIN answers a ON a.id=u.answer_id AND a.experience_id=u.experience_id AND a.owner=u.owner
        WHERE u.owner=$1 AND u.active AND a.active ORDER BY u.id`,[owner]);
      return result.map(row=>({...row,evidence_class:evidenceClass,source_answers:[sources.get(row.answer_id)]}));
    },
    async currentEvidenceSnapshot(owner) {
      return db.transaction(async tx=>{
        if(!(await rows(tx,'SELECT 1 FROM users WHERE id=$1',[owner])).length) fail('USER_NOT_FOUND');
        return {userId:owner,evidenceClass,rows:await this.currentEvidenceRows(owner,tx),unresolvedRows:await this.currentUnresolvedRows(owner,tx)};
      });
    },
    async currentExtractionArtifacts(owner) {
      return rows(db,`SELECT x.* FROM extraction_artifacts x JOIN answers a ON a.id=x.answer_id WHERE x.owner=$1 AND a.active ORDER BY x.id`,[owner]);
    },
    async featureSnapshot(owner,{asOf,targetExperienceId}) {
      if(!Number.isFinite(Date.parse(asOf))) fail('INVALID_TIME');
      const target=await owned(db,owner,targetExperienceId);
      const evidence=await rows(db,'SELECT o.id,o.experience_id,o.payload,o.recorded_at FROM observations o JOIN experiences e ON e.id=o.experience_id WHERE o.owner=$1 AND o.active AND o.recorded_at <= $2 AND e.meal_id <> $3 ORDER BY o.id',[owner,asOf,target.meal_id]);
      const priorEvidence=evidence.map(row=>({...row,payload:{...row.payload,sourceAnswerRefs:row.payload.sourceAnswerRefs.filter(ref=>new Date(ref.recordedAt??row.recorded_at)<=new Date(asOf))}})).filter(row=>row.payload.sourceAnswerRefs.length);
      return {asOf,targetExperienceId,priorEvidence,policy:'Current valid evidence known at as_of; target meal feedback excluded; not historical replay',chemicalMeasurements:[],sensoryStudyObservations:[],predictiveModel:null};
    },
    close:()=>db.close()
  };
}
export function fixtureAnswer(question,value,extra={}) { return {question,questionVersion:'1',choiceVersion:'1',target:'whole_dish',phase:'after_meal',value,...extra}; }
