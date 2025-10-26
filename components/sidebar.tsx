import type { FC } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ABIManager } from "./abi-manager";
import { ScriptManager } from "./script-manager";
import type { StoredScript } from "@/lib/abiDatabase";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScriptLoad?: (script: StoredScript) => void;
  onScriptCreate?: (script: StoredScript) => void;
  onABIChange?: () => void;
  currentScript?: StoredScript | null;
}

const Sidebar = ({
  open,
  onOpenChange,
  onScriptLoad,
  onScriptCreate,
  onABIChange,
  currentScript,
}: SidebarProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle>Playground Library</SheetTitle>
        </SheetHeader>
        <div className="px-6">
          <Tabs defaultValue="scripts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scripts">Scripts</TabsTrigger>
              <TabsTrigger value="abis">ABIs</TabsTrigger>
            </TabsList>
            <TabsContent value="scripts" className="mt-4">
              <ScriptManager
                onScriptLoad={onScriptLoad}
                onScriptCreate={onScriptCreate}
                currentScript={currentScript}
              />
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
