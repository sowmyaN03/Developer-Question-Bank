import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code2,
  Download,
  ExternalLink,
  FileWarning,
  Filter,
  History,
  Layers3,
  Library as LibraryIcon,
  ListChecks,
  Menu,
  Play,
  Plus,
  Repeat2,
  Search,
  Settings2,
  Sparkles,
  Target,
  Terminal,
  Trophy,
  X,
  Youtube,
  Zap,
} from 'lucide-react';
import {
  Link,
  Route,
  Switch,
  Router as WouterRouter,
  useLocation,
  useParams,
} from 'wouter';
import questionData from './questions.json';

const queryClient = new QueryClient();

type Question = {
  id: string;
  subject: string;
  topic: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  verified: boolean;
  duplicateCount: number;
  sourceRefs: string[];
};

type Attempt = {
  id: string;
  mode: 'practice' | 'exam';
  subject: string;
  score: number;
  total: number;
  completedAt: string;
  topicBreakdown: Record<string, { correct: number; total: number }>;
  answers: Record<string, number>;
};

type ExamConfig = {
  subjects: string[];
  questionCount: number;
  difficulty: string;
  mode: 'timed' | 'untimed';
};

const seedQuestions: Question[] = (questionData.questions as Question[]).map((question, index) => ({ ...question, id: `${question.id}-${index}` }));
const unverifiedQuestions: Question[] = (questionData.unverified as Question[]).map((question, index) => ({ ...question, id: `${question.id}-review-${index}` }));
const sourceMeta = questionData.meta;
/*
 * The PDF contains several incompatible question formats. The extraction
 * script keeps complete, answerable MCQs in the library and routes incomplete
 * or single-answer records to the review queue.
 */
