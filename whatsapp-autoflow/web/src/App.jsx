import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle, LayoutDashboard, Users, Workflow, Repeat, MessageSquareReply,
  CalendarClock, FileText, ScrollText, CreditCard, Database, User as UserIcon,
  MessageSquare, LogOut, Loader2, RefreshCw, Clock, Copy, Pencil, Trash2,
  Download, Upload, Search, Check, Plus, X, CheckCircle2, Smartphone,
} from "lucide-react";
import { api, setToken, clearToken } from "./api.js";

/* ════════════════════════════════════════════════════════════════════
   PRIMITIVOS COMPARTILHADOS  (espelham os helpers do bundle original)
   ════════════════════════════════════════════════════════════════════ */

// concat condicional de classes (helper `A` no bundle)
function cn(...xs) { return xs.filter(Boolean).join(" "); }

// classes de input/select reutilizadas em todo o app (`V` / `Yt` no bundle)
const INPUT =
  "w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40";
const SELECT = INPUT;

// Campo com rótulo (`$` no bundle)
function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-400 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

// Modal (`Pt` no bundle)
function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 flex items-center justify-between border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
          <div className="font-semibold text-white">{title}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Toast simples
function PremiumBadge() {
  return (
    <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded-md bg-gradient-to-r from-gold-500/20 to-gold-300/10 text-gold-300 border border-gold-500/30">
      PREMIUM
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const tone = {
    indigo: "bg-brand-600 text-white",
    red: "bg-red-600 text-white",
    slate: "bg-slate-700 text-white",
    emerald: "bg-emerald-600 text-white",
  }[toast.tone] || "bg-slate-700 text-white";
  return (
    <div className={cn("fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-xl flex items-center gap-2 transition-all", tone)}>
      {toast.msg}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, tone = "indigo") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3000);
  }, []);
  return [toast, show];
}

// Indicador de status do WhatsApp (`xo` no bundle)
function StatusDot({ status }) {
  const wrap = {
    connected: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    qr: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    disconnected: "bg-red-500/20 text-red-400 border border-red-500/30",
    starting: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  }[status] || "bg-slate-500/20 text-slate-400 border border-slate-500/30";
  const dot = {
    connected: "bg-emerald-400", qr: "bg-amber-400 animate-pulse",
    disconnected: "bg-red-400", starting: "bg-slate-400 animate-pulse",
  }[status] || "bg-slate-400";
  const label = status === "connected" ? "Conectado"
    : status === "qr" ? "Aguardando QR"
    : status === "starting" ? "Iniciando" : "Desconectado";
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", wrap)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

// Item de navegação da sidebar (`Xe` no bundle)
function NavItem({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors",
        active ? "bg-brand-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {badge ? <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded-full">{badge}</span> : null}
    </button>
  );
}

