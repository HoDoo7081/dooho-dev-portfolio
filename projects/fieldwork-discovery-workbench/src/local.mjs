import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,mkdirSync,chmodSync,renameSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import * as core from './core.mjs';
import {callAI} from './ai.mjs';
import * as audit from './audit.mjs';
import * as library from './library.mjs';
import * as manual from './manual.mjs';
import {syncProject} from './notion-sync.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
try{process.loadEnvFile(path.join(root,'.env.local'));}catch{}
const dataDir=path.resolve(process.env.FIELDWORK_DATA_DIR||path.join(root,'.local-data'));mkdirSync(dataDir,{recursive:true,mode:0o700});chmodSync(dataDir,0o700);
const dbPath=path.join(dataDir,'fieldwork.sqlite');const db=new DatabaseSync(dbPath);chmodSync(dbPath,0o600);db.exec('PRAGMA journal_mode=DELETE; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL)');
const row=db.prepare('SELECT body FROM state WHERE id=1').get();let state=row?JSON.parse(row.body):core.initial();
db.exec(`CREATE TABLE IF NOT EXISTS audit_log (seq INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT NOT NULL); CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit_log BEGIN SELECT RAISE(ABORT,'Audit entries cannot be updated'); END; CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit_log BEGIN SELECT RAISE(ABORT,'Audit entries cannot be deleted'); END;`);
const auditRows=()=>db.prepare('SELECT body FROM audit_log ORDER BY seq').all().map(r=>JSON.parse(r.body));
let persisted=structuredClone(state),auditMeta={action:'legacy.checkpoint',reason:'감사 기능 도입 시점의 상태. 이전 변경 이력을 소급 증명하지 않음.'};
function commit(){const records=auditRows();const entry=audit.record(persisted,state,auditMeta,records.at(-1)?.hash||'GENESIS');state.revision++;db.exec('BEGIN');try{if(entry)db.prepare('INSERT INTO audit_log(body) VALUES(?)').run(JSON.stringify(entry));db.prepare('INSERT INTO state(id,body) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(JSON.stringify(state));db.exec('COMMIT');persisted=structuredClone(state);}catch(e){db.exec('ROLLBACK');state=structuredClone(persisted);throw e;}}
if(!auditRows().length){persisted=core.initial();commit();}
const token=randomBytes(32).toString('hex');const port=Number(process.env.PORT||4317);let queue=Promise.resolve();
let notionToken='';try{notionToken=JSON.parse(readFileSync(path.join(dataDir,'notion-connection.json'),'utf8')).token;}catch{}
const projectsDatabase=process.env.NOTION_PROJECTS_DATABASE||'';
async function notion(method,route,body){const r=await fetch('https://api.notion.com/v1/'+route,{method,headers:{Authorization:'Bearer '+notionToken,'Notion-Version':'2025-09-03','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(r.status===404?'Notion 대상에 접근할 수 없습니다. 새 Fieldwork 워크스페이스의 Projects에 통합을 연결하세요.':`Notion 요청 실패 (${r.status}). 연결 권한을 확인하세요.`);return r.json();}
const rich=t=>[{type:'text',text:{content:t.slice(0,2000)}}];
async function sync(p){if(!notionToken)throw Error('Notion 연결이 필요합니다.');return syncProject(p,{notion,commit,state});}
async function body(req){let s='';for await(const b of req){s+=b;if(Buffer.byteLength(s)>500000)throw Error('입력 크기가 너무 큽니다.');}return JSON.parse(s||'{}');}
function json(res,data,status=200){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function route(req,res){const origin='http://127.0.0.1:'+port;if(req.headers.host!=='127.0.0.1:'+port)return json(res,{error:'Invalid host'},403);if(req.headers.origin&&req.headers.origin!==origin)return json(res,{error:'Invalid origin'},403);
 const url=new URL(req.url,origin);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
 if(req.method==='GET'&&url.pathname==='/api/state')return json(res,{...state,token,config:{aiReady:Boolean(process.env.OPENAI_API_KEY),provider:'OpenAI',model:process.env.OPENAI_MODEL||'gpt-4.1-mini',notionReady:Boolean(notionToken),dataDir},auditIntegrity:audit.verifyState(auditRows(),state)});
 if(req.method==='GET'&&url.pathname==='/api/export'){const p=core.find(state.projects,url.searchParams.get('id'));res.writeHead(200,{'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':'attachment; filename="fieldwork-project.md"','Cache-Control':'no-store'});return res.end(core.bundle(p));}
 if(req.method==='GET'&&url.pathname==='/api/audit'){const all=auditRows(),id=url.searchParams.get('projectId');return json(res,{integrity:audit.verifyState(all,state),entries:all.filter(r=>!id||r.projectIds.includes(id)).map(r=>({...r,changes:r.changes.map(c=>({...c,fields:audit.fields(c.before,c.after)}))}))});}
 if(req.method==='GET'&&url.pathname==='/api/evidence'){const p=core.find(state.projects,url.searchParams.get('id'));const all=auditRows();const pack={format:'Fieldwork Evidence v1',exportedAt:core.now(),project:structuredClone(p),sources:state.inputs.filter(i=>i.projectId===p.id).map(i=>({...i,sourceSHA256:audit.digest(i.text)})),audit:all.filter(r=>r.projectIds.includes(p.id)),globalChainVerification:audit.verifyState(all,state),caution:'기기 내 기록·해시 체인. 신원 인증·신뢰 타임스탬프·외부 불변 저장소는 아님. 부분 내보내기에는 체인 중간 기록이 생략될 수 있음.'};res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="fieldwork-evidence.json"','Cache-Control':'no-store'});return res.end(JSON.stringify(pack,null,2));}
 if(req.method==='GET'&&url.pathname==='/api/matches'){const i=core.find(state.inputs,url.searchParams.get('inputId'));return json(res,library.matches(state,i.text));}
 const files={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};if(req.method==='GET'&&files[url.pathname]){const [f,type]=files[url.pathname];res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});return res.end(readFileSync(path.join(root,'src',f)));}
 if(req.method!=='POST'||!url.pathname.startsWith('/api/'))return json(res,{error:'Not found'},404);if(req.headers['x-fieldwork-token']!==token)return json(res,{error:'세션을 새로고침하세요.'},403);
 if(!audit.verifyState(auditRows(),persisted).valid)throw Error('감사 기록 무결성 오류. 쓰기를 중단했습니다. 근거 자료를 백업하고 확인하세요.');const b=await body(req);let result;auditMeta={action:url.pathname.slice(5),actor:['/api/analyze','/api/poc'].includes(url.pathname)?'OpenAI · initiated by Local Operator':'Local Operator (미인증 로컬 사용자)',reason:b.reason||b.reviewNote||b.note||'사용자가 '+url.pathname.slice(5)+' 실행'};
 if(url.pathname==='/api/manual-request')result=manual.makeRequest(state,b);
 else if(url.pathname==='/api/manual-import')result=manual.importResult(state,b);
 else if(url.pathname==='/api/input')result=core.input(state,b);
 else if(url.pathname==='/api/analyze'){const i=core.find(state.inputs,b.inputId);if(i.status==='applied')throw Error('이미 반영한 입력입니다.');if(!b.consent)throw Error('OpenAI 전송 동의가 필요합니다.');const p=i.projectId?core.find(state.projects,i.projectId):null;const a=await callAI({purpose:'analysis',text:i.text,context:JSON.stringify({approvedProject:p?{facts:p.facts,questions:p.questions}:null,reusableReferenceOnly:library.context(state,b.caseIds)}),key:process.env.OPENAI_API_KEY});const checked=core.validateAnalysis(a,i);i.analysisHistory||=[];if(i.analysis)i.analysisHistory.push({at:core.now(),analysis:structuredClone(i.analysis)});i.analysis=checked;i.reusedCases=library.context(state,b.caseIds).map(c=>({id:c.caseId,version:c.caseVersion}));i.status='review';core.event(state,'ai.analyzed',i.id);result=i;}
 else if(url.pathname==='/api/complete')result=library.complete(state,b);
 else if(url.pathname==='/api/reopen')result=library.reopen(state,b);
 else if(url.pathname==='/api/case-publish')result=library.publish(state,b);
 else if(url.pathname==='/api/case-retire')result=library.retire(state,b);
 else if(url.pathname==='/api/review-bulk')result=core.reviewBulk(state,b);
 else if(url.pathname==='/api/review')result=core.review(state,b);
 else if(url.pathname==='/api/apply'){result=core.apply(state,b);commit();if(notionToken){try{await sync(result);result.syncError=null;}catch(e){result.syncError=e.message;}}}
 else if(url.pathname==='/api/resolve')result=core.resolve(state,b);
 else if(url.pathname==='/api/poc'){const p=core.find(state.projects,b.projectId);core.pocGate(state,p);if(!b.consent)throw Error('OpenAI 전송 동의가 필요합니다.');const text=await callAI({purpose:'poc',text:JSON.stringify({facts:p.facts,answers:p.questions,reusableReferenceOnly:library.context(state,b.caseIds)}),key:process.env.OPENAI_API_KEY});p.poc={text,version:(p.poc?.version||0)+1,status:'draft',at:core.now()};p.version++;core.event(state,'poc.drafted',p.id);result=p;}
 else if(url.pathname==='/api/poc-edit')result=core.editPoc(state,b);
 else if(url.pathname==='/api/customer')result=core.customer(state,b);
 else if(url.pathname==='/api/notion-connect'){if(!projectsDatabase||!process.env.NOTION_PROJECTS_SOURCE||!process.env.NOTION_TASKS_SOURCE||!process.env.NOTION_PROJECT_TEMPLATE)throw Error('Configure NOTION_PROJECTS_DATABASE, NOTION_PROJECTS_SOURCE, NOTION_TASKS_SOURCE and NOTION_PROJECT_TEMPLATE in .env.local first.');if(typeof b.token!=='string'||b.token.length<20)throw Error('Notion 통합 토큰을 입력하세요.');const previous=notionToken;notionToken=b.token;try{await notion('GET','databases/'+projectsDatabase);const file=path.join(dataDir,'notion-connection.json');writeFileSync(file+'.tmp',JSON.stringify({token:notionToken}),{mode:0o600});renameSync(file+'.tmp',file);result={connected:true};}catch(e){notionToken=previous;throw e;}}
 else if(url.pathname==='/api/notion-sync')result=await sync(core.find(state.projects,b.projectId));
 else throw Error('지원하지 않는 동작입니다.');commit();json(res,{ok:true,result});
}
http.createServer((req,res)=>{if(req.method==='POST'){queue=queue.catch(()=>{}).then(()=>route(req,res)).catch(e=>{json(res,{error:e.message},400)});}else route(req,res).catch(e=>json(res,{error:e.message},400));}).listen(port,'127.0.0.1',()=>console.log('Fieldwork running: http://127.0.0.1:'+port));