const importedQuestionCount = sourceMeta.dedupedItems;
const importedVerifiedCount = sourceMeta.verifiedItems;
const importedReviewCount = sourceMeta.unverifiedItems;
const subjects = ['All subjects', ...Array.from(new Set(seedQuestions.map((q) => q.subject)))];

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) as T : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue] as const;
}

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { href: '/', label: 'Overview', icon: BarChart3 },
    { href: '/library', label: 'Question library', icon: LibraryIcon },
    { href: '/repeated', label: 'Repeated questions', icon: Repeat2 },
    { href: '/unverified', label: 'Needs review', icon: FileWarning },
    { href: '/generate-exam', label: 'Generate exam', icon: Sparkles },
    { href: '/progress', label: 'Progress & history', icon: History },
    { href: '/export', label: 'Export bank', icon: Download },
  ];
  return (
    <div className="min-h-[100dvh] bg-[#080b12] text-[#e5eaf0]">
      <aside className={cn('fixed inset-y-0 left-0 z-30 flex w-[252px] flex-col border-r border-[#1d2634] bg-[#0b1019] px-4 py-5 transition-transform duration-200 lg:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="mb-8 flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#57e0ba] text-[#07120f] shadow-[0_0_24px_rgba(87,224,186,.12)]"><Terminal size={19} strokeWidth={2.5} /></span>
            <span><span className="block font-mono text-[16px] font-medium tracking-[-0.04em] text-[#eef7f4]">devbank</span><span className="block text-[9px] uppercase tracking-[.22em] text-[#5f7182]">study workspace</span></span>
          </Link>
          <button className="rounded-md p-1 text-[#77889b] hover:bg-[#17202d] lg:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-menu"><X size={17} /></button>
        </div>
        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#526276]">Workspace</div>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={cn('group flex items-center gap-3 rounded-md px-3 py-2.5 text-[12px] font-semibold transition-colors', location === href ? 'bg-[#17252a] text-[#75e5c3]' : 'text-[#8795a5] hover:bg-[#131b27] hover:text-[#dce7e5]')} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon size={16} strokeWidth={1.8} /><span>{label}</span>{location === href && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#57e0ba]" />}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-lg border border-[#1d2a35] bg-[#0f171f] p-3.5">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#6e8190]"><Zap size={13} className="text-[#e3b660]" /> Study signal</div>
          <p className="text-[12px] leading-5 text-[#a5b2bd]">You have <span className="font-semibold text-[#e4ede9]">3 weak topics</span> ready for a focused session.</p>
          <Link href="/generate-exam" className="mt-3 flex items-center justify-between border-t border-[#1d2a35] pt-3 text-[11px] font-bold text-[#61d9b7]" data-testid="link-sidebar-start">Build a focused exam <ArrowRight size={14} /></Link>
        </div>
        <div className="mt-4 flex items-center gap-2 px-2 text-[11px] text-[#617182]"><span className="h-2 w-2 rounded-full bg-[#57e0ba]" /> Local workspace <span className="ml-auto font-mono text-[10px]">v0.8</span></div>
      </aside>
      {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-20 bg-[#030509]/70 lg:hidden" onClick={() => setMobileOpen(false)} data-testid="button-overlay-menu" />}
      <main className="min-h-[100dvh] lg:pl-[252px]">
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-[#1b2430] bg-[#080b12]/95 px-5 backdrop-blur lg:px-9">
          <button className="rounded-md p-2 text-[#9aacba] hover:bg-[#151d29] lg:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu size={20} /></button>
          <div className="hidden items-center gap-2 text-[11px] text-[#627284] sm:flex"><span className="font-mono text-[#8b9aa8]">⌘ K</span><span>Quick find anything</span></div>
          <div className="ml-auto flex items-center gap-4"><div className="hidden text-right sm:block"><div className="text-[11px] font-bold text-[#cdd7df]">My study desk</div><div className="font-mono text-[10px] text-[#607182]">offline-first</div></div><div className="grid h-8 w-8 place-items-center rounded-full border border-[#2b4a4a] bg-[#122b2a] font-mono text-[11px] font-bold text-[#69dfbe]">AK</div></div>
        </header>
        <div className="mx-auto max-w-[1420px] px-5 py-7 lg:px-9 lg:py-9">{children}</div>
      </main>
    </div>
  );
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 border-b border-[#1d2634] pb-7 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-2 font-mono text-[10px] uppercase tracking-[.22em] text-[#61cdb0]">{eyebrow}</div><h1 className="text-[28px] font-extrabold tracking-[-.045em] text-[#edf2f1] sm:text-[34px]">{title}</h1><p className="mt-2 max-w-[660px] text-[13px] leading-6 text-[#7e8d9d]">{description}</p></div>{action}</div>;
}

function StatCard({ label, value, detail, accent = 'teal', icon: Icon }: { label: string; value: string; detail: string; accent?: string; icon: typeof BarChart3 }) {
  return <div className="panel group relative overflow-hidden p-4"><div className={cn('absolute left-0 top-0 h-full w-[2px]', accent === 'amber' ? 'bg-[#e3b660]' : accent === 'red' ? 'bg-[#e06b72]' : 'bg-[#57e0ba]')} /><div className="mb-5 flex items-start justify-between"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6e7e8f]">{label}</span><Icon size={15} className={accent === 'amber' ? 'text-[#e3b660]' : accent === 'red' ? 'text-[#e06b72]' : 'text-[#57e0ba]'} /></div><div className="font-mono text-[27px] font-medium tracking-[-.05em] text-[#ebf2ef]">{value}</div><div className="mt-1 text-[11px] text-[#718394]">{detail}</div></div>;
}

function ProgressBar({ value, color = 'teal' }: { value: number; color?: string }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-[#202a35]"><div className={cn('h-full rounded-full transition-all', color === 'amber' ? 'bg-[#d9ab54]' : color === 'red' ? 'bg-[#dc6d78]' : 'bg-[#54d4b2]')} style={{ width: `${Math.min(100, value)}%` }} /></div>;
}

function Dashboard({ attempts }: { attempts: Attempt[] }) {
  const completed = attempts.reduce((sum, a) => sum + a.total, 0);
  const correct = attempts.reduce((sum, a) => sum + a.score, 0);
  const accuracy = completed ? Math.round((correct / completed) * 100) : 0;
  const recent = attempts.slice(0, 4);
  return <div className="animate-in">
    <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#63d5b5]"><span className="h-1.5 w-1.5 rounded-full bg-[#63d5b5]" /> Tuesday, October 08</div><h1 className="max-w-[700px] text-[35px] font-extrabold leading-[1.07] tracking-[-.06em] text-[#eff4f2] sm:text-[47px]">Keep the signal.<br /><span className="text-[#718495]">Cut the noise.</span></h1><p className="mt-4 max-w-[510px] text-[13px] leading-6 text-[#8493a1]">A source-derived question bank for the moments that decide technical interviews. Your next sharp edge is waiting below.</p></div><Link href="/generate-exam" className="button-primary self-start xl:self-end" data-testid="link-build-exam"><Sparkles size={15} /> Build a custom exam <ArrowRight size={15} /></Link></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Questions indexed" value={String(importedQuestionCount)} detail={`${importedVerifiedCount} verified · Angular excluded`} icon={LibraryIcon} /><StatCard label="Study accuracy" value={`${accuracy}%`} detail={attempts.length ? `${attempts.length} completed sessions` : 'Start a session to set baseline'} icon={Target} /><StatCard label="Needs attention" value={String(importedReviewCount).padStart(2, '0')} detail="incomplete / single-answer items" accent="amber" icon={AlertTriangle} /><StatCard label="Current streak" value="04 days" detail="last active yesterday" icon={Trophy} /></div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <section className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-[#1d2935] px-5 py-4"><div><h2 className="text-[14px] font-bold text-[#e1e9e7]">Today’s focus</h2><p className="mt-1 text-[11px] text-[#718192]">Short sessions compound into recall.</p></div><Link href="/library" className="text-[11px] font-bold text-[#62d7b6]" data-testid="link-focus-library">View library <ChevronRight size={13} className="inline" /></Link></div><div className="grid divide-y divide-[#1d2935] md:grid-cols-3 md:divide-x md:divide-y-0"><FocusItem subject="JavaScript" topic="Async control flow" count="04 questions" color="teal" href="/practice/js-001" /><FocusItem subject="React" topic="Hooks & rendering" count="06 questions" color="amber" href="/practice/react-002" /><FocusItem subject="Algorithms" topic="Graph traversal" count="03 questions" color="blue" href="/practice/algo-002" /></div></section>
      <section className="panel"><div className="border-b border-[#1d2935] px-5 py-4"><h2 className="text-[14px] font-bold text-[#e1e9e7]">Topic pulse</h2><p className="mt-1 text-[11px] text-[#718192]">Based on your last 30 answers.</p></div><div className="space-y-5 p-5"><Pulse label="React / Hooks" value={72} color="teal" /><Pulse label="JS / Async" value={54} color="amber" /><Pulse label="CSS / Cascade" value={38} color="red" /><Pulse label="Algorithms / Graphs" value={81} color="blue" /></div></section>
    </div>
    <section className="mt-5"><div className="mb-3 flex items-end justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.18em] text-[#61d3b2]">Subject index</div><h2 className="mt-1 text-[18px] font-bold text-[#e2eae7]">Choose a question set</h2><p className="mt-1 text-[11px] text-[#718192]">Every subject is split into practice sets of no more than 30 questions.</p></div><Link href="/library" className="text-[11px] font-bold text-[#62d7b6]">All questions <ChevronRight size={13} className="inline" /></Link></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{subjects.slice(1).map((subject) => { const count = seedQuestions.filter((q) => q.subject === subject).length; return <Link key={subject} href={`/subject/${encodeURIComponent(subject)}`} className="panel group p-4 transition-colors hover:border-[#32695c]" data-testid={`link-subject-${subject.toLowerCase().replaceAll(' ', '-')}`}><div className="mb-5 flex items-start justify-between"><span className="grid h-8 w-8 place-items-center rounded-lg border border-[#234c48] bg-[#112522] text-[#61d7b5]"><BookOpen size={16} /></span><ArrowRight size={15} className="text-[#617486] transition-transform group-hover:translate-x-1" /></div><div className="text-[13px] font-bold text-[#dbe5e2]">{subject}</div><div className="mt-2 flex items-center gap-2 text-[10px] text-[#718394]"><span>{count} questions</span><span>·</span><span>{Math.max(1, Math.ceil(count / 30))} quiz sets</span></div></Link>; })}</div></section>
    <section className="panel mt-5"><div className="flex items-center justify-between border-b border-[#1d2935] px-5 py-4"><div><h2 className="text-[14px] font-bold text-[#e1e9e7]">Recent sessions</h2><p className="mt-1 text-[11px] text-[#718192]">Your latest practice signal.</p></div><Link href="/progress" className="text-[11px] font-bold text-[#62d7b6]" data-testid="link-recent-history">Full history <ChevronRight size={13} className="inline" /></Link></div>{recent.length ? <div className="divide-y divide-[#1d2935]">{recent.map((attempt) => <AttemptRow key={attempt.id} attempt={attempt} />)}</div> : <EmptyState icon={Clock3} title="No sessions yet" description="Take a practice question or build an exam. Your history will appear here." action={<Link href="/library" className="button-secondary" data-testid="link-empty-library">Open question library</Link>} />}</section>
  </div>;
}

function FocusItem({ subject, topic, count, color, href }: { subject: string; topic: string; count: string; color: string; href: string }) {
  return <Link href={href} className="block p-5 transition-colors hover:bg-[#111a24]" data-testid={`link-focus-${subject.toLowerCase()}`}><div className={cn('mb-8 h-7 w-7 rounded-md border', color === 'amber' ? 'border-[#53452c] bg-[#2a2115] text-[#dfb45f]' : color === 'blue' ? 'border-[#294a58] bg-[#12242d] text-[#6ac6e5]' : 'border-[#24534a] bg-[#112522] text-[#65d7b7]')}><Code2 size={14} className="m-1.5" /></div><div className="font-mono text-[10px] uppercase tracking-[.14em] text-[#718697]">{subject}</div><div className="mt-1 text-[13px] font-bold text-[#dbe4e1]">{topic}</div><div className="mt-2 flex items-center justify-between text-[11px] text-[#657687]"><span>{count}</span><ArrowRight size={13} /></div></Link>;
}

function Pulse({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><div className="mb-2 flex justify-between text-[11px]"><span className="text-[#adb9c2]">{label}</span><span className={color === 'amber' ? 'text-[#dcb15d]' : color === 'red' ? 'text-[#da7780]' : 'text-[#61d8b7]'}>{value}%</span></div><ProgressBar value={value} color={color === 'blue' ? 'teal' : color} /></div>;
}

function AttemptRow({ attempt }: { attempt: Attempt }) {
  return <div className="flex flex-wrap items-center gap-3 px-5 py-3.5"><div className="grid h-7 w-7 place-items-center rounded-md bg-[#142a29] text-[#63d7b5]"><CheckCircle2 size={15} /></div><div className="min-w-[130px] flex-1"><div className="text-[12px] font-bold text-[#d6e0de]">{attempt.mode === 'exam' ? 'Custom exam' : 'Practice session'} <span className="ml-1 font-mono text-[10px] font-normal text-[#617282]">/ {attempt.subject}</span></div><div className="mt-1 text-[10px] text-[#637486]">{new Date(attempt.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div></div><div className="w-28"><ProgressBar value={(attempt.score / attempt.total) * 100} /></div><div className="font-mono text-[12px] text-[#9aabb8]">{attempt.score}/{attempt.total}</div><div className={cn('rounded px-2 py-1 font-mono text-[10px]', attempt.score / attempt.total >= .7 ? 'bg-[#13302b] text-[#66d8b5]' : 'bg-[#34251b] text-[#dfb060]')}>{Math.round((attempt.score / attempt.total) * 100)}%</div></div>;
}

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof BookOpen; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center px-5 py-14 text-center"><div className="mb-4 grid h-11 w-11 place-items-center rounded-lg border border-[#27403d] bg-[#112421] text-[#61d6b5]"><Icon size={19} /></div><h3 className="text-[13px] font-bold text-[#dfe7e5]">{title}</h3><p className="mt-1 max-w-[360px] text-[11px] leading-5 text-[#718394]">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function Library({ onStart }: { onStart: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('All subjects');
  const [filter, setFilter] = useState('all');
  const [selectedText, setSelectedText] = useState('');
  const filtered = useMemo(() => seedQuestions.filter((q) => (subject === 'All subjects' || q.subject === subject) && (filter === 'all' || filter === 'verified' && q.verified || filter === 'repeated' && q.duplicateCount > 1) && `${q.text} ${q.topic} ${q.subject}`.toLowerCase().includes(query.toLowerCase())), [query, subject, filter]);
  const searchExternal = (site: 'chatgpt' | 'youtube') => { const term = selectedText || query; if (!term) return; window.open(site === 'chatgpt' ? `https://chatgpt.com/?q=${encodeURIComponent(term)}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`, '_blank', 'noopener,noreferrer'); };
  return <div className="animate-in"><PageTitle eyebrow="01 / source index" title="Question library" description="Search the complete bank, inspect provenance, and jump straight into a focused practice run." action={<Link href="/generate-exam" className="button-primary" data-testid="link-library-generate"><Sparkles size={15} /> Generate exam</Link>} /><div className="mb-5 flex flex-col gap-3 xl:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#607384]" size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} onMouseUp={() => setSelectedText(window.getSelection()?.toString() || '')} placeholder="Search questions, topics, or source references..." className="field pl-10" data-testid="input-library-search" /></div><div className="flex flex-wrap gap-2"><label className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6e8190]" size={14} /><select value={subject} onChange={(e) => setSubject(e.target.value)} className="field w-full appearance-none pl-9 pr-8 sm:w-[180px]" data-testid="select-library-subject">{subjects.map((s) => <option key={s}>{s}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6e8190]" size={14} /></label><select value={filter} onChange={(e) => setFilter(e.target.value)} className="field w-[144px]" data-testid="select-library-filter"><option value="all">All states</option><option value="verified">Verified only</option><option value="repeated">Repeated only</option></select></div></div>{selectedText && <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-[#29433f] bg-[#0f211f] px-3 py-2 text-[11px] text-[#a8bbb8]"><span className="font-mono text-[#61d5b4]">Selection tools</span><span className="max-w-[350px] truncate text-[#d5dfdd]">“{selectedText}”</span><button onClick={() => searchExternal('chatgpt')} className="tool-button ml-auto" data-testid="button-search-chatgpt"><Sparkles size={13} /> Ask ChatGPT</button><button onClick={() => searchExternal('youtube')} className="tool-button" data-testid="button-search-youtube"><Youtube size={14} /> YouTube</button></div>}<div className="mb-3 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.16em] text-[#607282]">{filtered.length} questions / indexed source</span><span className="text-[11px] text-[#607282]">Select text in a question to search it</span></div><div className="space-y-3">{filtered.map((q, index) => <QuestionCard key={`${q.id}-${index}`} question={q} index={index} onStart={onStart} />)}{!filtered.length && <div className="panel"><EmptyState icon={Search} title="No questions match that query" description="Try a broader topic, another subject, or clear the current filters." action={<button className="button-secondary" onClick={() => { setQuery(''); setSubject('All subjects'); setFilter('all'); }} data-testid="button-clear-library">Clear filters</button>} /></div>}</div></div>;
}

function SubjectPage({ onCreate }: { onCreate: (config: ExamConfig) => void }) {
  const params = useParams<{ subject: string }>();
  const subject = decodeURIComponent(params.subject || '');
  const items = seedQuestions.filter((question) => question.subject === subject);
  const sets = Array.from({ length: Math.ceil(items.length / 30) }, (_, index) => items.slice(index * 30, index * 30 + 30));
  return <div className="animate-in"><Link href="/" className="mb-7 inline-flex items-center gap-2 text-[11px] font-bold text-[#91a1ad] hover:text-[#dce8e4]" data-testid="link-all-subjects"><ArrowLeft size={14} /> All subjects</Link><section className="panel mb-7 p-5 sm:p-7"><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#24544d] bg-[#112a27] text-[#62d8b6]"><BookOpen size={21} /></span><div><h1 className="text-[24px] font-extrabold tracking-[-.04em] text-[#e8f0ed] sm:text-[29px]">{subject || 'Subject'}</h1><p className="mt-2 text-[11px] text-[#7d8e9c]">{items.length} questions · {sets.length} generated sets · maximum 30 questions per set</p></div></div></section><div className="mb-3"><h2 className="text-[14px] font-bold text-[#e1e9e7]">Quiz sets</h2><p className="mt-1 text-[11px] text-[#718192]">Choose Practice for explanations after each answer, or Exam for results at the end.</p></div><div className="space-y-2">{sets.map((set, index) => <div key={index} className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-[12px] font-bold text-[#dbe5e2]">Set {index + 1}</div><div className="mt-1 text-[10px] text-[#718394]">{set.length} questions</div></div><div className="flex gap-2"><button onClick={() => onCreate({ subjects: [subject], questionCount: set.length, difficulty: 'Mixed', mode: 'untimed' })} className="button-small" data-testid={`button-practice-set-${index + 1}`}><Play size={12} /> Practice</button><button onClick={() => onCreate({ subjects: [subject], questionCount: set.length, difficulty: 'Mixed', mode: 'timed' })} className="button-primary" data-testid={`button-exam-set-${index + 1}`}><Target size={12} /> Exam</button></div></div>)}</div>{!sets.length && <div className="panel"><EmptyState icon={BookOpen} title="Subject not found" description="Return to the subject index and choose another topic." action={<Link href="/" className="button-secondary">Back to overview</Link>} /></div>}</div>;
}

function QuestionCard({ question, index, onStart }: { question: Question; index: number; onStart: (id: string) => void }) {
  const [selected, setSelected] = useState('');
  const search = (site: 'chatgpt' | 'youtube') => { const term = selected || question.text; window.open(site === 'chatgpt' ? `https://chatgpt.com/?q=${encodeURIComponent(term)}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`, '_blank', 'noopener,noreferrer'); };
  return <article className="panel question-card" onMouseUp={() => setSelected(window.getSelection()?.toString() || '')} data-testid={`card-question-${question.id}`}><div className="flex items-start gap-3"><span className="question-number">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="tag tag-teal">{question.subject}</span><span className="tag">{question.topic}</span>{question.duplicateCount > 1 && <span className="tag tag-amber"><Repeat2 size={11} /> repeated {question.duplicateCount}×</span>}{question.verified ? <span className="ml-auto flex items-center gap-1 text-[10px] text-[#64d5b4]"><CheckCircle2 size={13} /> verified</span> : <span className="ml-auto flex items-center gap-1 text-[10px] text-[#dda95a]"><AlertTriangle size={13} /> needs review</span>}</div><p className="max-w-[850px] text-[14px] font-semibold leading-6 text-[#dce5e3]">{question.text}</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{question.options.map((option, i) => <div key={`${question.id}-option-${i}`} className="flex items-start gap-2 rounded border border-[#202d3a] bg-[#0c131c] px-3 py-2 text-[11px] text-[#8797a5]"><span className="font-mono text-[10px] text-[#5d7181]">{String.fromCharCode(65 + i)}</span>{option}</div>)}</div><div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#1a2733] pt-3"><span className="flex items-center gap-1.5 text-[10px] text-[#627687]"><BookOpen size={12} /> {question.sourceRefs.join(' · ')}</span><span className="text-[10px] text-[#627687]">ID {question.id}</span><div className="ml-auto flex items-center gap-2">{selected && <><button onClick={() => search('chatgpt')} className="text-[10px] font-bold text-[#61d6b5]" data-testid={`button-chatgpt-${question.id}`}><Sparkles size={12} className="inline" /> ChatGPT</button><button onClick={() => search('youtube')} className="text-[10px] font-bold text-[#61d6b5]" data-testid={`button-youtube-${question.id}`}><Youtube size={12} className="inline" /> YouTube</button></>}<button onClick={() => onStart(question.id)} className="button-small" data-testid={`button-practice-${question.id}`}><Play size={12} /> Practice</button></div></div></div></div></article>;
}

function RepeatedPage({ onStart }: { onStart: (id: string) => void }) {
  const repeated = seedQuestions.filter((q) => q.duplicateCount > 1);
  const grouped = repeated.reduce<Record<string, Question[]>>((acc, q) => { (acc[q.subject] ||= []).push(q); return acc; }, {});
  return <div className="animate-in"><PageTitle eyebrow="02 / frequency map" title="Repeated questions" description="The questions that show up most often across your source set. Prioritize these before the edge cases." /><div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label="Repeated items" value={String(repeated.length).padStart(2, '0')} detail="appear in 2+ sources" icon={Repeat2} /><StatCard label="Most frequent" value="04×" detail="Promise.all / async" accent="amber" icon={Zap} /><StatCard label="Subjects touched" value={String(Object.keys(grouped).length).padStart(2, '0')} detail="high-signal clusters" icon={Layers3} /></div><div className="space-y-5">{Object.entries(grouped).map(([subject, questions]) => <section className="panel overflow-hidden" key={subject}><div className="flex items-center justify-between border-b border-[#1d2935] px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-md bg-[#122725] text-[#61d6b5]"><Code2 size={14} /></span><div><h2 className="text-[13px] font-bold text-[#dce6e3]">{subject}</h2><p className="text-[10px] text-[#687a8b]">{questions.length} repeated signals</p></div></div><span className="tag tag-amber">high value</span></div><div className="divide-y divide-[#1b2834]">{questions.map((q, i) => <div key={q.id} className="flex items-center gap-4 px-5 py-4"><span className="font-mono text-[10px] text-[#607283]">0{i + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold text-[#cad6d3]">{q.text}</p><div className="mt-1 flex gap-3 text-[10px] text-[#66798a]"><span>{q.topic}</span><span>{q.sourceRefs.length} sources</span></div></div><span className="hidden font-mono text-[11px] text-[#dfb25d] sm:block">{q.duplicateCount}×</span><button onClick={() => onStart(q.id)} className="button-small" data-testid={`button-repeated-practice-${q.id}`}><Play size={12} /> Practice</button></div>)}</div></section>)}</div></div>;
}

function UnverifiedPage({ onStart }: { onStart: (id: string) => void }) {
  const items = unverifiedQuestions;
  return <div className="animate-in"><PageTitle eyebrow="03 / curation queue" title="Needs review" description="Incomplete or single-answer items from the source import. Use this queue to tighten the bank before you rely on it." action={<span className="tag tag-amber"><FileWarning size={12} /> {items.length} items queued</span>} /><div className="panel overflow-hidden"><div className="grid grid-cols-[1fr_auto] border-b border-[#1d2935] px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#607283]"><span>Question / subject</span><span>Action</span></div>{items.map((q) => <div key={q.id} className="flex items-center gap-4 border-b border-[#1a2732] px-5 py-4 last:border-0"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#32251a] text-[#dda95d]"><AlertTriangle size={15} /></div><div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><span className="tag">{q.subject}</span><span className="text-[10px] text-[#6c7c8c]">{q.topic}</span></div><p className="truncate text-[12px] font-semibold text-[#ccd8d5]">{q.text}</p><p className="mt-1 text-[10px] text-[#6b7e8e]">{q.verified ? 'Single-answer item' : 'Not yet verified'} · {q.sourceRefs.join(' · ')}</p></div><button onClick={() => onStart(q.id)} className="button-small" data-testid={`button-review-${q.id}`}><Play size={12} /> Review</button></div>)}</div></div>;
}

function GenerateExam({ onCreate }: { onCreate: (config: ExamConfig) => void }) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(subjects.slice(1));
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('Mixed');
  const [mode, setMode] = useState<'timed' | 'untimed'>('timed');
  const toggle = (s: string) => setSelectedSubjects((current) => current.includes(s) ? current.filter((x) => x !== s) : [...current, s]);
  return <div className="animate-in"><PageTitle eyebrow="04 / session composer" title="Generate an exam" description="Tune the signal. Choose the subjects, pace, and size for a session that matches the work ahead." /><div className="grid gap-5 xl:grid-cols-[1fr_360px]"><section className="panel"><div className="border-b border-[#1d2935] px-5 py-4"><h2 className="text-[14px] font-bold text-[#e1e9e7]">Exam parameters</h2><p className="mt-1 text-[11px] text-[#718192]">Maximum 30 questions per quiz.</p></div><div className="space-y-7 p-5 sm:p-7"><div><label className="label">Subjects <span>Select at least one</span></label><div className="grid gap-2 sm:grid-cols-2">{subjects.slice(1).map((s) => <button key={s} onClick={() => toggle(s)} className={cn('flex items-center justify-between rounded-md border px-3 py-3 text-left text-[12px] font-semibold transition-colors', selectedSubjects.includes(s) ? 'border-[#32695c] bg-[#122824] text-[#d7eae5]' : 'border-[#23303d] bg-[#0c131c] text-[#7d8e9d] hover:border-[#344556]')} data-testid={`button-subject-${s.toLowerCase().replaceAll(' ', '-')}`}><span className="flex items-center gap-2"><Code2 size={14} className={selectedSubjects.includes(s) ? 'text-[#61d8b6]' : 'text-[#647586]'} />{s}</span>{selectedSubjects.includes(s) && <Check size={14} className="text-[#61d8b6]" />}</button>)}</div></div><div><label className="label">Question count <span>{count} / 30</span></label><input type="range" min="1" max="30" value={count} onChange={(e) => setCount(Number(e.target.value))} className="accent-[#57d7b5] w-full" data-testid="input-question-count" /><div className="mt-2 flex justify-between font-mono text-[10px] text-[#617485]"><span>01</span><span>15</span><span>30</span></div></div><div className="grid gap-5 sm:grid-cols-2"><div><label className="label">Difficulty</label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="field" data-testid="select-difficulty"><option>Mixed</option><option>Foundations</option><option>Advanced</option></select></div><div><label className="label">Session mode</label><div className="flex gap-2"><button onClick={() => setMode('timed')} className={cn('flex-1 rounded-md border px-3 py-2.5 text-[11px] font-bold', mode === 'timed' ? 'border-[#32695c] bg-[#122824] text-[#6fe0bf]' : 'border-[#23303d] text-[#748697]')} data-testid="button-mode-timed"><Clock3 size={13} className="mr-1 inline" /> Timed</button><button onClick={() => setMode('untimed')} className={cn('flex-1 rounded-md border px-3 py-2.5 text-[11px] font-bold', mode === 'untimed' ? 'border-[#32695c] bg-[#122824] text-[#6fe0bf]' : 'border-[#23303d] text-[#748697]')} data-testid="button-mode-untimed">Untimed</button></div></div></div></div></section><aside className="panel h-fit overflow-hidden"><div className="border-b border-[#1d2935] bg-[#0e171f] px-5 py-4"><div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-[#61d5b5]"><Settings2 size={13} /> Configuration preview</div><p className="text-[11px] text-[#728393]">Your session will be assembled locally from the indexed bank.</p></div><div className="space-y-4 p-5"><PreviewRow label="Subjects" value={selectedSubjects.length === subjects.length - 1 ? 'All subjects' : `${selectedSubjects.length} selected`} /><PreviewRow label="Questions" value={String(Math.min(30, count)).padStart(2, '0')} /><PreviewRow label="Difficulty" value={difficulty} /><PreviewRow label="Pace" value={mode === 'timed' ? '20 min / exam' : 'No clock'} /><div className="border-t border-[#1d2935] pt-4"><button onClick={() => selectedSubjects.length && onCreate({ subjects: selectedSubjects, questionCount: Math.min(30, count), difficulty, mode })} disabled={!selectedSubjects.length} className="button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-start-generated-exam"><Play size={15} /> Start exam</button><p className="mt-3 text-center text-[10px] leading-4 text-[#647688]">Questions shuffle each session. Your answers stay on this device.</p></div></div></aside></div></div>;
}

function PreviewRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between text-[11px]"><span className="text-[#718293]">{label}</span><span className="font-mono text-[#d0dcda]">{value}</span></div>; }

function ProgressPage({ attempts }: { attempts: Attempt[] }) {
  const topicStats = seedQuestions.slice(0, 6).map((q, index) => ({ ...q, value: [72, 54, 38, 81, 66, 47][index] }));
  return <div className="animate-in"><PageTitle eyebrow="05 / feedback loop" title="Progress & history" description="See where recall is holding, where it slips, and how your practice changes over time." /><div className="grid gap-3 sm:grid-cols-3"><StatCard label="Questions answered" value={String(attempts.reduce((s, a) => s + a.total, 0)).padStart(2, '0')} detail="across all sessions" icon={ListChecks} /><StatCard label="Average score" value={attempts.length ? `${Math.round(attempts.reduce((s, a) => s + a.score / a.total * 100, 0) / attempts.length)}%` : '—'} detail="rolling session average" icon={BarChart3} /><StatCard label="Best session" value={attempts.length ? `${Math.max(...attempts.map((a) => Math.round(a.score / a.total * 100)))}%` : '—'} detail="personal high score" accent="amber" icon={Trophy} /></div><div className="mt-5 grid gap-5 xl:grid-cols-[.85fr_1.15fr]"><section className="panel"><div className="border-b border-[#1d2935] px-5 py-4"><h2 className="text-[14px] font-bold text-[#e1e9e7]">Weak-topic radar</h2><p className="mt-1 text-[11px] text-[#718192]">Topics below 60% need another pass.</p></div><div className="space-y-5 p-5">{topicStats.map((q) => <div key={q.id}><div className="mb-2 flex justify-between"><span className="text-[11px] text-[#aebbc2]">{q.subject} <span className="text-[#627485]">/ {q.topic}</span></span><span className={q.value < 60 ? 'font-mono text-[10px] text-[#dca85c]' : 'font-mono text-[10px] text-[#61d3b4]'}>{q.value}%</span></div><ProgressBar value={q.value} color={q.value < 45 ? 'red' : q.value < 60 ? 'amber' : 'teal'} /></div>)}</div></section><section className="panel"><div className="flex items-center justify-between border-b border-[#1d2935] px-5 py-4"><div><h2 className="text-[14px] font-bold text-[#e1e9e7]">Session history</h2><p className="mt-1 text-[11px] text-[#718192]">A local record of every completed run.</p></div><span className="tag">{attempts.length} sessions</span></div>{attempts.length ? <div className="divide-y divide-[#1d2935]">{attempts.map((a) => <AttemptRow key={a.id} attempt={a} />)}</div> : <EmptyState icon={History} title="Your history is quiet" description="Complete a session to start seeing patterns in your performance." action={<Link href="/generate-exam" className="button-secondary" data-testid="link-progress-generate">Generate an exam</Link>} />}</section></div></div>;
}

function ExportPage() {
  const [subject, setSubject] = useState('All subjects');
  const [status, setStatus] = useState('');
  const count = subject === 'All subjects' ? seedQuestions.length : seedQuestions.filter((q) => q.subject === subject).length;
  const exportBank = () => {
    const selected = subject === 'All subjects' ? seedQuestions : seedQuestions.filter((q) => q.subject === subject);
    const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] || char);
    const markup = selected.map((q, index) => `<article class="question"><div class="meta">${String(index + 1).padStart(3, '0')} · ${escapeHtml(q.subject)} / ${escapeHtml(q.topic)}</div><h2>${escapeHtml(q.text)}</h2><ol type="A">${q.options.map((option) => `<li>${escapeHtml(option)}</li>`).join('')}</ol><p><strong>Correct answer:</strong> ${String.fromCharCode(65 + q.correctAnswer)}. ${escapeHtml(q.options[q.correctAnswer] || '')}</p><p><strong>Explanation:</strong> ${escapeHtml(q.explanation)}</p><p class="source">${escapeHtml(q.sourceRefs.join(' · '))}</p></article>`).join('');
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      setStatus('Allow pop-ups to create the complete PDF export.');
      return;
    }
    printWindow.document.write(`<!doctype html><html><head><title>DevBank — ${escapeHtml(subject)}</title><style>body{font-family:Arial,sans-serif;color:#111;max-width:780px;margin:32px auto;line-height:1.45}.question{break-inside:avoid;border-bottom:1px solid #ddd;padding:0 0 22px;margin:0 0 22px}.meta,.source{font-size:11px;color:#667085;letter-spacing:.04em}.meta{text-transform:uppercase}h1{font-size:24px}h2{font-size:16px;margin:8px 0}ol{padding-left:24px}li{margin:4px 0}p{font-size:13px}</style></head><body><h1>DevBank question bank — ${escapeHtml(subject)}</h1><p>${selected.length} verified questions · answers and explanations included</p>${markup}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => { printWindow.print(); setStatus('Complete export opened. Choose “Save as PDF”.'); }, 350);
  };
  return <div className="animate-in"><PageTitle eyebrow="06 / take it with you" title="Export question bank" description="Create a clean, subject-wise study document for offline review or a focused print session." /><div className="grid gap-5 xl:grid-cols-[1fr_360px]"><section className="panel p-5 sm:p-7"><div className="mb-7 flex items-start gap-4"><div className="grid h-10 w-10 place-items-center rounded-lg bg-[#142b2a] text-[#60d6b4]"><Download size={19} /></div><div><h2 className="text-[15px] font-bold text-[#e1e9e7]">Subject-wise PDF</h2><p className="mt-1 text-[12px] leading-5 text-[#758697]">The browser print surface keeps your source references and answer structure intact.</p></div></div><label className="label">Export subject</label><select value={subject} onChange={(e) => setSubject(e.target.value)} className="field mb-7" data-testid="select-export-subject">{subjects.map((s) => <option key={s}>{s}</option>)}</select><div className="grid gap-3 sm:grid-cols-3"><PreviewRow label="Questions" value={String(count).padStart(2, '0')} /><PreviewRow label="Sources" value="12 refs" /><PreviewRow label="Format" value="PDF / A4" /></div><button onClick={exportBank} className="button-primary mt-8" data-testid="button-export-pdf"><Download size={15} /> Export {subject}</button>{status && <p className="mt-4 flex items-center gap-2 text-[11px] text-[#63d7b5]" data-testid="status-export"><CheckCircle2 size={14} /> {status}</p>}</section><aside className="panel overflow-hidden"><div className="border-b border-[#1d2935] px-5 py-4"><h2 className="text-[14px] font-bold text-[#e1e9e7]">Included in export</h2></div><div className="space-y-3 p-5 text-[11px] text-[#8a9aa8]"><div className="flex gap-2"><Check size={14} className="text-[#5ed5b4]" /> Question and answer options</div><div className="flex gap-2"><Check size={14} className="text-[#5ed5b4]" /> Correct answer and explanation</div><div className="flex gap-2"><Check size={14} className="text-[#5ed5b4]" /> Subject and topic labels</div><div className="flex gap-2"><Check size={14} className="text-[#5ed5b4]" /> Source references for verification</div><div className="mt-5 border-t border-[#1d2935] pt-4 text-[10px] leading-5 text-[#627485]">Tip: use your browser’s destination picker to save the generated print surface as a PDF.</div></div></aside></div></div>;
}

function PracticePage({ attempts, setAttempts, exam = false }: { attempts: Attempt[]; setAttempts: (a: Attempt[]) => void; exam?: boolean }) {
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const session = exam ? (() => { try { return JSON.parse(localStorage.getItem(`devbank-exam-${params.id}`) || 'null') as { questions: Question[]; config: ExamConfig } | null; } catch { return null; } })() : null;
  const questions = session?.questions || [seedQuestions.find((q) => q.id === params.id) || seedQuestions[0]];
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const question = questions[current];
  const selected = answers[question.id];
  const isLast = current === questions.length - 1;
  const submit = () => { if (selected === undefined && question.options.length > 0) return; if (!isLast) { setSubmitted(true); return; } const score = questions.reduce((sum, q) => sum + (answers[q.id] === q.correctAnswer ? 1 : 0), 0); const breakdown: Record<string, { correct: number; total: number }> = {}; questions.forEach((q) => { breakdown[q.topic] ||= { correct: 0, total: 0 }; breakdown[q.topic].total += 1; if (answers[q.id] === q.correctAnswer) breakdown[q.topic].correct += 1; }); const attempt: Attempt = { id: `attempt-${Date.now()}`, mode: exam ? 'exam' : 'practice', subject: exam ? (session?.config.subjects.join(', ') || 'Mixed') : question.subject, score, total: questions.length, completedAt: new Date().toISOString(), topicBreakdown: breakdown, answers }; setAttempts([attempt, ...attempts]); setSubmitted(true); };
  if (exam && !session) return <div className="panel"><EmptyState icon={AlertTriangle} title="Session not found" description="This exam may have been cleared from local storage." action={<Link href="/generate-exam" className="button-secondary" data-testid="link-missing-session">Build a new exam</Link>} /></div>;
  return <div className="animate-in mx-auto max-w-[920px]"><div className="mb-6 flex items-center justify-between"><button onClick={() => setLocation(exam ? '/generate-exam' : '/library')} className="flex items-center gap-2 text-[11px] font-bold text-[#7d8e9d] hover:text-[#dbe6e3]" data-testid="button-exit-session"><ArrowLeft size={14} /> Exit session</button><div className="flex items-center gap-3 font-mono text-[10px] text-[#718394]"><span>{exam ? 'EXAM MODE' : 'PRACTICE MODE'}</span><span className="text-[#d6e1de]">{String(current + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}</span></div></div><ProgressBar value={((current + (submitted ? 1 : 0)) / questions.length) * 100} /><div className="mt-8 grid gap-5 lg:grid-cols-[1fr_260px]"><section className="panel overflow-hidden"><div className="border-b border-[#1d2935] px-5 py-4"><div className="mb-3 flex flex-wrap items-center gap-2"><span className="tag tag-teal">{question.subject}</span><span className="tag">{question.topic}</span>{question.verified ? <span className="ml-auto flex items-center gap-1 text-[10px] text-[#62d4b3]"><CheckCircle2 size={13} /> verified source</span> : <span className="ml-auto flex items-center gap-1 text-[10px] text-[#dda95c]"><AlertTriangle size={13} /> needs review</span>}</div><h1 className="text-[21px] font-bold leading-8 tracking-[-.025em] text-[#e6efec]">{question.text}</h1></div><div className="space-y-2 p-5 sm:p-7">{question.options.length ? question.options.map((option, i) => <button key={`${question.id}-option-${i}`} onClick={() => !submitted && setAnswers({ ...answers, [question.id]: i })} className={cn('flex w-full items-start gap-3 rounded-md border px-4 py-3.5 text-left text-[12px] transition-colors', selected === i ? submitted ? i === question.correctAnswer ? 'border-[#357b66] bg-[#143329] text-[#d8eee8]' : 'border-[#7d4a51] bg-[#321d24] text-[#f0dadd]' : 'border-[#397f6a] bg-[#14322d] text-[#e4f1ee]' : 'border-[#202d3a] bg-[#0b121a] text-[#99a8b3] hover:border-[#344758]')} data-testid={`button-answer-${question.id}-${i}`}><span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded border font-mono text-[10px]', selected === i ? 'border-current' : 'border-[#30404d] text-[#657687]')}>{String.fromCharCode(65 + i)}</span><span className="leading-5">{option}</span>{submitted && i === question.correctAnswer && <Check size={15} className="ml-auto text-[#64d8b5]" />}</button>) : <div className="rounded-md border border-[#4a3a23] bg-[#211b12] p-4 text-[12px] leading-6 text-[#c5b18a]">This source record is incomplete or single-answer only. It is available here for review, but it is not included in generated quizzes.</div>}{submitted && <div className="mt-5 rounded-md border border-[#2d4c49] bg-[#102320] p-4"><div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#6ddbbe]"><CheckCircle2 size={14} /> Explanation</div><p className="text-[12px] leading-6 text-[#b4c5c1]">{question.explanation}</p><div className="mt-3 flex flex-wrap gap-2">{question.sourceRefs.map((ref, sourceIndex) => <span key={`${question.id}-source-${sourceIndex}`} className="tag">{ref}</span>)}</div></div>}<div className="mt-7 flex items-center justify-between border-t border-[#1d2935] pt-5"><span className="text-[10px] text-[#657688]">{selected === undefined ? 'Select an answer to continue' : submitted ? 'Answer recorded locally' : 'Answer selected'}</span>{submitted ? isLast ? <Link href={exam ? '/progress' : '/library'} className="button-primary" data-testid="link-session-complete">{exam ? 'View progress' : 'Back to library'} <ArrowRight size={14} /></Link> : <button onClick={() => { setSubmitted(false); setCurrent((n) => n + 1); }} className="button-primary" data-testid="button-next-question">Next question <ArrowRight size={14} /></button> : <button onClick={submit} disabled={selected === undefined} className="button-primary disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-submit-answer">{isLast ? 'Finish session' : 'Reveal explanation'} <ArrowRight size={14} /></button>}</div></div></section><aside className="panel h-fit p-5"><div className="mb-4 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.16em] text-[#6d8090]">Session map</span><ListChecks size={14} className="text-[#61d4b3]" /></div><div className="space-y-2">{questions.map((q, i) => <button onClick={() => !submitted && setCurrent(i)} key={q.id} className={cn('flex w-full items-center gap-3 rounded px-2 py-2 text-left text-[10px]', current === i ? 'bg-[#142a29] text-[#dce9e5]' : 'text-[#6c7d8d] hover:bg-[#121b25]')} data-testid={`button-question-jump-${i}`}><span className="font-mono">{String(i + 1).padStart(2, '0')}</span><span className="truncate">{q.topic}</span>{answers[q.id] !== undefined && <Check size={12} className="ml-auto text-[#61d4b3]" />}</button>)}</div>{exam && session?.config.mode === 'timed' && <div className="mt-5 border-t border-[#1d2935] pt-4 text-center"><Clock3 size={16} className="mx-auto mb-2 text-[#e0b25b]" /><div className="font-mono text-[18px] text-[#d8e2df]">20:00</div><div className="mt-1 text-[10px] text-[#657687]">timed session</div></div>}</aside></div></div>;
}

function Router() {
  const [attempts, setAttempts] = useLocalStorage<Attempt[]>('devbank-attempts', []);
  const [, setLocation] = useLocation();
  const startPractice = (id: string) => setLocation(`/practice/${id}`);
  const createExam = (config: ExamConfig) => { const pool = seedQuestions.filter((q) => config.subjects.includes(q.subject)); const questions = [...pool].sort(() => Math.random() - .5).slice(0, Math.min(config.questionCount, 30)); const id = `exam-${Date.now()}`; localStorage.setItem(`devbank-exam-${id}`, JSON.stringify({ questions: questions.length ? questions : seedQuestions.slice(0, Math.min(config.questionCount, 30)), config })); setLocation(`/exam/${id}`); };
  return <RoutedErrorBoundary><Shell><Switch><Route path="/" component={() => <Dashboard attempts={attempts} />} /><Route path="/library" component={() => <Library onStart={startPractice} />} /><Route path="/subject/:subject" component={() => <SubjectPage onCreate={createExam} />} /><Route path="/repeated" component={() => <RepeatedPage onStart={startPractice} />} /><Route path="/unverified" component={() => <UnverifiedPage onStart={startPractice} />} /><Route path="/generate-exam" component={() => <GenerateExam onCreate={createExam} />} /><Route path="/progress" component={() => <ProgressPage attempts={attempts} />} /><Route path="/export" component={ExportPage} /><Route path="/practice/:id" component={() => <PracticePage attempts={attempts} setAttempts={setAttempts} />} /><Route path="/exam/:id" component={() => <PracticePage attempts={attempts} setAttempts={setAttempts} exam />} /><Route component={NotFound} /></Switch></Shell></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  useEffect(() => { document.documentElement.classList.add('dark'); }, []);
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;