import './env.mjs';
export const PROJECTS_SOURCE=process.env.NOTION_PROJECTS_SOURCE||'';
export const TASKS_SOURCE=process.env.NOTION_TASKS_SOURCE||'';
export const TEMPLATE_ID=process.env.NOTION_PROJECT_TEMPLATE||'';
export const LAYOUT_VERSION=2;
export const rt=text=>{const s=String(text??'');return (s.match(/[\s\S]{1,1800}/g)||['']).map(content=>({type:'text',text:{content}}));};
export const block=(type,text)=>({object:'block',type,[type]:{rich_text:rt(text)}});
export const callout=text=>({object:'block',type:'callout',callout:{rich_text:rt(text),icon:{type:'emoji',emoji:'📌'}}});
export function table(headers,rows){return {object:'block',type:'table',table:{table_width:headers.length,has_column_header:true,has_row_header:false,children:[headers,...rows].map(row=>({object:'block',type:'table_row',table_row:{cells:row.map(v=>rt(v))}}))}};}
export function markdown(text){return String(text).split(/\n/).filter(s=>s.trim()).map(line=>{const m=line.match(/^(#{1,3})\s+(.*)/);if(m)return block('heading_'+m[1].length,m[2]);const bullet=line.match(/^[-*]\s+(.*)/);if(bullet)return block('bulleted_list_item',bullet[1]);const n=line.match(/^\d+[.)]\s+(.*)/);if(n)return block('numbered_list_item',n[1]);return block('paragraph',line);});}
export function docBlocks(p,name){const facts=p.facts.filter(f=>f.section===name),blocks=[callout(`Approved snapshot · Project v${p.version} · ${name}\n승인된 앱 기록 기준. 이전 버전·원문·감사 이력은 보존됩니다.`)];if(name==='Communication Log'){blocks.push(table(['Meeting','Recorded at','Approved items'],p.meetings.map(m=>[m.title,m.createdAt,m.approvedCount])));}
 if(name==='Open Questions'){if(p.questions.length)blocks.push(table(['Question','State','Answer','Evidence'],p.questions.map(q=>[q.title,q.status,q.answer||'확인 필요',q.evidence||'—'])));else blocks.push(block('paragraph','미확인 질문 없음'));}
 for(const f of facts){blocks.push(block('heading_3',f.title),block('paragraph',f.detail),block('quote',f.quote||'원문 인용 없음 — 검토자 확인'),block('paragraph',`Source: ${f.inputTitle||f.inputId||'—'} · ${f.recordStatus||'current'}${f.reviewNote?' · Review: '+f.reviewNote:''}`));}
 if(name==='POC Plan'&&p.poc){blocks.push(block('heading_2',`POC v${p.poc.version} · ${p.poc.status}`),...markdown(p.poc.text));}
 if(name==='Customer Review & Decision Log'){if(p.reviews.length)blocks.push(table(['POC version','Decision','Reviewer','Evidence'],p.reviews.map(r=>[r.pocVersion,r.decision,r.reviewer,r.evidence])));for(const r of p.reviews)blocks.push(block('quote',r.note));}
 if(blocks.length===1)blocks.push(block('paragraph','아직 승인된 내용이 없습니다.'));return blocks;}
export function rootSummary(p){return table(['Project','Meetings','Approved facts','Open questions','POC'],[[p.name,p.meetings.length,p.facts.filter(f=>f.recordStatus!=='superseded').length,p.questions.filter(q=>q.status==='open').length,p.poc?.status||'Not drafted']]);}
export function taskBody(p,q){return {parent:{type:'data_source_id',data_source_id:TASKS_SOURCE},properties:{'Task name':{title:rt('Confirm · '+q.title)},Project:{relation:[{id:p.notion.id}]},Status:{status:{name:q.status==='resolved'?'Done':'Not Started'}}},children:[callout('승인된 확인 질문에서 생성한 작업입니다. 담당자·마감일은 임의 배정하지 않았습니다.'),block('paragraph',q.detail),block('quote',q.quote||'원문에 명시되지 않은 확인 질문'),block('paragraph',`Fieldwork question: ${q.id}\n근거: ${q.evidence||'확인 필요'}`)]};}
