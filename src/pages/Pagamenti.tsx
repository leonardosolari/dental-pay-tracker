import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pagamento, Paziente, ModalitaPagamento } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar as CalendarIcon, Plus, FileText, CreditCard, Loader2, Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, addMonths } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Link } from "react-router-dom";

// --- TIPI LOCALI ---
interface RataInput {
  ammontare: number;
  dataScadenza: Date;
}

// --- FUNZIONI API ---
const fetchPagamenti = async (): Promise<Pagamento[]> => {
  const res = await fetch("http://127.0.0.1:5000/api/pagamenti");
  if (!res.ok) throw new Error("Errore nel fetch dei pagamenti");
  const data = await res.json();
  return data.map(p => ({...p, dataCreazione: new Date(p.dataCreazione)}));
};

const fetchPazienti = async (): Promise<Paziente[]> => {
  const res = await fetch("http://127.0.0.1:5000/api/pazienti");
  if (!res.ok) throw new Error("Errore nel fetch dei pazienti");
  const data = await res.json();
  return data.map(p => ({...p, dataCreazione: new Date(p.dataCreazione)}));
};

const addPagamento = async (pagamentoData: {
    pazienteId: string;
    nomeLavoro?: string;
    modalita: ModalitaPagamento;
    totale: number;
    rate: { ammontare: number; dataScadenza: string }[];
}) => {
    const res = await fetch("http://127.0.0.1:5000/api/pagamenti", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagamentoData)
    });
    if (!res.ok) throw new Error("Errore nella creazione del pagamento");
    return res.json();
}

const addPaziente = async (newPaziente: { nome: string; cognome: string }): Promise<Paziente> => {
    const response = await fetch("http://127.0.0.1:5000/api/pazienti", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPaziente),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nell'aggiunta del paziente");
    }
    return response.json();
};

