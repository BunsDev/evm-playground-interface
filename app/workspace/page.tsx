"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Layers,
  Sparkles,
  TerminalSquare,
  Compass,
  Settings2,
  Palette,
  Plus,
  PanelsTopLeft,
  Brain,
} from "lucide-react";
import Playground from "@/components/playground";
import Sidebar from "@/components/sidebar";
import type { CodeSnippet } from "@/lib/abiDatabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { icon: Compass, label: "Projects", hotkey: "⌘1" },
  { icon: Layers, label: "Boards", hotkey: "⌘2" },
  { icon: TerminalSquare, label: "Terminals", hotkey: "⌘3" },
  { icon: Sparkles, label: "AI", hotkey: "⌘4" },
];

function CommandRail({ onThemeToggle }: { onThemeToggle: () => void }) {
  return (
    <div className="hidden h-full w-16 flex-col items-center justify-between border-r border-zinc-200/70 bg-white/80 py-6 shadow-md dark:border-zinc-800/70 dark:bg-zinc-950/80 lg:flex">
      <div className="flex flex-col items-center gap-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-50 shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
          <span className="text-xs font-semibold tracking-[0.18em]">EPI</span>
        </div>
        <TooltipProvider>
          <div className="flex flex-col items-center gap-4">
            {NAV_ITEMS.map((item) => (
              <Tooltip key={item.label} delayDuration={100}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100"
                  >
                    <item.icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-2 text-xs">
                  <span>{item.label}</span>
                  <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px] uppercase tracking-[0.2em]">
                    {item.hotkey}
                  </Badge>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>
      <div className="flex flex-col items-center gap-4">
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onThemeToggle}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100"
                aria-label="Toggle theme"
              >
                <Palette className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Toggle theme
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100"
                aria-label="Settings"
              >
                <Settings2 className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Open settings
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-zinc-200 to-zinc-100 text-xs font-semibold text-zinc-700 shadow dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-200">
          JB
        </div>
      </div>
    </div>
  );
}

const WORKSPACE_BOARDS = [
  {
    title: "Playground",
    description: "Local EVM environment",
    meta: "Active",
  },
  {
    title: "Protocol Integration",
    description: "Rollup automation",
    meta: "In review",
  },
  {
    title: "UI Polish",
    description: "Design pass",
    meta: "Paused",
  },
];

function WorkspaceList({ onSelect }: { onSelect?: () => void }) {
  return (
    <div className="space-y-4">
      {WORKSPACE_BOARDS.map((board) => (
        <button
          key={board.title}
          type="button"
          className="group flex w-full flex-col gap-2 rounded-2xl border border-zinc-200/70 bg-white/80 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800/60 dark:bg-zinc-900/70 dark:hover:border-zinc-700"
          onClick={onSelect}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {board.title}
            </span>
            <Badge variant="secondary" className="rounded-full bg-zinc-900/10 text-[10px] uppercase tracking-[0.18em] text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white dark:bg-zinc-800/60 dark:text-zinc-300 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900">
              {board.meta}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{board.description}</p>
        </button>
      ))}
    </div>
  );
}

function WorkspaceSwitcher({ onSelect }: { onSelect?: () => void }) {
  return (
    <div className="hidden h-full w-80 flex-col border-r border-zinc-200/70 bg-white/70 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-950/70 lg:flex">
      <div className="border-b border-zinc-200/70 px-6 py-5 dark:border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Workspaces
            </h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Switch contexts, repos, and boards</p>
          </div>
          <Button size="icon" variant="ghost" className="rounded-full border border-transparent hover:border-zinc-200">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 px-4 py-4">
        <WorkspaceList onSelect={onSelect} />
      </ScrollArea>
    </div>
  );
}

type IntelligenceCard = {
  id: string;
  title: string;
  accent: string;
  content: ReactNode;
};

function useIntelligenceCards({
  onOpenSnippets,
  onABIChange,
}: {
  onOpenSnippets: () => void;
  onABIChange: () => void;
}): IntelligenceCard[] {
  return useMemo(
    () => [
      {
        id: "ai-studio",
        title: "AI Studio",
        accent: "bg-linear-to-br from-indigo-500/80 via-purple-500/70 to-fuchsia-500/60",
        content: (
          <div className="space-y-3 text-sm">
            <p className="text-zinc-200/90">Model: Claude Sonnet + Local LLM</p>
            <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-xs text-white/80">
              <p className="font-medium uppercase tracking-[0.2em] text-white">Dual-Brain</p>
              <p className="mt-2 leading-5">
                Route complex refactors through Claude while validating runtime changes with your local model.
              </p>
            </div>
            <Button variant="secondary" size="sm" className="rounded-full bg-white/20 text-white hover:bg-white/30">
              Open chat
            </Button>
          </div>
        ),
      },
      {
        id: "context",
        title: "Context Lens",
        accent: "bg-linear-to-br from-zinc-900 via-zinc-900 to-zinc-950",
        content: (
          <Tabs defaultValue="recent">
            <TabsList className="grid grid-cols-2 rounded-full bg-zinc-800/40 p-1 text-xs">
              <TabsTrigger value="recent" className="rounded-full data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
                Recent
              </TabsTrigger>
              <TabsTrigger value="tests" className="rounded-full data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
                Tests
              </TabsTrigger>
            </TabsList>
            <TabsContent value="recent" className="mt-3 space-y-2 text-xs text-zinc-100/80">
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 p-3">
                <p className="font-medium text-white">components/playground.tsx</p>
                <p className="mt-1 text-[11px] text-zinc-400">Last touched 2m ago</p>
              </div>
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 p-3">
                <p className="font-medium text-white">lib/abiDatabase.ts</p>
                <p className="mt-1 text-[11px] text-zinc-400">Indexed ABIs updated</p>
              </div>
            </TabsContent>
            <TabsContent value="tests" className="mt-3 space-y-2 text-xs text-zinc-100/80">
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 p-3">
                <p className="font-medium text-white">playground-run.test.tsx</p>
                <p className="mt-1 text-[11px] text-zinc-400">Queued (needs ABI mock update)</p>
              </div>
            </TabsContent>
          </Tabs>
        ),
      },
      {
        id: "snippets",
        title: "Snippet Fabric",
        accent: "bg-linear-to-br from-amber-500/80 via-orange-500/70 to-rose-500/60",
        content: (
          <div className="space-y-3 text-sm text-zinc-900">
            <p className="leading-5 text-zinc-800/90">
              Drag curated snippets into the canvas or preview them inline before inserting.
            </p>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-3 text-xs text-zinc-700 shadow-sm">
              <p className="font-semibold uppercase tracking-[0.18em] text-amber-600">Setup</p>
              <p className="mt-2">Create viem public client</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="rounded-full bg-zinc-900 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-zinc-700" onClick={onOpenSnippets}>
                Open library
              </Button>
              <Button size="sm" variant="outline" className="rounded-full px-4 text-xs font-semibold uppercase tracking-[0.12em]" onClick={onABIChange}>
                Refresh ABIs
              </Button>
            </div>
          </div>
        ),
      },
    ],
    [onOpenSnippets, onABIChange],
  );
}

function IntelligenceDock({
  onOpenSnippets,
  onABIChange,
  className,
}: {
  onOpenSnippets: () => void;
  onABIChange: () => void;
  className?: string;
}) {
  const cards = useIntelligenceCards({ onOpenSnippets, onABIChange });

  return (
    <div
      className={
        className ??
        "hidden h-full w-96 flex-col gap-4 border-l border-zinc-200/70 bg-white/80 px-4 py-6 shadow-inner dark:border-zinc-800/60 dark:bg-zinc-950/70 xl:flex"
      }
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Intelligence Dock
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">AI, context, and runtime signals</p>
        </div>
        <div className="flex h-3 w-3 animate-ping rounded-full bg-emerald-400" aria-hidden />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4 pb-8">
          {cards.map((card) => (
            <div
              key={card.id}
              className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 shadow-lg shadow-zinc-200/40 dark:border-zinc-800/60 dark:bg-zinc-900/70 dark:shadow-zinc-900/40"
            >
              <div className={`absolute inset-0 ${card.accent} opacity-70 blur-2xl mix-blend-multiply`} aria-hidden />
              <div className="relative space-y-3 px-5 py-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-700 dark:text-zinc-200">
                    {card.title}
                  </h4>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Dock</span>
                </div>
                {card.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function App() {
  const [abiRefreshKey, setAbiRefreshKey] = useState(0);
  const [pendingSnippet, setPendingSnippet] = useState<CodeSnippet | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspaceSheetOpen, setWorkspaceSheetOpen] = useState(false);
  const [intelSheetOpen, setIntelSheetOpen] = useState(false);

  const handleABIChange = () => {
    setAbiRefreshKey((prev) => prev + 1);
  };

  const handleSnippetInsert = (snippet: CodeSnippet) => {
    setPendingSnippet(snippet);
    setSidebarOpen(false);
  };

  const handleThemeToggle = () => {
    document.documentElement.classList.toggle("dark");
  };

  const intelligenceCards = useIntelligenceCards({
    onOpenSnippets: () => setSidebarOpen(true),
    onABIChange: handleABIChange,
  });

  return (
    <div className="relative flex min-h-screen flex-col bg-linear-to-br from-zinc-100 via-white to-zinc-50 text-zinc-900 dark:from-zinc-950 dark:via-zinc-950/95 dark:to-zinc-900 dark:text-zinc-50">
      <MobileTopBar
        onThemeToggle={handleThemeToggle}
        onOpenWorkspace={() => setWorkspaceSheetOpen(true)}
        onOpenIntelligence={() => setIntelSheetOpen(true)}
        onOpenSnippets={() => setSidebarOpen(true)}
      />
      <div className="flex flex-1 flex-col pb-24 lg:pb-0">
        <div className="flex flex-1 overflow-hidden lg:overflow-visible">
          <CommandRail onThemeToggle={handleThemeToggle} />
          <WorkspaceSwitcher onSelect={() => setWorkspaceSheetOpen(false)} />
          <div className="relative flex min-w-0 flex-1">
            <Playground
              abiRefreshKey={abiRefreshKey}
              pendingSnippet={pendingSnippet}
              onSnippetConsumed={() => setPendingSnippet(null)}
            />
            <Sidebar
              open={sidebarOpen}
              onOpenChange={setSidebarOpen}
              onABIChange={handleABIChange}
              onSnippetInsert={handleSnippetInsert}
            />
          </div>
          <IntelligenceDock
            onOpenSnippets={() => setSidebarOpen(true)}
            onABIChange={handleABIChange}
          />
        </div>
      </div>
      <MobileActionBar
        onOpenWorkspace={() => setWorkspaceSheetOpen(true)}
        onOpenSnippets={() => setSidebarOpen(true)}
        onOpenIntelligence={() => setIntelSheetOpen(true)}
      />

      <Sheet open={workspaceSheetOpen} onOpenChange={setWorkspaceSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] overflow-y-auto rounded-t-3xl border-none bg-white/95 px-5 pb-8 pt-6 shadow-2xl dark:bg-zinc-950/95"
        >
          <SheetHeader className="text-left">
            <SheetTitle>Workspaces</SheetTitle>
            <SheetDescription>Switch contexts and manage boards on the go.</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <WorkspaceList onSelect={() => setWorkspaceSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={intelSheetOpen} onOpenChange={setIntelSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] overflow-y-auto rounded-t-3xl border-none bg-white/95 px-5 pb-8 pt-6 shadow-2xl dark:bg-zinc-950/95"
        >
          <SheetHeader className="text-left">
            <SheetTitle>Intelligence Dock</SheetTitle>
            <SheetDescription>AI insights, context, and snippet tools.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {intelligenceCards.map((card) => (
              <div
                key={card.id}
                className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 shadow-lg shadow-zinc-200/40 dark:border-zinc-800/60 dark:bg-zinc-900/70 dark:shadow-zinc-900/40"
              >
                <div className={`absolute inset-0 ${card.accent} opacity-70 blur-2xl mix-blend-multiply`} aria-hidden />
                <div className="relative space-y-3 px-5 py-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-700 dark:text-zinc-200">
                      {card.title}
                    </h4>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Dock</span>
                  </div>
                  {card.content}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MobileTopBar({
  onThemeToggle,
  onOpenWorkspace,
  onOpenIntelligence,
  onOpenSnippets,
}: {
  onThemeToggle: () => void;
  onOpenWorkspace: () => void;
  onOpenIntelligence: () => void;
  onOpenSnippets: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/90 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-50 shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
          <span className="text-xs font-semibold tracking-[0.18em]">EPI</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">EVM Playground</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Modular IDE</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-full px-3" onClick={onOpenWorkspace}>
          Workspaces
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onOpenIntelligence}>
          <Brain className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onThemeToggle}>
          <Palette className="h-4 w-4" />
        </Button>
        <Button variant="default" size="icon" className="rounded-full" onClick={onOpenSnippets}>
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function MobileActionBar({
  onOpenWorkspace,
  onOpenSnippets,
  onOpenIntelligence,
}: {
  onOpenWorkspace: () => void;
  onOpenSnippets: () => void;
  onOpenIntelligence: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center lg:hidden">
      <div className="pointer-events-auto flex w-[92%] max-w-lg items-center justify-between rounded-full border border-zinc-200/70 bg-white/95 px-4 py-2 shadow-2xl backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/90">
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100"
          onClick={onOpenWorkspace}
        >
          <PanelsTopLeft className="h-4 w-4" />
          Boards
        </Button>
        <Button
          size="sm"
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          onClick={onOpenSnippets}
        >
          <Sparkles className="h-4 w-4" />
          Snippets
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100"
          onClick={onOpenIntelligence}
        >
          <Brain className="h-4 w-4" />
          Intel
        </Button>
      </div>
    </div>
  );
}

export default App;