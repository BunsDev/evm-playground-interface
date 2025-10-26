"use client";

import { useState } from "react";
import Playground from "@/components/playground";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Library } from "lucide-react";
import type { CodeSnippet } from "@/lib/abiDatabase";

function App() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [abiRefreshKey, setAbiRefreshKey] = useState(0);
  const [pendingSnippet, setPendingSnippet] = useState<CodeSnippet | null>(null);

  const handleABIChange = () => {
    setAbiRefreshKey((prev) => prev + 1);
  };

  const handleSnippetInsert = (snippet: CodeSnippet) => {
    setPendingSnippet(snippet);
    setShowSidebar(false);
  };

  return (
    <div className="h-screen flex">
      {/* Main Playground */}
      <div className="flex-1 min-w-0">
        <Playground
          abiRefreshKey={abiRefreshKey}
          pendingSnippet={pendingSnippet}
          onSnippetConsumed={() => setPendingSnippet(null)}
        />
      </div>

      {/* Sidebar */}
      <Sidebar
        open={showSidebar}
        onOpenChange={setShowSidebar}
        onABIChange={handleABIChange}
        onSnippetInsert={handleSnippetInsert}
      />

      {/* Toggle Sidebar Button */}
      <Button
        onClick={() => setShowSidebar(!showSidebar)}
        className="fixed top-4 right-4 z-50"
        variant="outline"
        size="icon"
        title="Open Library"
      >
        <Library className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default App;