// Seletor de contato com busca + entrada manual (`hr` no bundle).
// MELHORIA DE UI: deixa explícito que dá pra digitar o número à mão,
// sem remover a busca por nome.
function ContactPicker({ value, onChange, onPickContact, placeholder = "Ex: 5511999999999", className }) {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function search(q) {
    setLoading(true);
    try {
      const data = await api(`whatsapp/contacts?q=${encodeURIComponent(q)}&limit=8`);
      setResults(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }
  function onInput(e) {
    const v = e.target.value;
    onChange(v);
    onPickContact && onPickContact({ phone: v, name: "" });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(v), 280);
  }
  function pick(c) {
    onChange(c.phone);
    onPickContact && onPickContact(c);
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <input
          className={className || INPUT}
          value={value}
          onChange={onInput}
          onFocus={() => search(value)}
          placeholder={placeholder}
          autoComplete="off"
          inputMode="numeric"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />}
      </div>
      {/* dica de número manual — torna explícita a digitação direta */}
      <div className="text-xs text-slate-500 mt-1">
        Digite o número com DDD (ex.: 5511999999999) <span className="text-slate-600">ou</span> busque pelo nome do contato.
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden">
          {results.map((c, idx) => (
            <button
              key={(c.phone || "") + idx}
              type="button"
              onMouseDown={() => pick(c)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-brand-600/20 border border-brand-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-4 w-4 text-brand-300" />
              </div>
              <div className="min-w-0">
                <div className="text-sm text-white truncate">
                  {c.name && c.name.trim() ? c.name : "(sem nome)"}
                  {c.uncertain ? <span className="ml-1.5 text-amber-400 text-xs">• incerto</span> : null}
                </div>
                <div className="text-xs text-slate-400 font-mono">{c.phone}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   CRON BUILDER  (`km` no bundle)
   ════════════════════════════════════════════════════════════════════ */
function buildCron(cfg) {
  const [hh = "09", mm = "00"] = String(cfg.time || "09:00").split(":");
  const h = String(parseInt(hh, 10) || 0);
  const m = String(parseInt(mm, 10) || 0);
  if (cfg.repeatKind === "daily") return `${m} ${h} * * *`;
  if (cfg.repeatKind === "weekly") {
    const days = (cfg.weeklyDays && cfg.weeklyDays.length ? cfg.weeklyDays : [1]).slice().sort((a, b) => a - b);
    return `${m} ${h} * * ${days.join(",")}`;
  }
  if (cfg.repeatKind === "monthly") {
    const d = Math.min(31, Math.max(1, parseInt(cfg.monthlyDay, 10) || 1));
    return `${m} ${h} ${d} * *`;
  }
  const every = Math.max(1, parseInt(cfg.intervalEvery, 10) || 1);
  return cfg.intervalUnit === "hours" ? `${m} */${every} * * *` : `*/${every} * * * *`;
}

const WEEKDAYS = [
  { v: 0, l: "Dom" }, { v: 1, l: "Seg" }, { v: 2, l: "Ter" }, { v: 3, l: "Qua" },
  { v: 4, l: "Qui" }, { v: 5, l: "Sex" }, { v: 6, l: "Sáb" },
];

/* ════════════════════════════════════════════════════════════════════
   TELA: VISÃO GERAL (dashboard)
   ════════════════════════════════════════════════════════════════════ */
function DashboardView({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api("dashboard")); } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const cards = data ? [
    { icon: "⚡", label: "Automações ativas", value: `${data.recurringActive} / ${data.recurringTotal}` },
    { icon: "👥", label: "Clientes", value: data.contacts },
    { icon: "📝", label: "Templates", value: data.templates },
    { icon: "🔄", label: "Na esteira", value: data.pipelineActive },
  ] : [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Visão Geral</h1>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-500/15 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">{c.icon}</div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-white">{c.value}</div>
              <div className="text-xs text-slate-500">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-sm font-semibold text-white mb-3">Próximas automações</div>
          <div className="space-y-2">
            {(data?.upcoming || []).length === 0 && <div className="text-sm text-slate-500">Nenhuma automação agendada.</div>}
            {(data?.upcoming || []).map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-800/40 rounded-xl px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm text-white font-medium truncate">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.templateName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-brand-300">{new Date(c.next).toLocaleDateString("pt-BR")}</div>
                  <div className="text-xs text-slate-500">{new Date(c.next).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-sm font-semibold text-white mb-3">Atividade recente</div>
          <div className="space-y-2">
            {(data?.recentAudit || []).length === 0 && <div className="text-sm text-slate-500">Sem atividade.</div>}
            {(data?.recentAudit || []).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="text-slate-300 truncate">{c.detail || c.action}</div>
                <div className="text-xs text-slate-500 flex-shrink-0 ml-2">{new Date(c.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConnectBanner onNavigate={onNavigate} />
    </div>
  );
}

// Banner de conexão do WhatsApp (`Tm` no bundle)
function ConnectBanner({ onNavigate }) {
  const [st, setSt] = useState(null);
  useEffect(() => {
    let alive = true;
    api("whatsapp/status").then((s) => { if (alive) setSt(s); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!st || st.status === "connected") return null;
  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-3">
      <div className="text-sm text-amber-300">WhatsApp não está conectado. Conecte para enviar e receber mensagens.</div>
      <button onClick={() => onNavigate("whatsapp")} className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors">Conectar</button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TELA: CLIENTES (contacts)
   ════════════════════════════════════════════════════════════════════ */
function subBadge(c) {
  const end = c.subscriptionEnd ? new Date(c.subscriptionEnd) : null;
  if (!end) return { label: "Sem plano", cls: "border-slate-700 text-slate-500" };
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const days = Math.round((end - now) / 86400000);
  if (days < 0) return { label: "Vencido", cls: "border-red-500/50 text-red-400 bg-red-500/10" };
  if (days === 0) return { label: "Vence hoje", cls: "border-amber-500/50 text-amber-400 bg-amber-500/10" };
  if (days <= 7) return { label: "Vencendo 7d", cls: "border-amber-500/50 text-amber-400 bg-amber-500/10" };
  return { label: "Ativo", cls: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" };
}

function ContactsView({ toast }) {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const blank = { phone: "", name: "", tags: "", subscriptionStart: "", subscriptionEnd: "", subscriptionNotes: "" };
  const [form, setForm] = useState(blank);

  const load = useCallback(async () => { try { setList(await api("contacts")); } catch { /* */ } }, []);
  useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setForm(blank); setOpen(true); }
  function openEdit(c) {
    setEditing(c);
    setForm({
      phone: c.phoneE164 || "", name: c.name || "",
      tags: (c.tags || []).join(", "),
      subscriptionStart: c.subscriptionStart ? c.subscriptionStart.slice(0, 10) : "",
      subscriptionEnd: c.subscriptionEnd ? c.subscriptionEnd.slice(0, 10) : "",
      subscriptionNotes: c.subscriptionNotes || "",
    });
    setOpen(true);
  }
  async function save() {
    const payload = {
      phoneE164: form.phone, name: form.name,
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      subscriptionStart: form.subscriptionStart || null,
      subscriptionEnd: form.subscriptionEnd || null,
      subscriptionNotes: form.subscriptionNotes,
    };
    try {
      if (editing) { const { phoneE164, ...rest } = payload; await api(`contacts/${editing._id}`, { method: "PUT", body: { ...rest, optIn: true } }); toast("Cliente atualizado.", "indigo"); }
      else { await api("contacts", { method: "POST", body: payload }); toast("Cliente cadastrado.", "indigo"); }
      setOpen(false); await load();
    } catch (e) { toast("Erro ao salvar: " + e.message, "red"); }
  }
  async function del(c) {
    if (!confirm(`Remover ${c.name || c.phoneE164}?`)) return;
    try { await api(`contacts/${c._id}`, { method: "DELETE" }); toast("Cliente removido.", "slate"); await load(); }
    catch (e) { toast("Erro: " + e.message, "red"); }
  }

  const filtered = list.filter((c) => {
    const s = q.toLowerCase();
    return !s || (c.name || "").toLowerCase().includes(s) || (c.phoneE164 || "").includes(s);
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">{list.length} cadastrado(s)</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm transition-colors">
          <Plus className="h-4 w-4" /> Adicionar Novo Cliente
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input className={cn(INPUT, "pl-9")} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou número..." />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-800/50 text-xs font-semibold text-slate-400 border-b border-slate-700 px-4 py-3">
          <div className="col-span-4">Cliente</div>
          <div className="col-span-3">WhatsApp</div>
          <div className="col-span-3">Vencimento</div>
          <div className="col-span-2">Ações</div>
        </div>
        {filtered.length === 0 && <div className="px-4 py-10 text-center text-slate-500 text-sm">{q ? "Nenhum resultado" : "Nenhum cliente cadastrado"}</div>}
        {filtered.map((c) => {
          const b = subBadge(c);
          return (
            <div key={c._id} className="grid grid-cols-12 border-b border-slate-800 px-4 py-3 text-sm hover:bg-slate-800/20 transition-colors items-center">
              <div className="col-span-4">
                <div className={cn("font-medium", c.name ? "text-white" : "text-slate-500 italic")}>{c.name || "Sem nome"}</div>
                {(c.tags || []).length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {c.tags.map((t, i) => <span key={i} className="px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">{t}</span>)}
                  </div>
                )}
              </div>
              <div className="col-span-3 text-slate-400 font-mono text-xs">{c.phoneE164}</div>
              <div className="col-span-3 text-xs">
                <span className={cn("px-2 py-1 rounded-full border", b.cls)}>{b.label}</span>
                {c.subscriptionEnd && <div className="text-slate-500 mt-1">{new Date(c.subscriptionEnd).toLocaleDateString("pt-BR")}</div>}
              </div>
              <div className="col-span-2 flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg border border-amber-900/50 hover:bg-amber-500/10 text-amber-600 hover:text-amber-400 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => del(c)} className="p-1.5 rounded-lg border border-red-900/50 hover:bg-red-500/10 text-red-600 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} title={editing ? "Editar Cliente" : "Adicionar Novo Cliente"} onClose={() => setOpen(false)}>
        <div className="space-y-4 max-w-md">
          <Field label="Número de WhatsApp *">
            {editing
              ? <input className={cn(INPUT, "opacity-60")} value={form.phone} disabled />
              : <ContactPicker value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} onPickContact={(c) => setForm((f) => ({ ...f, phone: c.phone || "", name: c.name || f.name }))} />}
          </Field>
          <Field label="Nome (opcional)"><input className={INPUT} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: João Silva" /></Field>
          <Field label="Tags (separadas por vírgula)"><input className={INPUT} value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="vip, mensal" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Início da assinatura"><input type="date" className={INPUT} value={form.subscriptionStart} onChange={(e) => setForm((f) => ({ ...f, subscriptionStart: e.target.value }))} /></Field>
            <Field label="Vencimento"><input type="date" className={INPUT} value={form.subscriptionEnd} onChange={(e) => setForm((f) => ({ ...f, subscriptionEnd: e.target.value }))} /></Field>
          </div>
          <Field label="Observações"><textarea className={cn(INPUT, "min-h-[70px] resize-y")} value={form.subscriptionNotes} onChange={(e) => setForm((f) => ({ ...f, subscriptionNotes: e.target.value }))} /></Field>
          <div className="flex gap-3 pt-1">
            <button onClick={save} className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-500 text-white py-2.5 font-medium text-sm transition-colors">Salvar Cliente</button>
            <button onClick={() => setOpen(false)} className="px-4 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm transition-colors">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TELA: TEMPLATES (tpl)
   ════════════════════════════════════════════════════════════════════ */
function extractVars(body) {
  const out = new Set();
  String(body || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => { out.add(k); return _m; });
  return Array.from(out);
}

function TemplatesView({ toast }) {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", body: "" });
  const load = useCallback(async () => { try { setList(await api("templates")); } catch { /* */ } }, []);
  useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setForm({ name: "", body: "" }); setOpen(true); }
  function openEdit(t) { setEditing(t); setForm({ name: t.name, body: t.body }); setOpen(true); }
  async function save() {
    const vars = extractVars(form.body);
    try {
      if (editing) { await api(`templates/${editing._id}`, { method: "PUT", body: { name: form.name, body: form.body, vars } }); toast("Template atualizado!", "indigo"); }
      else { await api("templates", { method: "POST", body: { name: form.name, body: form.body, vars } }); toast("Template criado!", "indigo"); }
      setOpen(false); await load();
    } catch (e) { toast("Erro ao salvar: " + e.message, "red"); }
  }
  async function clone(t) { try { await api(`templates/${t._id}/clone`, { method: "POST" }); toast("Template clonado!", "indigo"); await load(); } catch { toast("Erro ao clonar", "red"); } }
  async function del(t) {
    if (!confirm(`Deletar template "${t.name}"? Esta ação não pode ser desfeita.`)) return;
    try { await api(`templates/${t._id}`, { method: "DELETE" }); toast("Template deletado.", "slate"); await load(); } catch { toast("Erro ao deletar", "red"); }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Mensagens reutilizáveis com variáveis {"{{nome}}"}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm transition-colors"><Plus className="h-4 w-4" /> Criar template</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {list.length === 0 && <div className="text-slate-500 text-sm">Nenhum template criado ainda.</div>}
        {list.map((t) => (
          <div key={t._id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white">{t.name}</div>
              <div className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString("pt-BR")}</div>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-3 text-sm text-slate-300 leading-relaxed min-h-[56px] whitespace-pre-wrap">{t.body}</div>
            {(t.vars || []).length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {t.vars.map((v, i) => <span key={i} className="text-xs px-2 py-0.5 bg-brand-500/10 text-brand-300 rounded-full font-mono">{`{{${v}}}`}</span>)}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-700/50">
              <button onClick={() => clone(t)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"><Copy className="h-3.5 w-3.5" /> Copiar</button>
              <button onClick={() => openEdit(t)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/50 hover:bg-brand-600/30 hover:text-brand-300 text-slate-300 text-xs font-medium transition-colors"><Pencil className="h-3.5 w-3.5" /> Editar</button>
              <button onClick={() => del(t)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/50 hover:bg-red-500/20 hover:text-red-400 text-slate-400 text-xs font-medium transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} title={editing ? "Editar template" : "Criar template"} onClose={() => setOpen(false)}>
        <div className="space-y-4 max-w-lg">
          <Field label="Nome *"><input className={INPUT} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Confirmação" /></Field>
          <Field label="Mensagem *"><textarea className={cn(INPUT, "min-h-[120px] resize-y")} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Olá {{nome}}! ..." /></Field>
          <div className="text-xs text-slate-500">Variáveis detectadas: {extractVars(form.body).map((v) => `{{${v}}}`).join(", ") || "nenhuma"}</div>
          <div className="flex gap-3 pt-1">
            <button onClick={save} className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-500 text-white py-2.5 font-medium text-sm transition-colors">{editing ? "Salvar alterações" : "Criar template"}</button>
            <button onClick={() => setOpen(false)} className="px-4 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm transition-colors">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TELA: RESPOSTAS AUTOMÁTICAS (autoReply)
   ════════════════════════════════════════════════════════════════════ */
function AutoReplyView({ toast }) {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mode, setMode] = useState("all"); // all | specific  (botões Todos / Puxar)
  const blank = { keyword: "", reply: "", targetPhone: "", targetName: "", startTime: "00:00", endTime: "23:59", active: true };
  const [form, setForm] = useState(blank);

  // painel de teste
  const [test, setTest] = useState({ phone: "", text: "" });
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => { try { setList(await api("auto-reply")); } catch { /* */ } }, []);
  useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setForm(blank); setMode("all"); setOpen(true); }
  function openEdit(r) {
    setEditing(r);
    setForm({ keyword: r.keyword, reply: r.reply, targetPhone: r.targetPhone || "", targetName: r.targetName || "", startTime: r.startTime || "00:00", endTime: r.endTime || "23:59", active: r.active });
    setMode(r.targetPhone ? "specific" : "all");
    setOpen(true);
  }
  async function save() {
    if (!form.keyword || !form.reply) { toast("Palavra-chave e resposta são obrigatórias.", "red"); return; }
    const body = { ...form, targetPhone: mode === "specific" ? form.targetPhone : "" };
    try {
      if (editing) { await api(`auto-reply/${editing._id}`, { method: "PUT", body }); toast("Regra atualizada.", "indigo"); }
      else { await api("auto-reply", { method: "POST", body }); toast("Regra criada.", "indigo"); }
      setOpen(false); await load();
    } catch (e) { toast("Erro: " + e.message, "red"); }
  }
  async function toggle(id) { const r = list.find((x) => x._id === id); try { await api(`auto-reply/${id}`, { method: "PUT", body: { ...r, active: !r.active } }); await load(); } catch (e) { toast("Erro: " + e.message, "red"); } }
  async function clone(id) { try { await api(`auto-reply/${id}/clone`, { method: "POST" }); toast("Regra clonada (inicia inativa).", "indigo"); await load(); } catch { toast("Erro ao clonar", "red"); } }
  async function del(id) { if (!confirm("Deletar esta regra?")) return; try { await api(`auto-reply/${id}`, { method: "DELETE" }); toast("Regra deletada.", "slate"); await load(); } catch { toast("Erro", "red"); } }

  async function runTest() {
    setTesting(true); setTestResult(null);
    try { setTestResult(await api("auto-reply/test", { method: "POST", body: test })); }
    catch (e) { toast("Erro no teste: " + e.message, "red"); }
    finally { setTesting(false); }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Respostas Automáticas</h1>
          <p className="text-sm text-slate-500 mt-1">Responde automaticamente quando a mensagem contém a palavra-chave.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm transition-colors"><Plus className="h-4 w-4" /> Nova regra</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {list.length === 0 && <div className="text-slate-500 text-sm">Nenhuma regra criada ainda</div>}
        {list.map((y) => (
          <div key={y._id} className={cn("bg-slate-800/60 border rounded-2xl p-5 flex flex-col gap-4 transition-all", y.active ? "border-slate-700/80" : "border-slate-800 opacity-70")}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-brand-400 text-lg">⚡</span>
                <span className="font-mono font-semibold text-white text-base">"{y.keyword}"</span>
              </div>
              <button onClick={() => toggle(y._id)} title={y.active ? "Desativar" : "Ativar"} className={cn("relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5", y.active ? "bg-brand-600" : "bg-slate-600")}>
                <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", y.active ? "left-7" : "left-1")} />
              </button>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-3 text-sm text-slate-300 leading-relaxed min-h-[56px]">{y.reply}</div>
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{y.targetPhone ? (y.targetName || y.targetPhone) : "Todos os clientes"}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{y.startTime || "00:00"} - {y.endTime || "23:59"}</span>
              <span className={cn("flex items-center gap-1 font-medium", y.active ? "text-emerald-400" : "text-slate-500")}>
                <span className={cn("w-1.5 h-1.5 rounded-full", y.active ? "bg-emerald-400" : "bg-slate-600")} />{y.active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-700/50">
              <button onClick={() => clone(y._id)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"><Copy className="h-3.5 w-3.5" /> Copiar</button>
              <button onClick={() => openEdit(y)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/50 hover:bg-brand-600/30 hover:text-brand-300 text-slate-300 text-xs font-medium transition-colors"><Pencil className="h-3.5 w-3.5" /> Editar</button>
              <button onClick={() => del(y._id)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/50 hover:bg-red-500/20 hover:text-red-400 text-slate-400 text-xs font-medium transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Painel de teste */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="text-sm font-semibold text-white">🧪 Testar Auto-Reply</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ContactPicker value={test.phone} onChange={(v) => setTest((t) => ({ ...t, phone: v }))} placeholder="Número do remetente" />
          <input className={INPUT} value={test.text} onChange={(e) => setTest((t) => ({ ...t, text: e.target.value }))} placeholder="Texto da mensagem recebida" />
          <button onClick={runTest} disabled={testing} className="rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white py-2 font-medium text-sm flex items-center justify-center gap-2 transition-colors">
            {testing && <Loader2 className="h-4 w-4 animate-spin" />} Simular mensagem
          </button>
        </div>
        {testResult && (
          <div className="space-y-3">
            {testResult.matched ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <div className="text-emerald-400 font-medium text-sm">✅ Regra encontrada!</div>
                <div className="text-xs text-slate-300 mt-1">Keyword: <span className="bg-slate-700 px-1 rounded">{testResult.matched.keyword}</span></div>
                <div className="text-xs text-slate-400 mt-1">Resposta: {testResult.matched.reply}</div>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <div className="text-amber-400 font-medium text-sm">⚠️ Nenhuma regra ativada</div>
                <div className="text-xs text-slate-300 mt-1">Total de regras verificadas: {testResult.total_rules}</div>
              </div>
            )}
            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">Detalhes por regra:</div>
              <div className="space-y-1">
                {testResult.checked.map((c, i) => (
                  <div key={i} className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-xs", c.skip_reason ? "bg-slate-800/50 text-slate-500" : "bg-emerald-500/10 text-emerald-400")}>
                    <span className="font-mono">"{c.keyword}" → {c.targetPhone}</span>
                    <span>{
                      c.skip_reason === "numero_diferente" ? "⛔ Número diferente" :
                      c.skip_reason === "fora_horario" ? "⏰ Fora do horário" :
                      c.skip_reason === "keyword_nao_encontrada" ? "🔍 Keyword não encontrada" : "✅ Ativada"
                    }</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      <Modal open={open} title={editing ? "Editar Resposta Automática" : "Criar Resposta Automática"} onClose={() => setOpen(false)}>
        <div className="space-y-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Palavra-chave ou Mensagem Exata *">
              <input className={INPUT} value={form.keyword} onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))} placeholder="Ex: como pode me ajudar" />
            </Field>
            <Field label="Cliente Específico">
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => { setMode("all"); setForm((f) => ({ ...f, targetPhone: "", targetName: "" })); }} className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors", mode === "all" ? "bg-brand-600 border-brand-500 text-white" : "border-slate-600 text-slate-400 hover:bg-slate-700")}>Todos os clientes</button>
                <button type="button" onClick={() => setMode("specific")} className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1", mode === "specific" ? "bg-emerald-600 border-emerald-500 text-white" : "border-slate-600 text-slate-400 hover:bg-slate-700")}><Search className="h-3 w-3" /> Puxar</button>
              </div>
              {mode === "specific"
                ? <ContactPicker value={form.targetPhone} onChange={(v) => setForm((f) => ({ ...f, targetPhone: v }))} onPickContact={(c) => setForm((f) => ({ ...f, targetPhone: c.phone || "", targetName: c.name || "" }))} placeholder="Buscar contato do WhatsApp..." />
                : <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-500 italic">Responde a todos os contatos</div>}
            </Field>
          </div>
          <Field label="Mensagem de Resposta *">
            <textarea className={cn(INPUT, "min-h-[100px] resize-y")} value={form.reply} onChange={(e) => setForm((f) => ({ ...f, reply: e.target.value }))} placeholder="Ex: Olá! Posso ajudar com..." />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Horário Início"><input type="time" className={INPUT} value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} /></Field>
            <Field label="Horário Fim"><input type="time" className={INPUT} value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} /></Field>
          </div>
          <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
            <div>
              <div className="text-sm font-medium text-white">Ativar Regra</div>
              <div className="text-xs text-slate-500">Deixa a resposta automática funcionando.</div>
            </div>
            <button onClick={() => setForm((f) => ({ ...f, active: !f.active }))} className={cn("relative w-12 h-6 rounded-full transition-colors", form.active ? "bg-brand-600" : "bg-slate-600")}>
              <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow", form.active ? "left-7" : "left-1")} />
            </button>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={save} className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-500 text-white py-2.5 font-medium text-sm transition-colors">{editing ? "Salvar alterações" : "Salvar Regra"}</button>
            <button onClick={() => setOpen(false)} className="px-4 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm transition-colors">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TELA: AUTOMAÇÕES (recurring)
   ════════════════════════════════════════════════════════════════════ */
function RecurringView({ toast }) {
  const [list, setList] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState([]);
  const blank = {
    name: "", templateId: "", targetType: "tag", targetValue: "",
    repeatKind: "daily", time: "09:00", weeklyDays: [1], monthlyDay: 1,
    intervalEvery: 1, intervalUnit: "hours", enabled: true,
    quietStart: "21:00", quietEnd: "08:00", throttlePerMinute: 10,
  };
  const [form, setForm] = useState(blank);

  const load = useCallback(async () => {
    try { const [r, t] = await Promise.all([api("recurring"), api("templates")]); setList(r); setTemplates(t); } catch { /* */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const cron = buildCron(form);
  useEffect(() => {
    let alive = true;
    api("recurring/preview", { method: "POST", body: { pattern: cron, tz: "America/Sao_Paulo", count: 5 } })
      .then((d) => { if (alive) setPreview(d.runs || []); }).catch(() => { if (alive) setPreview([]); });
    return () => { alive = false; };
  }, [cron]);

  function openNew() { setEditing(null); setForm(blank); setOpen(true); }
  function openEdit(r) {
    setEditing(r);
    setForm({ ...blank, name: r.name, templateId: r.templateId?._id || r.templateId || "", targetType: r.targetType, targetValue: r.targetValue || "", time: "09:00", enabled: r.enabled, quietStart: r.quietHours?.start || "21:00", quietEnd: r.quietHours?.end || "08:00", throttlePerMinute: r.throttlePerMinute || 10 });
    setOpen(true);
  }
  async function save() {
    const body = {
      name: form.name || "Minha automação", templateId: form.templateId,
      targetType: form.targetType, targetValue: form.targetValue,
      pattern: cron, tz: "America/Sao_Paulo", enabled: form.enabled,
      throttlePerMinute: Number(form.throttlePerMinute) || 10,
      quietHours: { start: form.quietStart, end: form.quietEnd },
    };
    try {
      if (editing) { await api(`recurring/${editing._id}`, { method: "PUT", body }); toast("Automação atualizada.", "indigo"); }
      else { await api("recurring", { method: "POST", body }); toast("Automação criada.", "indigo"); }
      setOpen(false); await load();
    } catch (e) { toast("Erro: " + e.message, "red"); }
  }
  async function pause(id) { try { await api(`recurring/${id}/pause`, { method: "POST" }); await load(); } catch { /* */ } }
  async function resume(id) { try { await api(`recurring/${id}/resume`, { method: "POST" }); await load(); } catch { /* */ } }
  async function clone(id) { try { await api(`recurring/${id}/clone`, { method: "POST" }); toast("Automação clonada! Ela começa pausada para revisão.", "indigo"); await load(); } catch { toast("Erro ao clonar", "red"); } }
  async function del(id) { if (!confirm("Deletar esta automação? Esta ação não pode ser desfeita.")) return; try { await api(`recurring/${id}`, { method: "DELETE" }); toast("Automação deletada.", "slate"); await load(); } catch { toast("Erro", "red"); } }

  function toggleDay(d) { setForm((f) => ({ ...f, weeklyDays: f.weeklyDays.includes(d) ? f.weeklyDays.filter((x) => x !== d) : [...f.weeklyDays, d] })); }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Automações</h1>
          <p className="text-sm text-slate-500 mt-1">Disparos recorrentes via expressão Cron.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm transition-colors"><Plus className="h-4 w-4" /> Nova automação</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {list.length === 0 && <div className="text-slate-500 text-sm">Nenhuma automação criada.</div>}
        {list.map((r) => (
          <div key={r._id} className={cn("bg-slate-800/60 border rounded-2xl p-5 flex flex-col gap-3", r.enabled ? "border-slate-700/80" : "border-slate-800 opacity-70")}>
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white">{r.name || "(Sem nome)"}</div>
              <span className={cn("text-xs px-2 py-1 rounded-full", r.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-500")}>{r.enabled ? "Ativa" : "Pausada"}</span>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div>Template: {r.templateId?.name || "—"}</div>
              <div>Alvo: <span className="text-slate-300">{r.targetType}</span> {r.targetValue ? `→ ${r.targetValue}` : ""}</div>
              <div>Cron: <span className="font-mono bg-slate-900 px-1 rounded">{r.pattern}</span></div>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-700/50">
              {r.enabled
                ? <button onClick={() => pause(r._id)} className="text-xs px-2 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors">Pausar</button>
                : <button onClick={() => resume(r._id)} className="text-xs px-2 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors">Retomar</button>}
              <button onClick={() => openEdit(r)} className="text-xs px-2 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors">Editar</button>
              <button onClick={() => clone(r._id)} className="text-xs px-2 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors">Copiar</button>
              <button onClick={() => del(r._id)} className="text-xs px-2 py-1.5 rounded-lg border border-red-900/50 hover:bg-red-500/10 text-red-400 transition-colors">Excluir</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} title={editing ? "Editar automação" : "Nova automação recorrente"} onClose={() => setOpen(false)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Nome"><input className={INPUT} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Minha automação" /></Field>
                <Field label="Template">
                  <select className={SELECT} value={form.templateId} onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}>
                    <option value="">Selecione...</option>
                    {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </Field>
                <Field label="Tipo de alvo">
                  <select className={SELECT} value={form.targetType} onChange={(e) => setForm((f) => ({ ...f, targetType: e.target.value, targetValue: "" }))}>
                    <option value="tag">Tag</option>
                    <option value="phone">Número</option>
                    <option value="contact">Contato</option>
                  </select>
                </Field>
                <Field label="Valor do alvo">
                  {form.targetType === "contact"
                    ? <ContactPicker value={form.targetValue} onChange={(v) => setForm((f) => ({ ...f, targetValue: v }))} placeholder="Buscar contato..." />
                    : <input className={INPUT} value={form.targetValue} onChange={(e) => setForm((f) => ({ ...f, targetValue: e.target.value }))} placeholder={form.targetType === "tag" ? "Ex: vip" : "Ex: 5511999999999"} />}
                </Field>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="text-sm font-semibold text-white">Frequência</div>
              <div className="flex flex-wrap gap-2">
                {[["interval", "A cada intervalo"], ["daily", "Diário"], ["weekly", "Semanal"], ["monthly", "Mensal"]].map(([k, l]) => (
                  <button key={k} onClick={() => setForm((f) => ({ ...f, repeatKind: k }))} className={cn("px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors", form.repeatKind === k ? "bg-brand-600 border-brand-500 text-white" : "border-slate-600 text-slate-400 hover:bg-slate-700")}>{l}</button>
                ))}
              </div>

              {form.repeatKind === "interval" && (
                <div className="flex gap-2 items-end">
                  <Field label="A cada"><input type="number" min="1" className={cn(INPUT, "w-24")} value={form.intervalEvery} onChange={(e) => setForm((f) => ({ ...f, intervalEvery: e.target.value }))} /></Field>
                  <select className={cn(SELECT, "w-32")} value={form.intervalUnit} onChange={(e) => setForm((f) => ({ ...f, intervalUnit: e.target.value }))}>
                    <option value="minutes">Minutos</option>
                    <option value="hours">Horas</option>
                  </select>
                </div>
              )}
              {form.repeatKind !== "interval" && (
                <Field label="Horário"><input type="time" className={cn(INPUT, "w-40")} value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} /></Field>
              )}
              {form.repeatKind === "weekly" && (
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-1.5">Dias da semana</div>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((d) => (
                      <button key={d.v} onClick={() => toggleDay(d.v)} className={cn("px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors", form.weeklyDays.includes(d.v) ? "bg-brand-600 border-brand-500 text-white" : "border-slate-600 text-slate-400 hover:bg-slate-700")}>{d.l}</button>
                    ))}
                  </div>
                </div>
              )}
              {form.repeatKind === "monthly" && (
                <Field label="Dia do mês"><input type="number" min="1" max="31" className={cn(INPUT, "w-24")} value={form.monthlyDay} onChange={(e) => setForm((f) => ({ ...f, monthlyDay: e.target.value }))} /></Field>
              )}

              <Field label="Cron gerado"><input className={cn(INPUT, "font-mono bg-slate-900 cursor-default")} value={cron} readOnly /></Field>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-2">
              <div className="text-sm font-semibold text-white">Próximas execuções</div>
              <div className="text-xs text-slate-400 space-y-1">
                {preview.length === 0 && <div>Expressão Cron inválida.</div>}
                {preview.map((r, i) => <div key={i}>{new Date(r).toLocaleString("pt-BR")}</div>)}
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="text-sm font-semibold text-white">Limites</div>
              <Field label="Envios por minuto"><input type="number" min="1" className={INPUT} value={form.throttlePerMinute} onChange={(e) => setForm((f) => ({ ...f, throttlePerMinute: e.target.value }))} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Silêncio início"><input type="time" className={INPUT} value={form.quietStart} onChange={(e) => setForm((f) => ({ ...f, quietStart: e.target.value }))} /></Field>
                <Field label="Silêncio fim"><input type="time" className={INPUT} value={form.quietEnd} onChange={(e) => setForm((f) => ({ ...f, quietEnd: e.target.value }))} /></Field>
              </div>
            </div>
            <button onClick={save} className="w-full rounded-xl bg-brand-600 hover:bg-brand-500 text-white py-2.5 font-medium text-sm transition-colors">{editing ? "Salvar alterações" : "Criar automação"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TELA: AGENDAMENTOS (state key "templates")
   ════════════════════════════════════════════════════════════════════ */
const SCHED_STATUS = {
  pending: "bg-slate-700 text-slate-300", queued: "bg-brand-500/20 text-brand-400",
  sent: "bg-emerald-500/20 text-emerald-400", failed: "bg-red-500/20 text-red-400",
  cancelled: "bg-slate-800 text-slate-500",
};
function ScheduledView({ toast }) {
  const [list, setList] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);
  const blank = { phone: "", contactName: "", name: "", message: "", templateId: "", scheduledAt: "" };
  const [form, setForm] = useState(blank);

  const load = useCallback(async () => {
    try { const [s, t] = await Promise.all([api("scheduled"), api("templates")]); setList(s); setTemplates(t); } catch { /* */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openNew() { setForm(blank); setOpen(true); }
  async function save() {
    if (!form.phone || !form.message || !form.scheduledAt) { toast("Destinatário, mensagem e data são obrigatórios.", "red"); return; }
    try {
      await api("scheduled", { method: "POST", body: { phoneE164: form.phone, contactName: form.contactName, name: form.name, message: form.message, templateId: form.templateId || null, scheduledAt: new Date(form.scheduledAt).toISOString() } });
      toast("Agendamento criado.", "indigo"); setOpen(false); await load();
    } catch (e) { toast("Erro: " + e.message, "red"); }
  }
  async function cancel(id) { try { await api(`scheduled/${id}/cancel`, { method: "POST" }); toast("Agendamento cancelado.", "slate"); await load(); } catch (e) { toast("Erro: " + e.message, "red"); } }
  async function del(id) { if (!confirm("Excluir este agendamento?")) return; try { await api(`scheduled/${id}`, { method: "DELETE" }); await load(); } catch (e) { toast("Erro: " + e.message, "red"); } }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Agendamentos</h1>
          <p className="text-sm text-slate-500 mt-1">Mensagens únicas agendadas para uma data e hora específicas.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm transition-colors"><Plus className="h-4 w-4" /> Novo Agendamento</button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-800/50 text-xs font-semibold text-slate-400 border-b border-slate-700 px-4 py-3">
          <div className="col-span-3">Destinatário</div>
          <div className="col-span-4">Mensagem</div>
          <div className="col-span-2">Data / Hora</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Ações</div>
        </div>
        {list.length === 0 && <div className="px-4 py-10 text-center text-slate-500 text-sm">Nenhum agendamento criado</div>}
        {list.map((c) => (
          <div key={c._id} className="grid grid-cols-12 border-b border-slate-800 px-4 py-3 text-sm hover:bg-slate-800/20 transition-colors items-center">
            <div className="col-span-3">
              <div className="font-medium text-white">{c.contactName || c.name || "—"}</div>
              <div className="text-xs text-slate-500 font-mono">{c.phoneE164}</div>
              {c.templateId && <div className="text-xs text-brand-400 mt-0.5">Template: {c.templateId.name}</div>}
            </div>
            <div className="col-span-4 text-slate-400 text-xs pr-3 line-clamp-2">{c.message}</div>
            <div className="col-span-2 text-xs text-slate-400">{new Date(c.scheduledAt).toLocaleString("pt-BR")}</div>
            <div className="col-span-1"><span className={cn("px-2 py-1 rounded-full text-xs font-medium", SCHED_STATUS[c.status] || "bg-slate-700 text-slate-400")}>{c.status}</span></div>
            <div className="col-span-2 flex gap-1">
              {(c.status === "pending" || c.status === "queued") && <button onClick={() => cancel(c._id)} className="p-1.5 rounded-lg border border-amber-900/50 hover:bg-amber-500/10 text-amber-600 hover:text-amber-400 transition-colors" title="Cancelar"><X className="h-3.5 w-3.5" /></button>}
              <button onClick={() => del(c._id)} className="p-1.5 rounded-lg border border-red-900/50 hover:bg-red-500/10 text-red-600 hover:text-red-400 transition-colors" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} title="Novo Agendamento" onClose={() => setOpen(false)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-3xl">
          <div className="space-y-4">
            <Field label="Destinatário *"><ContactPicker value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} onPickContact={(c) => setForm((f) => ({ ...f, phone: c.phone || "", contactName: c.name || "" }))} /></Field>
            <Field label="Descrição (opcional)"><input className={INPUT} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Lembrete para João" /></Field>
            <Field label="Template (opcional)">
              <select className={SELECT} value={form.templateId} onChange={(e) => { const t = templates.find((x) => x._id === e.target.value); setForm((f) => ({ ...f, templateId: e.target.value, message: t ? t.body : f.message })); }}>
                <option value="">Sem template</option>
                {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Data e hora *"><input type="datetime-local" className={INPUT} value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} /></Field>
          </div>
          <div className="space-y-4">
            <Field label="Mensagem *"><textarea className={cn(INPUT, "min-h-[180px] resize-y")} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Texto da mensagem..." /></Field>
            <button onClick={save} className="w-full rounded-xl bg-brand-600 hover:bg-brand-500 text-white py-2.5 font-medium text-sm transition-colors">Agendar mensagem</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TELA: ESTEIRA (pipeline)  — abas: Esteira / Semanas / Onboarding
   ════════════════════════════════════════════════════════════════════ */
const PIPE_STATUS = {
  onboarding: { label: "Onboarding", color: "bg-purple-500/20 text-purple-400" },
  week1: { label: "Semana 1", color: "bg-brand-500/20 text-brand-400" },
  week2: { label: "Semana 2", color: "bg-blue-500/20 text-blue-400" },
  week3: { label: "Semana 3", color: "bg-cyan-500/20 text-cyan-400" },
  renewed: { label: "Renovado", color: "bg-emerald-500/20 text-emerald-400" },
  ended: { label: "Encerrado", color: "bg-slate-700 text-slate-500" },
};
function PipelineView({ toast }) {
  const [tab, setTab] = useState("esteira"); // esteira | semanas | onboarding
  const [contacts, setContacts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [onb, setOnb] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ phone: "", name: "" });
  const importRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [c, m, pc, oc] = await Promise.all([api("pipeline/contacts"), api("pipeline/metrics"), api("pipeline/config"), api("onboarding/config")]);
      setContacts(c); setMetrics(m); setCfg(pc); setOnb(oc);
    } catch { /* */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function addToPipeline() {
    if (!form.phone) { toast("Informe o número.", "red"); return; }
    try { await api("pipeline/contacts", { method: "POST", body: { phoneE164: form.phone, name: form.name } }); toast("Cliente adicionado à esteira.", "indigo"); setOpen(false); setForm({ phone: "", name: "" }); await load(); }
    catch (e) { toast("Erro: " + e.message, "red"); }
  }
  async function renew(id) { try { await api(`pipeline/contacts/${id}/renew`, { method: "POST" }); toast("Cliente renovado.", "emerald"); await load(); } catch (e) { toast("Erro: " + e.message, "red"); } }
  async function end(id) { try { await api(`pipeline/contacts/${id}/end`, { method: "POST" }); toast("Cliente encerrado.", "slate"); await load(); } catch (e) { toast("Erro: " + e.message, "red"); } }
  async function del(id) { if (!confirm("Remover da esteira?")) return; try { await api(`pipeline/contacts/${id}`, { method: "DELETE" }); await load(); } catch (e) { toast("Erro: " + e.message, "red"); } }

  async function saveCfg() { try { await api("pipeline/config", { method: "PUT", body: cfg }); toast("Mensagens das semanas salvas.", "indigo"); } catch (e) { toast("Erro: " + e.message, "red"); } }
  async function saveOnb() { try { await api("onboarding/config", { method: "PUT", body: onb }); toast("Onboarding salvo.", "indigo"); } catch (e) { toast("Erro: " + e.message, "red"); } }

  function exportJson() {
    const blob = new Blob([JSON.stringify(contacts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `esteira-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast(`Backup de ${contacts.length} item(ns) baixado!`, "emerald");
  }
  async function importJson(e) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const items = JSON.parse(await file.text());
      const res = await api("pipeline/contacts/import", { method: "POST", body: items });
      toast(`Importação concluída: ${res.inserted} adicionado(s), ${res.updated} atualizado(s)`, "indigo");
      await load();
    } catch { toast("Arquivo inválido. Selecione um backup .json válido.", "red"); }
    finally { e.target.value = ""; }
  }

  const onbSteps = onb?.steps || [];
  function updateStep(i, patch) { const steps = [...onbSteps]; steps[i] = { ...steps[i], ...patch }; setOnb((o) => ({ ...o, steps })); }
  function addStep() { setOnb((o) => ({ ...o, steps: [...(o.steps || []), { order: (o.steps?.length || 0) + 1, type: "text", content: "", mediaUrl: "", delayAfterPrev: 0 }] })); }
  function removeStep(i) { setOnb((o) => ({ ...o, steps: o.steps.filter((_, idx) => idx !== i) })); }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Esteira de Produção</h1>
          <p className="text-sm text-slate-500 mt-0.5">Onboarding → Semana 1 → 2 → 3 → Dia 30</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => importRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors border border-slate-700"><Upload className="h-4 w-4" /> Importar</button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importJson} />
          <button onClick={exportJson} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors border border-slate-700"><Download className="h-4 w-4" /> Backup</button>
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm transition-colors"><Plus className="h-4 w-4" /> Adicionar à Esteira</button>
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[["onboarding", metrics.onboarding], ["week1", metrics.week1], ["week2", metrics.week2], ["week3", metrics.week3], ["renewed", metrics.renewed], ["ended", metrics.ended]].map(([k, v]) => (
            <div key={k} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-white">{v || 0}</div>
              <div className="text-xs text-slate-500">{PIPE_STATUS[k].label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-800 pb-2">
        {[["esteira", "Esteira"], ["semanas", "Mensagens das Semanas"], ["onboarding", "Onboarding"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors", tab === k ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white")}>{l}</button>
        ))}
      </div>

      {tab === "esteira" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 bg-slate-800/50 text-xs font-semibold text-slate-400 border-b border-slate-700 px-4 py-3">
            <div className="col-span-3">Cliente</div><div className="col-span-2">WhatsApp</div><div className="col-span-2">Status</div><div className="col-span-2">Entrou em</div><div className="col-span-3">Ações</div>
          </div>
          {contacts.length === 0 && <div className="py-10 text-center text-slate-500 text-sm">Nenhum cliente na esteira</div>}
          {contacts.map((c) => {
            const st = PIPE_STATUS[c.status] || PIPE_STATUS.ended;
            return (
              <div key={c._id} className="grid grid-cols-12 border-b border-slate-800 px-4 py-3 text-sm hover:bg-slate-800/20 transition-colors items-center">
                <div className="col-span-3 font-medium text-white">{c.name || "Sem nome"}</div>
                <div className="col-span-2 text-slate-400 font-mono text-xs">{c.phoneE164}</div>
                <div className="col-span-2 text-xs"><span className={cn("px-2 py-1 rounded-full font-medium", st.color)}>{st.label}</span></div>
                <div className="col-span-2 text-xs text-slate-500">{new Date(c.enteredAt).toLocaleDateString("pt-BR")}</div>
                <div className="col-span-3 flex gap-1.5">
                  <button onClick={() => renew(c._id)} className="text-xs px-2 py-1 rounded-lg border border-emerald-900/50 hover:bg-emerald-500/10 text-emerald-400 transition-colors">Renovar</button>
                  <button onClick={() => end(c._id)} className="text-xs px-2 py-1 rounded-lg border border-slate-700 hover:bg-slate-700 text-slate-400 transition-colors">Encerrar</button>
                  <button onClick={() => del(c._id)} className="text-xs px-2 py-1 rounded-lg border border-red-900/50 hover:bg-red-500/10 text-red-400 transition-colors">Remover</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "semanas" && cfg && (
        <div className="space-y-4 max-w-2xl">
          {(cfg.weeks || []).map((w, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">Semana {w.week} (dia {w.dayTrigger})</div>
                <input type="time" className={cn(INPUT, "w-32")} value={w.sendTime} onChange={(e) => { const weeks = [...cfg.weeks]; weeks[i] = { ...weeks[i], sendTime: e.target.value }; setCfg((c) => ({ ...c, weeks })); }} />
              </div>
              <textarea className={cn(INPUT, "min-h-[80px] resize-y")} value={w.message} onChange={(e) => { const weeks = [...cfg.weeks]; weeks[i] = { ...weeks[i], message: e.target.value }; setCfg((c) => ({ ...c, weeks })); }} placeholder={`Ex: Olá {{nome}}! Chegou a semana ${w.week} do seu plano. Aproveite ao máximo!`} />
            </div>
          ))}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-2">
            <div className="text-sm font-semibold text-white">Mensagem de renovação</div>
            <textarea className={cn(INPUT, "min-h-[80px] resize-y")} value={cfg.renewalMessage || ""} onChange={(e) => setCfg((c) => ({ ...c, renewalMessage: e.target.value }))} placeholder="Olá {{nome}}! Sua jornada terminou — bora renovar?" />
          </div>
          <button onClick={saveCfg} className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white py-2.5 px-6 font-medium text-sm transition-colors">Salvar mensagens</button>
        </div>
      )}

      {tab === "onboarding" && onb && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
            <div>
              <div className="text-sm font-medium text-white">Onboarding ativo</div>
              <div className="text-xs text-slate-500">Dispara a sequência abaixo após o cadastro.</div>
            </div>
            <button onClick={() => setOnb((o) => ({ ...o, active: !o.active }))} className={cn("relative w-12 h-6 rounded-full transition-colors", onb.active ? "bg-brand-600" : "bg-slate-600")}>
              <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow", onb.active ? "left-7" : "left-1")} />
            </button>
          </div>
          <Field label="Delay após cadastro (minutos)"><input type="number" min="0" className={cn(INPUT, "w-40")} value={onb.delayMin ?? 30} onChange={(e) => setOnb((o) => ({ ...o, delayMin: Number(e.target.value) }))} /></Field>
          <div className="text-sm font-medium text-white">Sequência de mensagens</div>
          {onbSteps.map((s, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">Passo {i + 1}</div>
                <button onClick={() => removeStep(i)} className="text-slate-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="flex gap-2">
                <select className={cn(SELECT, "w-36 text-sm py-1")} value={s.type} onChange={(e) => updateStep(i, { type: e.target.value })}>
                  <option value="text">Texto</option><option value="image">Imagem</option><option value="video">Vídeo</option><option value="document">Documento</option>
                </select>
                <input type="number" min="0" className={cn(INPUT, "w-32")} value={s.delayAfterPrev} onChange={(e) => updateStep(i, { delayAfterPrev: Number(e.target.value) })} placeholder="Delay (min)" />
              </div>
              <textarea className={cn(INPUT, "min-h-[70px] resize-y")} value={s.content} onChange={(e) => updateStep(i, { content: e.target.value })} placeholder="Texto da mensagem" />
              {s.type !== "text" && <input className={INPUT} value={s.mediaUrl} onChange={(e) => updateStep(i, { mediaUrl: e.target.value })} placeholder="URL da mídia" />}
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={addStep} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-colors"><Plus className="h-4 w-4" /> Adicionar passo</button>
            <button onClick={saveOnb} className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white py-2 px-6 font-medium text-sm transition-colors">Salvar onboarding</button>
          </div>
        </div>
      )}

      <Modal open={open} title="Adicionar à Esteira" onClose={() => setOpen(false)}>
        <div className="space-y-4 max-w-md">
          <Field label="WhatsApp *"><ContactPicker value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} onPickContact={(c) => setForm((f) => ({ ...f, phone: c.phone || "", name: c.name || "" }))} /></Field>
          <Field label="Nome (opcional)"><input className={INPUT} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <div className="flex gap-3 pt-1">
            <button onClick={addToPipeline} className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-500 text-white py-2.5 font-medium text-sm transition-colors">Adicionar</button>
            <button onClick={() => setOpen(false)} className="px-4 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm transition-colors">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TELA: ASSINATURAS (subs)
   ════════════════════════════════════════════════════════════════════ */
function SubscriptionsView() {
  const [m, setM] = useState(null);
  const [notif, setNotif] = useState(() => {
    try { const c = localStorage.getItem("autoflow_notif_texts"); if (c) return JSON.parse(c); } catch { /* */ }
    return { d7: "Olá {{nome}}! Sua assinatura vence em 7 dias.", d1: "Atenção {{nome}}! Sua assinatura vence amanhã.", d0: "Olá {{nome}}! Sua assinatura expira hoje." };
  });
  const [view, setView] = useState("expiring");
  const [rows, setRows] = useState([]);

  useEffect(() => { api("subscriptions/metrics").then(setM).catch(() => {}); }, []);
  useEffect(() => {
    const ep = view === "expiring" ? "subscriptions/expiring?days=30" : "subscriptions/expired";
    api(ep).then(setRows).catch(() => setRows([]));
  }, [view]);

  function saveNotif() { localStorage.setItem("autoflow_notif_texts", JSON.stringify(notif)); }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-slate-400" />
        <h1 className="text-xl font-bold text-white">Assinaturas</h1>
      </div>

      {m && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[["Total", m.total, "border-slate-700 text-slate-300"], ["Ativos", m.active, "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"], ["Vencendo 7d", m.expiring7dCount, "border-amber-500/50 text-amber-400 bg-amber-500/10"], ["Vence Hoje", m.expiringTodayCount, "border-amber-500/50 text-amber-400 bg-amber-500/10"], ["Vencidos", m.expired, "border-red-500/50 text-red-400 bg-red-500/10"]].map(([l, v, cls], i) => (
            <div key={i} className={cn("rounded-2xl border p-4", cls)}>
              <div className="text-2xl font-bold">{v ?? 0}</div>
              <div className="text-xs mt-0.5 opacity-80">{l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="text-sm font-semibold text-white">Textos de Aviso de Vencimento</div>
        <Field label="7 dias antes"><input className={INPUT} value={notif.d7} onChange={(e) => setNotif((n) => ({ ...n, d7: e.target.value }))} /></Field>
        <Field label="1 dia antes"><input className={INPUT} value={notif.d1} onChange={(e) => setNotif((n) => ({ ...n, d1: e.target.value }))} /></Field>
        <Field label="No dia"><input className={INPUT} value={notif.d0} onChange={(e) => setNotif((n) => ({ ...n, d0: e.target.value }))} /></Field>
        <button onClick={saveNotif} className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white py-2 px-5 font-medium text-sm transition-colors">Salvar textos</button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setView("expiring")} className={cn("px-4 py-2 rounded-xl text-sm font-medium border transition-colors", view === "expiring" ? "bg-amber-600/20 border-amber-500 text-amber-400" : "border-slate-700 text-slate-400")}>Vencendo em 30d</button>
        <button onClick={() => setView("expired")} className={cn("px-4 py-2 rounded-xl text-sm font-medium border transition-colors", view === "expired" ? "bg-red-600/20 border-red-500 text-red-400" : "border-slate-700 text-slate-400")}>Vencidos ({m?.expired ?? 0})</button>
      </div>
      <div className="space-y-2">
        {rows.length === 0 && <div className="text-slate-500 text-sm">Nenhum cliente nesta lista.</div>}
        {rows.map((c) => (
          <div key={c._id} className="flex items-center justify-between bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 rounded-xl px-4 py-3">
            <div>
              <div className="text-sm font-medium text-white">{c.name || "Sem nome"}</div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">{c.phoneE164}</div>
            </div>
            <div className="text-xs text-slate-400">{c.subscriptionEnd ? new Date(c.subscriptionEnd).toLocaleDateString("pt-BR") : "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TELA: AUDITORIA (audit)
   ════════════════════════════════════════════════════════════════════ */
function AuditView() {
  const [list, setList] = useState([]);
  useEffect(() => { api("audit").then(setList).catch(() => {}); }, []);
  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold text-white">Auditoria</h1>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-800/50 text-xs font-semibold text-slate-400 border-b border-slate-700 px-4 py-3">
          <div className="col-span-2">Quando</div><div className="col-span-2">Quem</div><div className="col-span-2">Ação</div><div className="col-span-5">Detalhe</div><div className="col-span-1">OK</div>
        </div>
        {list.length === 0 && <div className="px-4 py-10 text-center text-slate-500 text-sm">Sem registros.</div>}
        {list.map((c) => (
          <div key={c._id} className="grid grid-cols-12 border-b border-slate-800 px-4 py-2.5 text-xs hover:bg-slate-800/20 items-center">
            <div className="col-span-2 text-slate-400">{new Date(c.at).toLocaleString("pt-BR")}</div>
            <div className="col-span-2 text-slate-300 truncate">{c.who}</div>
            <div className="col-span-2 text-brand-300 font-mono">{c.action}</div>
            <div className="col-span-5 text-slate-400 truncate">{c.detail}</div>
            <div className="col-span-1">{c.ok === false ? <span className="text-red-400">✗</span> : <span className="text-emerald-400">✓</span>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TELA: WHATSAPP (whatsapp) — status + QR + contatos
   ════════════════════════════════════════════════════════════════════ */
function WhatsAppView() {
  const [st, setSt] = useState({ status: "starting", qr: null });
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const s = await api("whatsapp/status");
        let qr = s.qr || null;
        if (s.status === "qr" && !qr) { try { const q = await api("whatsapp/qr"); qr = q.qr || null; } catch { /* */ } }
        if (alive) setSt({ status: s.status, qr });
      } catch { if (alive) setSt({ status: "disconnected", qr: null }); }
    }
    poll();
    const id = setInterval(poll, 4000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    if (st.status !== "connected") return;
    api("whatsapp/contacts?limit=1000").then((d) => setContacts(Array.isArray(d) ? d : [])).catch(() => {});
  }, [st.status]);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Conexão WhatsApp</h1>
        <p className="text-sm text-slate-500 mt-1">Escaneie o QR Code para conectar a instância.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-white">Status da conexão</div>
            <StatusDot status={st.status} />
          </div>
          {st.status === "connected"
            ? <div className="text-sm font-medium text-emerald-400">WhatsApp conectado! Pronto para enviar mensagens.</div>
            : st.status === "qr"
              ? <div className="text-sm text-slate-400">QR Code disponível ao lado. Escaneie com o WhatsApp.</div>
              : <div className="text-sm text-slate-400">Aguardando conexão...</div>}
          <div className="text-xs text-slate-500 mt-3">WhatsApp → Dispositivos conectados → Conectar dispositivo</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="font-semibold text-white mb-4">QR Code</div>
          <div className="bg-white rounded-2xl flex items-center justify-center aspect-square max-w-[260px] mx-auto overflow-hidden">
            {st.qr
              ? <img src={st.qr} alt="QR Code" className="w-full h-full object-contain" />
              : <div className="text-center text-slate-600 p-6">
                  {st.status === "connected"
                    ? <><CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" /><div className="text-sm">Conectado!</div></>
                    : <div className="text-sm">Aguardando QR...</div>}
                </div>}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 text-xs text-slate-500">Contatos do WhatsApp conectado</div>
        <div className="grid grid-cols-6 bg-slate-800/50 text-xs font-semibold text-slate-400 border-b border-slate-700 px-4 py-3">
          <div className="col-span-3">Nome</div><div className="col-span-3">WhatsApp</div>
        </div>
        {contacts.length === 0 && <div className="px-4 py-8 text-center text-slate-500 text-sm">{st.status === "connected" ? "Nenhum contato carregado." : "Conecte o WhatsApp para ver contatos."}</div>}
        {contacts.slice(0, 200).map((c, i) => (
          <div key={(c.phone || "") + i} className="grid grid-cols-6 border-b border-slate-800 px-4 py-2.5 text-sm items-center">
            <div className="col-span-3 text-white truncate">{c.name && c.name.trim() ? c.name : "(sem nome)"}{c.uncertain ? <span className="ml-1.5 text-amber-400 text-xs">• incerto</span> : null}</div>
            <div className="col-span-3 text-slate-400 font-mono text-xs">{c.phone}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   LOGIN (`Sm` no bundle)
   ════════════════════════════════════════════════════════════════════ */
function Login({ onLogged }) {
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("Admin#123456");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault(); setErr(""); setLoading(true);
    try { const r = await api("auth/login", { method: "POST", body: { email, password } }); setToken(r.token); onLogged(r.user); }
    catch { setErr("Credenciais inválidas"); }
    finally { setLoading(false); }
  }
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-premium"><MessageCircle className="h-5 w-5 text-white" /></div>
          <div><div className="flex items-center gap-2"><span className="font-bold text-white">AutoFlow</span><PremiumBadge /></div><div className="text-xs text-slate-500">WhatsApp Manager</div></div>
        </div>
        <Field label="Email"><input type="email" autoComplete="email" className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Senha"><input type="password" autoComplete="current-password" className={INPUT} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {err && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-red-400">{err}</div>}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white py-2.5 font-medium text-sm flex items-center justify-center gap-2 transition-colors">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SHELL + ROOT
   ════════════════════════════════════════════════════════════════════ */
const NAV = [
  { key: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { key: "contacts", label: "Clientes", icon: Users },
  { key: "pipeline", label: "Esteira", icon: Workflow },
  { key: "recurring", label: "Automações", icon: Repeat, badgeKey: "recurringActive" },
  { key: "autoReply", label: "Respostas Auto", icon: MessageSquareReply },
  { key: "templates", label: "Agendamentos", icon: CalendarClock },
  { key: "tpl", label: "Templates", icon: FileText },
  { key: "audit", label: "Auditoria", icon: ScrollText },
  { key: "subs", label: "Assinaturas", icon: CreditCard },
  { key: "backup", label: "Backup", icon: Database, href: "/backup.html" },
  { key: "conta", label: "Conta", icon: UserIcon, href: "/conta.html" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
];

function Shell({ user, onLogout }) {
  const [screen, setScreen] = useState("dashboard");
  const [summary, setSummary] = useState({});
  const [waStatus, setWaStatus] = useState("starting");
  const [toast, showToast] = useToast();

  useEffect(() => { api("dashboard").then(setSummary).catch(() => {}); }, [screen]);
  useEffect(() => {
    let alive = true;
    async function poll() { try { const s = await api("whatsapp/status"); if (alive) setWaStatus(s.status); } catch { if (alive) setWaStatus("disconnected"); } }
    poll(); const id = setInterval(poll, 8000); return () => { alive = false; clearInterval(id); };
  }, []);

  function go(key) {
    const item = NAV.find((n) => n.key === key);
    if (item?.href) { window.location.href = item.href; return; }
    setScreen(key);
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex">
      <Toast toast={toast} />
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-brand-900/40 bg-slate-900/40 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-premium"><MessageCircle className="h-5 w-5 text-white" /></div>
            <div><div className="flex items-center gap-2"><span className="font-bold text-white text-sm">AutoFlow</span><PremiumBadge /></div><div className="text-xs text-slate-500">WhatsApp Manager</div></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-auto">
          {NAV.map((n) => (
            <NavItem key={n.key} icon={n.icon} label={n.label} active={screen === n.key} onClick={() => go(n.key)} badge={n.badgeKey ? summary[n.badgeKey] || null : null} />
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className="bg-slate-800/60 rounded-xl px-3 py-2 flex items-center justify-between">
            <div><div className="text-xs text-slate-500">WhatsApp</div><div className="text-xs font-medium text-slate-300 mt-0.5">Instância default</div></div>
            <StatusDot status={waStatus} />
          </div>
          <div className="bg-slate-800/60 rounded-xl px-3 py-2">
            <div className="text-xs text-slate-500">Logado como</div>
            <div className="text-xs font-medium text-slate-300 mt-0.5 truncate">{user.email}</div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-sm py-2 transition-colors">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto">
        {screen === "dashboard" && <DashboardView onNavigate={go} />}
        {screen === "contacts" && <ContactsView toast={showToast} />}
        {screen === "pipeline" && <PipelineView toast={showToast} />}
        {screen === "recurring" && <RecurringView toast={showToast} />}
        {screen === "autoReply" && <AutoReplyView toast={showToast} />}
        {screen === "templates" && <ScheduledView toast={showToast} />}
        {screen === "tpl" && <TemplatesView toast={showToast} />}
        {screen === "audit" && <AuditView />}
        {screen === "subs" && <SubscriptionsView />}
        {screen === "whatsapp" && <WhatsAppView />}
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // valida o token existente tentando uma chamada autenticada
  useEffect(() => {
    let alive = true;
    (async () => {
      try { await api("dashboard"); if (alive) setUser({ email: "—", role: "admin" }); }
      catch { clearToken(); }
      finally { if (alive) setBooting(false); }
    })();
    return () => { alive = false; };
  }, []);

  function logout() { clearToken(); setUser(null); }

  if (booting) {
    return <div className="min-h-screen bg-transparent flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-400" /></div>;
  }
  if (!user) return <Login onLogged={setUser} />;
  return <Shell user={user} onLogout={logout} />;
}
