import { useState } from "react";
import { Paziente } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, UserCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
// Importiamo i tool di react-query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Funzione per recuperare i pazienti dal backend
const fetchPazienti = async (): Promise<Paziente[]> => {
  const response = await fetch("http://127.0.0.1:5000/api/pazienti");
  if (!response.ok) {
    throw new Error("Errore nel recupero dei pazienti");
  }
  // Dobbiamo convertire le date da stringa a oggetto Date
  const data = await response.json();
  return data.map(p => ({...p, dataCreazione: new Date(p.dataCreazione)}));
};

// Funzione per aggiungere un nuovo paziente tramite API
const addPaziente = async (newPaziente: { nome: string; cognome: string }): Promise<Paziente> => {
    const response = await fetch("http://127.0.0.1:5000/api/pazienti", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPaziente),
    });
    if (!response.ok) {
        throw new Error("Errore nell'aggiunta del paziente");
    }
    return response.json();
};

export default function Pazienti() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPaziente, setNewPaziente] = useState({ nome: "", cognome: "" });

  // --- REACT QUERY AL POSTO DI useState ---
  // Usiamo useQuery per fetchare e gestire i dati dei pazienti
  const { data: pazienti = [], isLoading, isError } = useQuery<Paziente[]>({
    queryKey: ['pazienti'],
    queryFn: fetchPazienti,
  });

  // Usiamo useMutation per gestire l'aggiunta di un nuovo paziente
  const mutation = useMutation({
    mutationFn: addPaziente,
    onSuccess: () => {
        // Se la mutazione ha successo, invalidiamo la query 'pazienti'.
        // Questo fa sì che react-query ricarichi automaticamente la lista.
        queryClient.invalidateQueries({ queryKey: ['pazienti'] });
        setDialogOpen(false);
        setNewPaziente({ nome: "", cognome: "" });
        toast({
            title: "Paziente aggiunto con successo!",
        });
    },
    onError: () => {
        toast({
            title: "Errore",
            description: "Impossibile aggiungere il paziente.",
            variant: "destructive",
        });
    }
  });

  const handleAddPaziente = () => {
    if (!newPaziente.nome.trim() || !newPaziente.cognome.trim()) {
      toast({
        title: "Errore",
        description: "Nome e cognome sono obbligatori.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(newPaziente);
  };

  const filteredPazienti = pazienti.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cognome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- GESTIONE STATI DI CARICAMENTO ED ERRORE ---
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (isError) {
      return <div className="text-center text-destructive">Errore nel caricamento dei dati. Assicurati che il backend sia in esecuzione.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pazienti</h1>
          <p className="mt-2 text-muted-foreground">Gestisci l'anagrafica dei pazienti</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Paziente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aggiungi Nuovo Paziente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" value={newPaziente.nome} onChange={(e) => setNewPaziente({ ...newPaziente, nome: e.target.value })} placeholder="Mario" />
              </div>
              <div>
                <Label htmlFor="cognome">Cognome *</Label>
                <Input id="cognome" value={newPaziente.cognome} onChange={(e) => setNewPaziente({ ...newPaziente, cognome: e.target.value })} placeholder="Rossi" />
              </div>
              <Button onClick={handleAddPaziente} disabled={mutation.isPending} className="w-full">
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Aggiungi Paziente'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cerca per nome o cognome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPazienti.map((paziente) => (
          <Card key={paziente.id} className="p-6 transition-shadow hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <UserCircle className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{paziente.nome} {paziente.cognome}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Registrato il {format(paziente.dataCreazione, "dd MMM yyyy", { locale: it })}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredPazienti.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-12 text-center">
          <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">Nessun paziente trovato</h3>
          <p className="mt-2 text-muted-foreground">{searchTerm ? "Prova con un altro termine di ricerca." : "Aggiungi il primo paziente per iniziare."}</p>
        </div>
      )}
    </div>
  );
}