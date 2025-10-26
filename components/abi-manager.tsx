import { type FC, useState, useEffect, useCallback } from "react";
import { abiDb } from "@/lib/abiDatabase";
import type { StoredABI } from "@/lib/abiDatabase";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

interface ABIManagerProps {
  onABIChange?: () => void;
}

/**
 * Manages locally persisted ABIs so scripts can reuse them inside the playground.
 */
export const ABIManager: FC<ABIManagerProps> = ({ onABIChange }) => {
  const [abis, setAbis] = useState<StoredABI[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAbi, setNewAbi] = useState({
    name: "",
    abi: "",
    description: "",
  });

  const loadABIs = useCallback(async () => {
    const allAbis = await abiDb.abis.toArray();
    setAbis(allAbis);
  }, []);

  useEffect(() => {
    void loadABIs();
  }, [loadABIs]);

  const handleAddABI = async () => {
    try {
      const trimmedName = newAbi.name.trim();
      const rawAbi = newAbi.abi.trim();

      if (!trimmedName || !rawAbi) {
        alert("Name and ABI JSON are required");
        return;
      }

      // Parse once so we fail fast on malformed JSON before mutating state.
      const abi = JSON.parse(rawAbi);
      await abiDb.abis.add({
        name: trimmedName,
        abi,
        description: newAbi.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        slug: ""
      });
      setNewAbi({ name: "", abi: "", description: "" });
      setShowAddForm(false);
      await loadABIs();
      onABIChange?.();
    } catch (error) {
      alert("Invalid ABI JSON");
    }
  };

  const handleDeleteABI = async (id: number) => {
    if (confirm("Are you sure you want to delete this ABI?")) {
      await abiDb.abis.delete(id);
      await loadABIs();
      onABIChange?.();
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 rounded-3xl border border-zinc-200/70 bg-white/70 p-5 shadow-lg shadow-zinc-200/40 backdrop-blur dark:border-zinc-700/60 dark:bg-zinc-900/70 dark:shadow-zinc-900/40">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">ABI Library</h2>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Store contract interfaces for quick imports into your snippets.
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="rounded-full bg-zinc-950 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add ABI
        </Button>
      </div>

      {showAddForm && (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/80 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <input
            type="text"
            placeholder="ABI Name (e.g., CoinbaseSmartWalletABI)"
            value={newAbi.name}
            onChange={(e) => setNewAbi({ ...newAbi, name: e.target.value })}
            className="mb-2 w-full rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newAbi.description}
            onChange={(e) =>
              setNewAbi({ ...newAbi, description: e.target.value })
            }
            className="mb-2 w-full rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <textarea
            placeholder="Paste ABI JSON here..."
            value={newAbi.abi}
            onChange={(e) => setNewAbi({ ...newAbi, abi: e.target.value })}
            rows={10}
            className="mb-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-zinc-100"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleAddABI}
              className="rounded-full bg-zinc-950 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Save ABI
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-4 text-xs font-semibold uppercase tracking-[0.12em]"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {abis.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
            No ABIs stored yet. Add your first ABI to get started.
          </div>
        ) : (
          abis.map((abi) => (
            <div
              key={abi.id}
              className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {abi.name}
                  </div>
                  {abi.description && (
                    <div className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      {abi.description}
                    </div>
                  )}
                  <div className="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                    {Array.isArray(abi.abi)
                      ? `${abi.abi.length} entries`
                      : "Custom schema"}
                    {" • Updated "}
                    {abi.updatedAt.toLocaleDateString()}
                  </div>
                </div>
                <Button
                  onClick={() => handleDeleteABI(abi.id!)}
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full border border-transparent bg-zinc-900/5 text-zinc-600 hover:border-zinc-300 hover:bg-white hover:text-zinc-950 dark:bg-zinc-800/40 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  <Icon icon="lucide:trash" height={14} width={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
