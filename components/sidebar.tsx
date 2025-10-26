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

const Sidebar = ({
  open,
  onOpenChange,
  onABIChange,
  onSnippetInsert,
}: SidebarProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle>Playground Library</SheetTitle>
        </SheetHeader>
        <div className="px-6">
          <Tabs defaultValue="snippets" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="snippets">Snippets</TabsTrigger>
              <TabsTrigger value="abis">ABIs</TabsTrigger>
            </TabsList>
            <TabsContent value="snippets" className="mt-4">
              <SnippetManager onSnippetInsert={onSnippetInsert} />
            </TabsContent>
            <TabsContent value="abis" className="mt-4">
              <ABIManager onABIChange={onABIChange} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
