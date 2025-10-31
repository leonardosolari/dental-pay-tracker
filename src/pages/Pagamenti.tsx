import { useState } from "react";
import { mockPazienti, mockPagamenti as initialPagamenti } from "@/lib/mockData";
import { Pagamento, Rata, ModalitaPagamento } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, FileText, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Pagamenti() {
  const [pagamenti, setPagamenti] = useState(initialPagamenti);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPagamento, setNewPagamento] = useState({
    pazienteId: "",
    nomeLavoro: "",
    modalita: "unico" as ModalitaPagamento,
    totale: 0,
    numeroRate: 1,
  });

  const handleAddPagamento = () => {
    if (!newPagamento.pazienteId || newPagamento.totale <= 0) {
      toast({
        title: "Errore",
        description: "Seleziona un paziente e inserisci un importo valido.",
        variant: "destructive",
      });
      return;
    }

    const pagamento: Pagamento = {
      id: Date.now().toString(),
      pazienteId: newPagamento.pazienteId,
      nomeLavoro: newPagamento.nomeLavoro.trim() || undefined,
      modalita: newPagamento.modalita,
      totale: newPagamento.totale,
      dataCreazione: new Date(),
    };

    setPagamenti([pagamento, ...pagamenti]);

    // Genera le rate se necessario
    if (newPagamento.modalita === "rate" && newPagamento.numeroRate > 1) {
      const ammontareRata = newPagamento.totale / newPagamento.numeroRate;
      const rateGenerate: Rata[] = [];

      for (let i = 0; i < newPagamento.numeroRate; i++) {
        const dataScadenza = new Date();
        dataScadenza.setMonth(dataScadenza.getMonth() + i);

        rateGenerate.push({
          id: `${Date.now()}-${i}`,
          pagamentoId: pagamento.id,
          numeroRata: i + 1,
          totaleRate: newPagamento.numeroRate,
          ammontare: ammontareRata,
          dataScadenza,
          stato: "futura",
        });
      }

      toast({
        title: "Pagamento creato",
        description: `Pagamento di €${newPagamento.totale.toFixed(2)} creato con ${newPagamento.numeroRate} rate.`,
      });
    } else {
      toast({
        title: "Pagamento creato",
        description: `Pagamento unico di €${newPagamento.totale.toFixed(2)} creato.`,
      });
    }

    setNewPagamento({
      pazienteId: "",
      nomeLavoro: "",
      modalita: "unico",
      totale: 0,
      numeroRate: 1,
    });
    setDialogOpen(false);
  };

  const getPazienteNome = (pazienteId: string) => {
    const paziente = mockPazienti.find((p) => p.id === pazienteId);
    return paziente ? `${paziente.nome} ${paziente.cognome}` : "Sconosciuto";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pagamenti</h1>
          <p className="mt-2 text-muted-foreground">Gestisci i pagamenti e le rate</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crea Nuovo Pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="paziente">Paziente *</Label>
                <Select value={newPagamento.pazienteId} onValueChange={(v) => setNewPagamento({ ...newPagamento, pazienteId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un paziente" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPazienti.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} {p.cognome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nomeLavoro">Nome Lavoro (Facoltativo)</Label>
                <Input
                  id="nomeLavoro"
                  value={newPagamento.nomeLavoro}
                  onChange={(e) => setNewPagamento({ ...newPagamento, nomeLavoro: e.target.value })}
                  placeholder="es. Implantologia, Ortodonzia..."
                />
              </div>

              <div>
                <Label htmlFor="totale">Totale (€) *</Label>
                <Input
                  id="totale"
                  type="number"
                  step="0.01"
                  value={newPagamento.totale || ""}
                  onChange={(e) => setNewPagamento({ ...newPagamento, totale: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Modalità di Pagamento *</Label>
                <RadioGroup
                  value={newPagamento.modalita}
                  onValueChange={(v) => setNewPagamento({ ...newPagamento, modalita: v as ModalitaPagamento })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unico" id="unico" />
                    <Label htmlFor="unico" className="font-normal">
                      Pagamento Unico
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rate" id="rate" />
                    <Label htmlFor="rate" className="font-normal">
                      Pagamento a Rate
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {newPagamento.modalita === "rate" && (
                <div>
                  <Label htmlFor="numeroRate">Numero di Rate *</Label>
                  <Input
                    id="numeroRate"
                    type="number"
                    min="2"
                    value={newPagamento.numeroRate}
                    onChange={(e) => setNewPagamento({ ...newPagamento, numeroRate: parseInt(e.target.value) || 1 })}
                  />
                  {newPagamento.totale > 0 && newPagamento.numeroRate > 1 && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ammontare rata: €{(newPagamento.totale / newPagamento.numeroRate).toFixed(2)} x{" "}
                      {newPagamento.numeroRate} rate mensili
                    </p>
                  )}
                </div>
              )}

              <Button onClick={handleAddPagamento} className="w-full">
                Crea Pagamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {pagamenti.map((pagamento) => (
          <Card key={pagamento.id} className="p-6 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="rounded-lg bg-accent/10 p-3">
                  {pagamento.modalita === "unico" ? (
                    <CreditCard className="h-6 w-6 text-accent" />
                  ) : (
                    <FileText className="h-6 w-6 text-accent" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{getPazienteNome(pagamento.pazienteId)}</h3>
                  {pagamento.nomeLavoro && <p className="mt-1 text-sm text-muted-foreground">{pagamento.nomeLavoro}</p>}
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="font-semibold text-foreground">€{pagamento.totale.toFixed(2)}</span>
                    <span className="text-muted-foreground">
                      {pagamento.modalita === "unico" ? "Pagamento unico" : "Pagamento rateale"}
                    </span>
                    <span className="text-muted-foreground">
                      {format(pagamento.dataCreazione, "dd MMM yyyy", { locale: it })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {pagamenti.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">Nessun pagamento registrato</h3>
          <p className="mt-2 text-muted-foreground">Crea il primo pagamento per iniziare.</p>
        </div>
      )}
    </div>
  );
}
