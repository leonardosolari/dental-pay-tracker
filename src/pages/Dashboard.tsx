import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Rata } from "@/types";
import StatCard from "@/components/StatCard";
import RataCard from "@/components/RataCard"; // <-- 1. IMPORTA IL COMPONENTE
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, AlertCircle, Clock, Users, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

// --- API FUNCTIONS ---
const fetchRate = async (): Promise<Rata[]> => {
    const res = await fetch("http://127.0.0.1:5000/api/rate");
    if (!res.ok) throw new Error("Errore fetch rate");
    const data = await res.json();
    return data.map(r => ({...r, dataScadenza: new Date(r.dataScadenza)}));
}

const fetchPazientiCount = async (): Promise<number> => {
    const res = await fetch("http://127.0.0.1:5000/api/pazienti");
    if (!res.ok) throw new Error("Errore fetch pazienti");
    const data = await res.json();
    return data.length;
}

const updateRata = async (rataData: {id: string; ammontare: number; dataScadenza: string}) => {
    const res = await fetch(`http://127.0.0.1:5000/api/rate/${rataData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ammontare: rataData.ammontare, dataScadenza: rataData.dataScadenza})
    });
    if (!res.ok) throw new Error("Errore aggiornamento rata");
    return res.json();
}

const pagaRata = async (rataId: string) => {
    const res = await fetch(`http://127.0.0.1:5000/api/rate/${rataId}/paga`, { method: 'POST' });
    if (!res.ok) throw new Error("Errore pagamento rata");
    return res.json();
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [editingRata, setEditingRata] = useState<Rata | null>(null);
  const [editForm, setEditForm] = useState({ ammontare: 0, dataScadenza: "" });
  
  const { data: rate = [], isLoading: isLoadingRate } = useQuery({ queryKey: ['rate'], queryFn: fetchRate });
  const { data: totalePazienti = 0 } = useQuery({ queryKey: ['pazientiCount'], queryFn: fetchPazientiCount });

  const updateMutation = useMutation({
    mutationFn: updateRata,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['rate'] });
        setEditingRata(null);
        toast({ title: "Rata modificata con successo!" });
    }
  });

  const pagaMutation = useMutation({
    mutationFn: pagaRata,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['rate'] });
        toast({ title: "Pagamento registrato!" });
    }
  });
  
  const handleEdit = (rata: Rata) => {
    setEditingRata(rata);
    setEditForm({ ammontare: rata.ammontare, dataScadenza: format(rata.dataScadenza, "yyyy-MM-dd") });
  };
  
  const handleSaveEdit = () => {
    if (!editingRata) return;
    updateMutation.mutate({ id: editingRata.id, ...editForm });
  };

  const handlePaga = (rata: Rata) => {
    pagaMutation.mutate(rata.id);
  };
  
  const rateScadenzaOggi = rate.filter((r) => r.stato === "scadenza_oggi");
  const rateScadute = rate.filter((r) => r.stato === "scaduta");
  
  // <-- 2. RIMUOVI LA DEFINIZIONE LOCALE DI RataCard CHE ERA QUI -->

  if (isLoadingRate) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

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
          <div className="mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-warning" /><h2 className="text-xl font-semibold text-foreground">Rate in scadenza oggi</h2></div>
          <div className="space-y-3">
            {/* <-- 3. USA IL COMPONENTE IMPORTATO --> */}
            {rateScadenzaOggi.map((rata) => (<RataCard key={rata.id} rata={rata} onEdit={handleEdit} onPaga={handlePaga} />))}
          </div>
        </div>
      )}

      {rateScadute.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" /><h2 className="text-xl font-semibold text-foreground">Rate scadute non pagate</h2></div>
          <div className="space-y-3">
            {/* <-- 3. USA IL COMPONENTE IMPORTATO --> */}
            {rateScadute.map((rata) => (<RataCard key={rata.id} rata={rata} onEdit={handleEdit} onPaga={handlePaga} />))}
          </div>
        </div>
      )}

      {rateScadenzaOggi.length === 0 && rateScadute.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold text-foreground">Nessuna rata in scadenza</h3><p className="mt-2 text-muted-foreground">Tutti i pagamenti sono in regola!</p>
        </div>
      )}

      <Dialog open={!!editingRata} onOpenChange={() => setEditingRata(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifica Rata</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="ammontare">Ammontare (€)</Label><Input id="ammontare" type="number" step="0.01" value={editForm.ammontare} onChange={(e) => setEditForm({ ...editForm, ammontare: parseFloat(e.target.value) })} /></div>
            <div><Label htmlFor="dataScadenza">Data Scadenza</Label><Input id="dataScadenza" type="date" value={editForm.dataScadenza} onChange={(e) => setEditForm({ ...editForm, dataScadenza: e.target.value })} /></div>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="w-full">{updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Salva Modifiche'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}