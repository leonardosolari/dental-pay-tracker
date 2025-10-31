import { useState } from "react";
import { mockPazienti as initialPazienti } from "@/lib/mockData";
import { Paziente } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, UserCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Pazienti() {
  const [pazienti, setPazienti] = useState(initialPazienti);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPaziente, setNewPaziente] = useState({ nome: "", cognome: "" });

  const filteredPazienti = pazienti.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cognome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPaziente = () => {
    if (!newPaziente.nome.trim() || !newPaziente.cognome.trim()) {
      toast({
        title: "Errore",
        description: "Nome e cognome sono obbligatori.",
        variant: "destructive",
      });
      return;
    }

    const paziente: Paziente = {
      id: Date.now().toString(),
      nome: newPaziente.nome.trim(),
      cognome: newPaziente.cognome.trim(),
      dataCreazione: new Date(),
    };

    setPazienti([paziente, ...pazienti]);
    setNewPaziente({ nome: "", cognome: "" });
    setDialogOpen(false);

    toast({
      title: "Paziente aggiunto",
      description: `${paziente.nome} ${paziente.cognome} è stato aggiunto con successo.`,
    });
  };

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
                <Input
                  id="nome"
                  value={newPaziente.nome}
                  onChange={(e) => setNewPaziente({ ...newPaziente, nome: e.target.value })}
                  placeholder="Mario"
                />
              </div>
              <div>
                <Label htmlFor="cognome">Cognome *</Label>
                <Input
                  id="cognome"
                  value={newPaziente.cognome}
                  onChange={(e) => setNewPaziente({ ...newPaziente, cognome: e.target.value })}
                  placeholder="Rossi"
                />
              </div>
              <Button onClick={handleAddPaziente} className="w-full">
                Aggiungi Paziente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cerca per nome o cognome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPazienti.map((paziente) => (
          <Card key={paziente.id} className="p-6 transition-shadow hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <UserCircle className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {paziente.nome} {paziente.cognome}
                </h3>
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
          <p className="mt-2 text-muted-foreground">
            {searchTerm ? "Prova con un altro termine di ricerca." : "Aggiungi il primo paziente per iniziare."}
          </p>
        </div>
      )}
    </div>
  );
}