export default function Pagamenti() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [newPagamento, setNewPagamento] = useState({
    pazienteId: "",
    nomeLavoro: "",
    modalita: "unico" as ModalitaPagamento,
    totale: 0,
    numeroRate: 1,
    rate: [] as RataInput[],
  });

  useEffect(() => {
    const { totale, modalita, numeroRate } = newPagamento;
    if (totale <= 0) {
      setNewPagamento(prev => ({ ...prev, rate: [] }));
      return;
    }

    const numRate = modalita === 'unico' ? 1 : numeroRate;
    if (numRate <= 0) {
        setNewPagamento(prev => ({ ...prev, rate: [] }));
        return;
    }

    const ammontareRata = parseFloat((totale / numRate).toFixed(2));
    const newRate: RataInput[] = [];

    for (let i = 0; i < numRate; i++) {
      newRate.push({
        ammontare: ammontareRata,
        dataScadenza: addMonths(new Date(), i + 1),
      });
    }
    
    if (numRate > 0) {
        const totalCalculated = newRate.reduce((sum, r) => sum + r.ammontare, 0);
        const difference = totale - totalCalculated;
        if (Math.abs(difference) > 0.001) {
            newRate[newRate.length - 1].ammontare += difference;
        }
    }

    setNewPagamento(prev => ({ ...prev, rate: newRate }));
  }, [newPagamento.totale, newPagamento.numeroRate, newPagamento.modalita]);

  const { data: pagamenti = [], isLoading: isLoadingPagamenti } = useQuery({ queryKey: ['pagamenti'], queryFn: fetchPagamenti });
  const { data: pazienti = [], isLoading: isLoadingPazienti } = useQuery({ queryKey: ['pazienti'], queryFn: fetchPazienti });

  const addPagamentoMutation = useMutation({
    mutationFn: addPagamento,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['pagamenti'] });
        queryClient.invalidateQueries({ queryKey: ['rate'] });
        setDialogOpen(false);
        toast({ title: "Pagamento creato con successo!" });
    },
    onError: (error) => {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const addPazienteMutation = useMutation({
    mutationFn: addPaziente,
    onSuccess: (newlyCreatedPaziente) => {
        queryClient.invalidateQueries({ queryKey: ['pazienti'] });
        setNewPagamento(prev => ({ ...prev, pazienteId: newlyCreatedPaziente.id }));
        setComboboxOpen(false);
        setSearchValue("");
        toast({ title: "Paziente creato e selezionato!" });
    },
    onError: (error: Error) => {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const handleDialogStateChange = (isOpen: boolean) => {
    setDialogOpen(isOpen);
    if (!isOpen) {
      setNewPagamento({ pazienteId: "", nomeLavoro: "", modalita: "unico", totale: 0, numeroRate: 1, rate: [] });
      setSearchValue("");
      setComboboxOpen(false);
    }
  };

  const handleAddPagamento = () => {
    if (!newPagamento.pazienteId || !newPagamento.totale || newPagamento.totale <= 0) {
      toast({ title: "Errore", description: "Paziente e totale sono obbligatori.", variant: "destructive" });
      return;
    }
    if (newPagamento.rate.length === 0) {
        toast({ title: "Errore", description: "Nessuna rata definita per il pagamento.", variant: "destructive" });
        return;
    }

    const totalFromRate = newPagamento.rate.reduce((sum, r) => sum + r.ammontare, 0);
    if (Math.abs(newPagamento.totale - totalFromRate) > 0.01) {
        toast({ title: "Errore", description: "La somma delle rate non corrisponde al totale.", variant: "destructive" });
        return;
    }

    const payload = {
        pazienteId: newPagamento.pazienteId,
        nomeLavoro: newPagamento.nomeLavoro,
        modalita: newPagamento.modalita,
        totale: newPagamento.totale,
        rate: newPagamento.rate.map(r => ({
            ...r,
            ammontare: parseFloat(r.ammontare.toFixed(2)),
            dataScadenza: format(r.dataScadenza, "yyyy-MM-dd")
        }))
    };
    addPagamentoMutation.mutate(payload);
  };

  const handleCreatePaziente = () => {
    const fullName = searchValue.trim();
    const names = fullName.split(/\s+/).filter(n => n);
    if (names.length < 2) {
        toast({ title: "Input non valido", description: "Per creare un nuovo paziente, inserisci sia nome che cognome.", variant: "destructive" });
        return;
    }
    const cognome = names.pop() as string;
    const nome = names.join(" ");
    addPazienteMutation.mutate({ nome, cognome });
  };

  const filteredPazienti = searchValue === ""
    ? pazienti
    : pazienti.filter(p => 
        `${p.nome} ${p.cognome}`.toLowerCase().includes(searchValue.toLowerCase())
      );
  
  const canCreatePaziente = filteredPazienti.length === 0 && searchValue.trim().split(/\s+/).filter(n => n).length >= 2;
  const selectedPaziente = pazienti.find(p => p.id === newPagamento.pazienteId);

  if (isLoadingPagamenti || isLoadingPazienti) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pagamenti</h1>
          <p className="mt-2 text-muted-foreground">Gestisci i pagamenti e le rate</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogStateChange}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nuovo Pagamento</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Crea Nuovo Pagamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="paziente">Paziente *</Label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={comboboxOpen} className="w-full justify-between font-normal">
                      {selectedPaziente ? `${selectedPaziente.nome} ${selectedPaziente.cognome}` : "Seleziona o crea un paziente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Cerca per nome e cognome..." value={searchValue} onValueChange={setSearchValue} />
                      <CommandList>
                        <CommandEmpty>Nessun paziente trovato. Inserisci nome e cognome per creare un nuovo paziente.</CommandEmpty>
                        <CommandGroup>
                          {filteredPazienti.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={`${p.nome} ${p.cognome}`}
                                onSelect={() => {
                                  setNewPagamento({ ...newPagamento, pazienteId: p.id });
                                  setComboboxOpen(false);
                                  setSearchValue("");
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", newPagamento.pazienteId === p.id ? "opacity-100" : "opacity-0")} />
                                {p.nome} {p.cognome}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandGroup>
                            <CommandItem
                                onSelect={handleCreatePaziente}
                                disabled={addPazienteMutation.isPending}
                                className="cursor-pointer"
                                style={{ display: canCreatePaziente ? 'flex' : 'none' }}
                            >
                            {addPazienteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Crea e seleziona "{searchValue}"
                            </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="nomeLavoro">Nome Lavoro (Facoltativo)</Label>
                <Input id="nomeLavoro" value={newPagamento.nomeLavoro} onChange={(e) => setNewPagamento({ ...newPagamento, nomeLavoro: e.target.value })} placeholder="es. Implantologia..." />
              </div>
              <div>
                <Label htmlFor="totale">Totale (€) *</Label>
                <Input id="totale" type="number" step="0.01" value={newPagamento.totale || ""} onChange={(e) => setNewPagamento({ ...newPagamento, totale: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
              </div>
              <div>
                <Label>Modalità di Pagamento *</Label>
                <RadioGroup value={newPagamento.modalita} onValueChange={(v) => setNewPagamento({ ...newPagamento, modalita: v as ModalitaPagamento, numeroRate: v === 'unico' ? 1 : 2 })} className="mt-2">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="unico" id="unico" /><Label htmlFor="unico" className="font-normal">Pagamento Unico</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="rate" id="rate" /><Label htmlFor="rate" className="font-normal">Pagamento a Rate</Label></div>
                </RadioGroup>
              </div>
              {newPagamento.modalita === "rate" && (
                <div>
                  <Label htmlFor="numeroRate">Numero di Rate *</Label>
                  <Input id="numeroRate" type="number" min="2" value={newPagamento.numeroRate} onChange={(e) => setNewPagamento({ ...newPagamento, numeroRate: parseInt(e.target.value) || 2 })} />
                </div>
              )}
              {newPagamento.rate.length > 0 && (
                <div className="space-y-3 rounded-md border p-4 max-h-60 overflow-y-auto">
                    <h4 className="font-medium text-sm">Dettaglio Scadenze</h4>
                    {newPagamento.rate.map((rata, index) => (
                        <div key={index} className="flex items-center gap-2 flex-wrap">
                            <Label htmlFor={`rata-ammontare-${index}`} className="text-sm text-muted-foreground w-20 min-w-fit">Rata {index + 1}:</Label>
                            <Input
                                id={`rata-ammontare-${index}`}
                                type="number"
                                step="0.01"
                                value={rata.ammontare.toFixed(2)}
                                onChange={(e) => {
                                    const updatedRate = [...newPagamento.rate];
                                    updatedRate[index].ammontare = parseFloat(e.target.value) || 0;
                                    setNewPagamento(prev => ({ ...prev, rate: updatedRate }));
                                }}
                                className="w-32"
                            />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[240px] justify-start text-left font-normal",
                                            !rata.dataScadenza && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {rata.dataScadenza ? format(rata.dataScadenza, "PPP", { locale: it }) : <span>Scegli una data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={rata.dataScadenza}
                                        onSelect={(date) => {
                                            if (date) {
                                                const updatedRate = [...newPagamento.rate];
                                                updatedRate[index].dataScadenza = date;
                                                setNewPagamento(prev => ({ ...prev, rate: updatedRate }));
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    ))}
                </div>
              )}
              <Button onClick={handleAddPagamento} disabled={addPagamentoMutation.isPending} className="w-full">
                {addPagamentoMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crea Pagamento'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {pagamenti.map((pagamento) => (
          <Link to={`/pagamenti/${pagamento.id}`} key={pagamento.id} className="block">
            <Card className="p-6 transition-shadow hover:shadow-md h-full">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="rounded-lg bg-accent/10 p-3">{pagamento.modalita === "unico" ? <CreditCard className="h-6 w-6 text-accent" /> : <FileText className="h-6 w-6 text-accent" />}</div>
                  <div>
                    <h3 className="font-semibold text-foreground">{pagamento.pazienteNome}</h3>
                    {pagamento.nomeLavoro && <p className="mt-1 text-sm text-muted-foreground">{pagamento.nomeLavoro}</p>}
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="font-semibold text-foreground">€{pagamento.totale.toFixed(2)}</span>
                      <span className="text-muted-foreground">{pagamento.modalita === "unico" ? "Pagamento unico" : "Pagamento rateale"}</span>
                      <span className="text-muted-foreground">{format(pagamento.dataCreazione, "dd MMM yyyy", { locale: it })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      
      {pagamenti.length === 0 && !isLoadingPagamenti && (
         <div className="rounded-lg border border-dashed border-border bg-muted/50 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Nessun pagamento registrato</h3>
            <p className="mt-2 text-muted-foreground">Crea il primo pagamento per iniziare.</p>
        </div>
      )}
    </div>
  );
}