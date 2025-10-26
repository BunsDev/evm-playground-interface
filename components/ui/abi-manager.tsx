import { type FC, useState, useEffect, useCallback } from "react";
import { abiDb } from "@/lib/abiDatabase";
import type { StoredABI } from "@/lib/abiDatabase";
import { Button } from "@/components/ui/button";

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
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">ABI Library</h2>
        <Button onClick={() => setShowAddForm(true)}>Add ABI</Button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <input
            type="text"
            placeholder="ABI Name (e.g., CoinbaseSmartWalletABI)"
            value={newAbi.name}
            onChange={(e) => setNewAbi({ ...newAbi, name: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newAbi.description}
            onChange={(e) =>
              setNewAbi({ ...newAbi, description: e.target.value })
            }
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
          <textarea
            placeholder="Paste ABI JSON here..."
            value={newAbi.abi}
            onChange={(e) => setNewAbi({ ...newAbi, abi: e.target.value })}
            rows={10}
            className="w-full p-2 border border-gray-300 rounded mb-2 font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={handleAddABI}>Save ABI</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {abis.length === 0 ? (
          <div className="text-gray-500 italic text-center py-8">
            No ABIs stored yet. Add your first ABI to get started.
          </div>
        ) : (
          abis.map((abi) => (
            <div key={abi.id} className="p-3 border rounded bg-white">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{abi.name}</div>
                  {abi.description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {abi.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {abi.abi.length} functions • Updated{" "}
                    {abi.updatedAt.toLocaleDateString()}
                  </div>
                </div>
                <Button
                  onClick={() => handleDeleteABI(abi.id!)}
                  variant="destructive"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
