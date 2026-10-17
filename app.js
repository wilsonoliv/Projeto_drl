/* Protótipo de demonstração. Não contém conexão com Supabase nem autenticação. */
const STORE_KEY = "gestaoCampanhasDemoV1";
const defaultModels = [
  {id:"model-sales",name:"Meta de vendas",type:"sales",commission:10,bonus:0,positiveTarget:100,version:1},
  {id:"model-sales-positive",name:"Vendas + positivação",type:"sales_positive",commission:10,bonus:500,positiveTarget:100,version:1},
  {id:"model-ranking",name:"Ranking por vendas",type:"ranking",commission:0,bonus:0,positiveTarget:100,version:1}
];
const demo = {
  models: defaultModels,
  campaigns: [
    {id:"camp-001",name:"Campanha de vendas — Outubro",modelId:"model-sales",start:"2026-10-01",end:"2026-10-31",region:"MG",audience:"RCA",createdAt:new Date().toISOString()},
    {id:"camp-002",name:"Vendas + positivação — Outubro",modelId:"model-sales-positive",start:"2026-10-01",end:"2026-10-31",region:"ES",audience:"RCA",createdAt:new Date().toISOString()}
  ],
  results: {
    "camp-001":[
      {code:"1025",name:"João Silva",sales:110000,target:100000,positivation:0,importedAt:new Date().toISOString()},
      {code:"1042",name:"Maria Souza",sales:92000,target:100000,positivation:0,importedAt:new Date().toISOString()},
      {code:"1071",name:"Pedro Lima",sales:125000,target:120000,positivation:0,importedAt:new Date().toISOString()}
    ],
    "camp-002":[
      {code:"1025",name:"João Silva",sales:110000,target:100000,positivation:87.5,importedAt:new Date().toISOString()},
      {code:"1042",name:"Maria Souza",sales:105000,target:100000,positivation:100,importedAt:new Date().toISOString()}
    ]
  },
  imports: []
};
let state = loadState();
let selectedCampaignId = state.campaigns[0]?.id || null;
let chart = null;
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const money = n => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n)||0);
const pct = n => `${(Number(n)||0).toLocaleString("pt-BR",{maximumFractionDigits:1})}%`;
const dateBR = s => s ? new Date(`${s}T12:00:00`).toLocaleDateString("pt-BR") : "—";
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function loadState(){try{const raw=localStorage.getItem(STORE_KEY);return raw?JSON.parse(raw):structuredClone(demo)}catch{return structuredClone(demo)}}
function saveState(){localStorage.setItem(STORE_KEY,JSON.stringify(state))}
function getModel(id){return state.models.find(m=>m.id===id)}
function getCampaign(id){return state.campaigns.find(c=>c.id===id)}
function calcResult(row,campaign){
  const model=getModel(campaign.modelId)||defaultModels[0];
  const sales=Number(row.sales)||0, target=Number(row.target)||0, positive=Number(row.positivation)||0;
  const attainment=target>0?sales/target*100:0;
  const eligibleSalesCommission=model.type!=="ranking" && attainment>=100;
  const commission=eligibleSalesCommission?sales*(Number(model.commission)||0)/100:0;
  const positiveEligible=model.type!=="sales_positive" || positive>=Number(model.positiveTarget||100);
  const bonusEligible=model.type==="sales_positive" && attainment>=100 && positiveEligible;
  const bonus=bonusEligible?(Number(model.bonus)||0):0;
  return {...row,sales,target,positivation:positive,attainment,commission,bonus,totalReward:commission+bonus,eligibleSalesCommission,bonusEligible,modelType:model.type};
}
function getCalculated(campaignId){const c=getCampaign(campaignId);if(!c)return[];return (state.results[campaignId]||[]).map(r=>calcResult(r,c)).sort((a,b)=>b.sales-a.sales)}
function setView(name){$$(".view").forEach(v=>v.classList.toggle("hidden",v.id!==`view-${name}`));$$(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===name));const titles={dashboard:"Dashboard",campaigns:"Campanhas",models:"Modelos e regras",imports:"Importar Excel"};$("#page-title").textContent=titles[name]||"Dashboard";if(name==="dashboard")renderDashboard();if(name==="campaigns")renderCampaigns();if(name==="models")renderModels();if(name==="imports")renderImports()}
function go(name){setView(name)}
function modelTypeLabel(type){return ({sales:"Meta de vendas",sales_positive:"Vendas + positivação",ranking:"Ranking"})[type]||type}
function renderModelOptions(){
  const opts=state.models.map(m=>`<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}</option>`).join("");
  $("#campaign-model").innerHTML=opts||'<option value="">Cadastre um modelo primeiro</option>';
  $("#import-campaign").innerHTML=state.campaigns.map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join("")||'<option value="">Cadastre uma campanha primeiro</option>';
}
function renderDashboard(){
  $("#metric-campaigns").textContent=state.campaigns.length;
  $("#metric-models").textContent=state.models.length;
  const all=state.campaigns.flatMap(c=>getCalculated(c.id));
  $("#metric-people").textContent=new Set(all.map(r=>r.code)).size;
  const salesRows=state.campaigns.filter(c=>getModel(c.modelId)?.type!=="ranking").flatMap(c=>getCalculated(c.id)).filter(r=>r.target>0);
  $("#metric-attainment").textContent=salesRows.length?pct(salesRows.reduce((s,r)=>s+r.attainment,0)/salesRows.length):"—";
  const recent=state.campaigns.slice().sort((a,b)=>b.start.localeCompare(a.start)).slice(0,5);
  $("#recent-campaigns").innerHTML=recent.length?`<table><thead><tr><th>Campanha</th><th>Modelo</th><th>Participantes</th><th>Status</th></tr></thead><tbody>${recent.map(c=>`<tr><td><strong>${escapeHtml(c.name)}</strong><br><small>${dateBR(c.start)} – ${dateBR(c.end)}</small></td><td>${escapeHtml(getModel(c.modelId)?.name||"Modelo removido")}</td><td>${getCalculated(c.id).length}</td><td><span class="pill green">Cadastrada</span></td></tr>`).join("")}</tbody></table>`:'<div class="empty">Nenhuma campanha cadastrada.</div>';
  const chartData=state.campaigns.map(c=>({name:c.name.length>22?c.name.slice(0,22)+"…":c.name,att:getCalculated(c.id).filter(r=>r.target>0).length?getCalculated(c.id).filter(r=>r.target>0).reduce((s,r)=>s+r.attainment,0)/getCalculated(c.id).filter(r=>r.target>0).length:0}));
  const ctx=$("#attainment-chart");
  if(chart)chart.destroy();
  chart=new Chart(ctx,{type:"bar",data:{labels:chartData.map(x=>x.name),datasets:[{label:"Atingimento médio (%)",data:chartData.map(x=>x.att),borderRadius:7,backgroundColor:"#4775ee"}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>v+"%"},grid:{color:"#edf0f6"}},x:{grid:{display:false}}}}});
}
function renderCampaigns(){
  renderModelOptions();
  $("#campaign-list").innerHTML=state.campaigns.length?`<table><thead><tr><th>Campanha</th><th>Modelo</th><th>Período</th><th>Região</th><th>Público</th><th>Participantes</th><th>Ação</th></tr></thead><tbody>${state.campaigns.map(c=>`<tr><td><strong>${escapeHtml(c.name)}</strong></td><td>${escapeHtml(getModel(c.modelId)?.name||"—")}</td><td>${dateBR(c.start)} – ${dateBR(c.end)}</td><td>${escapeHtml(c.region||"Todas")}</td><td>${escapeHtml(c.audience)}</td><td>${(state.results[c.id]||[]).length}</td><td><button class="text-button" data-select-campaign="${escapeHtml(c.id)}">Ver resultados</button></td></tr>`).join("")}</tbody></table>`:'<div class="empty">Nenhuma campanha. Cadastre uma acima.</div>';
  renderCampaignResults();
}
function renderCampaignResults(){
  const c=getCampaign(selectedCampaignId);
  $("#results-title").textContent=c?`Resultados — ${c.name}`:"Resultados da campanha";
  if(!c){$("#campaign-results").innerHTML='<div class="empty">Selecione uma campanha.</div>';return}
  const rows=getCalculated(c.id);
  const ranking=getModel(c.modelId)?.type==="ranking";
  $("#campaign-results").innerHTML=rows.length?`<table><thead><tr><th>${ranking?"Posição":"Participante"}</th><th>Código</th><th>Venda</th><th>Meta</th><th>Atingimento</th><th>Positivação</th><th>Comissão</th><th>Bônus</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${ranking?`<span class="pill">${i+1}º</span>`:escapeHtml(r.name)}</td><td>${escapeHtml(r.code)}</td><td>${money(r.sales)}</td><td>${money(r.target)}</td><td><span class="pill ${r.attainment>=100?"green":"gray"}">${pct(r.attainment)}</span></td><td>${r.modelType==="sales_positive"?pct(r.positivation):"—"}</td><td>${money(r.commission)}</td><td>${money(r.bonus)}</td></tr>`).join("")}</tbody></table><p class="subtle">Valores ilustrativos. Comissão e bônus seguem as regras do modelo selecionado.</p>`:'<div class="empty">Ainda não há resultados. Importe um Excel na seção Importar Excel.</div>';
}
function renderModels(){
  $("#model-list").innerHTML=state.models.map(m=>`<div class="model-card"><span class="pill">${escapeHtml(modelTypeLabel(m.type))}</span><h4>${escapeHtml(m.name)}</h4><p>Comissão: ${Number(m.commission)||0}%<br>Bônus: ${money(m.bonus)}<br>Positivação mínima: ${Number(m.positiveTarget)||0}%</p><small>Versão ${m.version||1}</small></div>`).join("");
  renderModelOptions();
}
function renderImports(){
  renderModelOptions();
  $("#import-history").innerHTML=state.imports.length?`<table><thead><tr><th>Data</th><th>Arquivo</th><th>Campanha</th><th>Linhas aceitas</th><th>Status</th></tr></thead><tbody>${state.imports.slice().reverse().map(i=>`<tr><td>${new Date(i.date).toLocaleString("pt-BR")}</td><td>${escapeHtml(i.file)}</td><td>${escapeHtml(getCampaign(i.campaignId)?.name||"Campanha removida")}</td><td>${i.rows}</td><td><span class="pill green">Importado</span></td></tr>`).join("")}</tbody></table>`:'<div class="empty">Nenhuma importação realizada.</div>';
}
function normalizeKey(s){return String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]/g,"")}
function mapRow(row){
  const normalized={};Object.entries(row).forEach(([k,v])=>normalized[normalizeKey(k)]=v);
  const pick=(keys)=>{for(const k of keys){if(normalized[k]!==undefined)return normalized[k]}return undefined};
  const code=pick(["codigo","codigoparticipante","codigorca","rca","matricula","id"]);
  const name=pick(["nome","nomeparticipante","participante","vendedor"]);
  const sales=pick(["venda","vendas","vendarealizada","realizado","vendasrealizadas","valorvenda"]);
  const target=pick(["meta","metavenda","metadevendas","metavalor"]);
  const positivity=pick(["positivacao","positivacao","positivacaopercentual","positivacaopercentual","percentualpositivacao"]);
  const toNum=v=>{if(typeof v==="number")return v;let s=String(v??"").trim().replace(/[R$\s%]/g,"");if(s.includes(",")&&s.includes("."))s=s.replace(/\./g,"").replace(",",".");else if(s.includes(","))s=s.replace(",",".");return Number(s)};
  return {code:String(code??"").trim(),name:String(name??code??"Sem nome").trim(),sales:toNum(sales),target:toNum(target),positivation:positivity===undefined?0:toNum(positivity)};
}
function showMessage(msg,type="success"){$("#import-message").className=`message ${type}`;$("#import-message").textContent=msg}
$("#campaign-form").addEventListener("submit",e=>{
  e.preventDefault();const f=new FormData(e.currentTarget);
  const campaign={id:crypto.randomUUID(),name:f.get("name").trim(),modelId:f.get("modelId"),start:f.get("start"),end:f.get("end"),region:f.get("region").trim(),audience:f.get("audience"),createdAt:new Date().toISOString()};
  if(campaign.end<campaign.start){alert("A data final não pode ser anterior à data inicial.");return}
  state.campaigns.push(campaign);state.results[campaign.id]=[];selectedCampaignId=campaign.id;saveState();e.currentTarget.reset();renderCampaigns();renderDashboard();
});
$("#model-form").addEventListener("submit",e=>{
  e.preventDefault();const f=new FormData(e.currentTarget);
  state.models.push({id:crypto.randomUUID(),name:f.get("name").trim(),type:f.get("type"),commission:Number(f.get("commission"))||0,bonus:Number(f.get("bonus"))||0,positiveTarget:Number(f.get("positiveTarget"))||100,version:1});
  saveState();e.currentTarget.reset();renderModels();renderCampaigns();renderDashboard();
});
$("#import-form").addEventListener("submit",async e=>{
  e.preventDefault();const f=new FormData(e.currentTarget),campaignId=f.get("campaignId"),file=f.get("file");
  if(!file||!campaignId){showMessage("Selecione uma campanha e um arquivo.","error");return}
  try{
    let workbook;
    if(file.name.toLowerCase().endsWith(".csv")){const text=await file.text();workbook=XLSX.read(text,{type:"string"})}
    else workbook=XLSX.read(await file.arrayBuffer(),{type:"array"});
    const sheet=workbook.Sheets[workbook.SheetNames[0]];
    const raw=XLSX.utils.sheet_to_json(sheet,{defval:""});
    if(!raw.length)throw new Error("O arquivo não contém linhas de dados.");
    const parsed=raw.map(mapRow);
    const invalid=parsed.filter(r=>!r.code||!Number.isFinite(r.sales)||!Number.isFinite(r.target));
    if(invalid.length)throw new Error(`${invalid.length} linha(s) sem código, venda ou meta numérica. Verifique os cabeçalhos e valores.`);
    const existing=state.results[campaignId]||[];
    const byCode=new Map(existing.map(r=>[String(r.code),r]));
    // Neste protótipo, cada importação substitui/atualiza o registro por código de participante.
    // Produção precisa definir se a origem é snapshot completo ou movimento incremental.
    parsed.forEach(r=>byCode.set(String(r.code),{...r,importedAt:new Date().toISOString()}));
    state.results[campaignId]=[...byCode.values()];
    state.imports.push({date:new Date().toISOString(),file:file.name,campaignId,rows:parsed.length});
    saveState();renderImports();renderCampaigns();renderDashboard();
    $("#import-preview").innerHTML=`<h3>Prévia dos dados importados (${parsed.length} linhas)</h3><div class="table-wrap"><table><thead><tr><th>Código</th><th>Nome</th><th>Venda</th><th>Meta</th><th>Positivação</th></tr></thead><tbody>${parsed.slice(0,12).map(r=>`<tr><td>${escapeHtml(r.code)}</td><td>${escapeHtml(r.name)}</td><td>${money(r.sales)}</td><td>${money(r.target)}</td><td>${pct(r.positivation)}</td></tr>`).join("")}</tbody></table></div>`;
    showMessage(`Importação concluída: ${parsed.length} linhas lidas e validadas. Confira os resultados da campanha.`, "success");
  }catch(err){showMessage(err.message||"Não foi possível ler o arquivo.","error")}
});
document.addEventListener("click",e=>{
  const nav=e.target.closest("[data-view]");if(nav)setView(nav.dataset.view);
  const goBtn=e.target.closest("[data-goto]");if(goBtn)setView(goBtn.dataset.goto);
  const select=e.target.closest("[data-select-campaign]");if(select){selectedCampaignId=select.dataset.selectCampaign;renderCampaignResults();$("#results-panel").scrollIntoView({behavior:"smooth",block:"start"})}
});
renderModelOptions();renderDashboard();renderCampaigns();renderModels();renderImports();
