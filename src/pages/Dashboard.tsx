import { useState } from "react";
import { mockRate, mockPazienti } from "@/lib/mockData";
import { Rata } from "@/types";
import StatCard from "@/components/StatCard";
import RataCard from "@/components/RataCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, AlertCircle, Clock, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Dashboard() {
  const [rate, setRate] = useState(mockRate);
  const [editingRata, setEditingRata] = useState<Rata | null>(null);
  const [editForm, setEditForm] = useState({ ammontare: 0, dataScadenza: "" });

  const rateScadenzaOggi = rate.filter((r) => r.stato === "scadenza_oggi");
  const rateScadute = rate.filter((r) => r.stato === "scaduta");
  const totalePazienti = mockPazienti.length;

  const handleEdit = (rata: Rata) => {
    setEditingRata(rata);
    setEditForm({
      ammontare: rata.ammontare,
      dataScadenza: format(rata.dataScadenza, "yyyy-MM-dd"),
    });
  };

  const handleSaveEdit = () => {
    if (!editingRata) return;

    setRate(
      rate.map((r) =>
        r.id === editingRata.id
          ? {
              ...r,
              ammontare: editForm.ammontare,
              dataScadenza: new Date(editForm.dataScadenza),
            }
          : r
      )
    );

    toast({
      title: "Rata modificata",
      description: "Le modifiche sono state salvate con successo.",
    });

    setEditingRata(null);
  };

  const handlePaga = (rata: Rata) => {
    setRate(
      rate.map((r) =>
        r.id === rata.id
          ? {
              ...r,
              stato: "pagata" as const,
              dataPagamento: new Date(),
            }
          : r
      )
    );

    toast({
      title: "Pagamento registrato",
      description: "La rata è stata segnata come pagata.",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Panoramica dei pagamenti in scadenza</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Rate in scadenza oggi" value={rateScadenzaOggi.length} icon={Clock} variant="warning" />
        <StatCard title="Rate scadute" value={rateScadute.length} icon={AlertCircle} variant="destructive" />
        <StatCard title="Pazienti totali" value={totalePazienti} icon={Users} variant="success" />
      </div>

      {rateScadenzaOggi.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-warning" />
            <h2 className="text-xl font-semibold text-foreground">Rate in scadenza oggi</h2>
          </div>
          <div className="space-y-3">
            {rateScadenzaOggi.map((rata) => (
              <RataCard key={rata.id} rata={rata} onEdit={handleEdit} onPaga={handlePaga} />
            ))}
          </div>
        </div>
      )}

      {rateScadute.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h2 className="text-xl font-semibold text-foreground">Rate scadute non pagate</h2>
          </div>
          <div className="space-y-3">
            {rateScadute.map((rata) => (
              <RataCard key={rata.id} rata={rata} onEdit={handleEdit} onPaga={handlePaga} />
            ))}
          </div>
        </div>
      )}

      {rateScadenzaOggi.length === 0 && rateScadute.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">Nessuna rata in scadenza</h3>
          <p className="mt-2 text-muted-foreground">Tutti i pagamenti sono in regola!</p>
        </div>
      )}

      <Dialog open={!!editingRata} onOpenChange={() => setEditingRata(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Rata</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ammontare">Ammontare (€)</Label>
              <Input
                id="ammontare"
                type="number"
                step="0.01"
                value={editForm.ammontare}
                onChange={(e) => setEditForm({ ...editForm, ammontare: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="dataScadenza">Data Scadenza</Label>
              <Input
                id="dataScadenza"
                type="date"
                value={editForm.dataScadenza}
                onChange={(e) => setEditForm({ ...editForm, dataScadenza: e.target.value })}
              />
            </div>
            <Button onClick={handleSaveEdit} className="w-full">
              Salva Modifiche
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
