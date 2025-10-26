import type { FC } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ABIManager } from "./abi-manager";
import { SnippetManager } from "./snippet-manager";
import type { CodeSnippet } from "@/lib/abiDatabase";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onABIChange?: () => void;
  onSnippetInsert?: (snippet: CodeSnippet) => void;
}

const Sidebar: FC<SidebarProps> = ({
  open,
  onOpenChange,
  onABIChange,
  onSnippetInsert,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="h-full w-[420px] border-l border-zinc-200/80 bg-linear-to-b from-white/90 via-white/80 to-white/70 p-0 shadow-2xl backdrop-blur dark:border-zinc-800/60 dark:from-zinc-950/95 dark:via-zinc-950/90 dark:to-zinc-900"
      >
        <SheetHeader className="space-y-4 px-6 pb-6 pt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
            Playground Library
          </div>
          <div className="space-y-2">
            <SheetTitle className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              Build faster with curated resources
            </SheetTitle>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Drop in common viem flows or reference ABIs without leaving your editor.
            </p>
          </div>
        </SheetHeader>
        <div className="h-[calc(100%-180px)] overflow-hidden px-6 pb-8">
          <Tabs defaultValue="snippets" className="flex h-full flex-col">
            <TabsList className="flex w-full gap-2 rounded-full border border-zinc-200/80 bg-white/80 p-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400">
              <TabsTrigger
                value="snippets"
                className="flex-1 rounded-full px-4 py-2 data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-50 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-950"
              >
                Snippets
              </TabsTrigger>
              <TabsTrigger
                value="abis"
                className="flex-1 rounded-full px-4 py-2 data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-50 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-950"
              >
                ABIs
              </TabsTrigger>
            </TabsList>
            <TabsContent value="snippets" className="mt-6 flex-1">
              <SnippetManager onSnippetInsert={onSnippetInsert} />
            </TabsContent>
            <TabsContent value="abis" className="mt-6 flex-1">
              <ABIManager onABIChange={onABIChange} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
