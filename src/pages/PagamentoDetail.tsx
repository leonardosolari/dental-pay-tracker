import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pagamento, Rata, StatoRata } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, User, FileText, Euro, Calendar, CheckCircle2, Loader2, Edit, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE_URL = "http://127.0.0.1:5000/api";

const fetchPagamento = async (id: string): Promise<Pagamento> => {
  const res = await fetch(`${API_BASE_URL}/pagamenti/${id}`);
  if (!res.ok) throw new Error("Pagamento non trovato");
  const data = await res.json();
  return { ...data, dataCreazione: new Date(data.dataCreazione) };
};

const fetchRatePagamento = async (id: string): Promise<Rata[]> => {
  const res = await fetch(`${API_BASE_URL}/pagamenti/${id}/rate`);
  if (!res.ok) throw new Error("Errore nel recupero delle rate");
  const data = await res.json();
  return data.map((r) => ({ ...r, dataScadenza: new Date(r.dataScadenza), dataPagamento: r.dataPagamento ? new Date(r.dataPagamento) : undefined }));
};

const pagaRata = async (rataId: string) => {
    const res = await fetch(`${API_BASE_URL}/rate/${rataId}/paga`, { method: 'POST' });
    if (!res.ok) throw new Error("Errore pagamento rata");
    return res.json();
}

const updatePagamento = async (pagamentoData: { id: string; nomeLavoro: string; totale: number }): Promise<Pagamento> => {
    const { id, ...data } = pagamentoData;
    const res = await fetch(`${API_BASE_URL}/pagamenti/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Errore nell'aggiornamento del pagamento");
    return res.json();
}

const updateRata = async (rataData: { id: string; ammontare: number; dataScadenza: string; stato: StatoRata }) => {
    const { id, ...data } = rataData;
    const res = await fetch(`${API_BASE_URL}/rate/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Errore nell'aggiornamento della rata");
    return res.json();
}

const deletePagamento = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/pagamenti/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Errore nell'eliminazione del pagamento");
};

export default function PagamentoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPagamentoEditDialogOpen, setIsPagamentoEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editPagamentoForm, setEditPagamentoForm] = useState({ nomeLavoro: "", totale: 0 });
  
  const [editingRata, setEditingRata] = useState<Rata | null>(null);
  const [editRataForm, setEditRataForm] = useState({ ammontare: 0, dataScadenza: "", stato: "futura" as StatoRata });

  const { data: pagamento, isLoading: isLoadingPagamento, isError: isErrorPagamento } = useQuery({
    queryKey: ["pagamento", id],
    queryFn: () => fetchPagamento(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (pagamento) {
        setEditPagamentoForm({
            nomeLavoro: pagamento.nomeLavoro || "",
            totale: pagamento.totale
        });
    }
  }, [pagamento]);

  useEffect(() => {
    if (editingRata) {
        setEditRataForm({
            ammontare: editingRata.ammontare,
            dataScadenza: format(editingRata.dataScadenza, "yyyy-MM-dd"),
            stato: editingRata.stato === 'pagata' ? 'pagata' : 'futura'
        });
    }
  }, [editingRata]);

  const { data: rate = [], isLoading: isLoadingRate } = useQuery({
    queryKey: ["ratePagamento", id],
    queryFn: () => fetchRatePagamento(id!),
    enabled: !!id,
  });

  const pagaMutation = useMutation({
    mutationFn: pagaRata,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['ratePagamento', id] });
        queryClient.invalidateQueries({ queryKey: ['rate'] });
        toast({ title: "Pagamento registrato!" });
    }
  });

  const updatePagamentoMutation = useMutation({
    mutationFn: updatePagamento,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['pagamento', id] });
        queryClient.invalidateQueries({ queryKey: ['ratePagamento', id] });
        queryClient.invalidateQueries({ queryKey: ['pagamenti'] });
        setIsPagamentoEditDialogOpen(false);
        toast({ title: "Pagamento aggiornato con successo!" });
    },
    onError: (error) => {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const updateRataMutation = useMutation({
    mutationFn: updateRata,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['ratePagamento', id] });
        queryClient.invalidateQueries({ queryKey: ['rate'] });
        setEditingRata(null);
        toast({ title: "Rata aggiornata con successo!" });
    },
    onError: (error) => {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deletePagamento,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['pagamenti'] });
        queryClient.invalidateQueries({ queryKey: ['rate'] });
        toast({ title: "Pagamento eliminato con successo!" });
        navigate("/pagamenti");
    },
    onError: (error) => {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const handleSavePagamentoChanges = () => {
    if (!id) return;
    updatePagamentoMutation.mutate({ id, ...editPagamentoForm });
  }

  const handleSaveRataChanges = () => {
    if (!editingRata) return;
    updateRataMutation.mutate({ id: editingRata.id, ...editRataForm });
  }

  const handleDelete = () => {
    if (!id) return;
    deleteMutation.mutate(id);
  }

  const getBadgeVariant = (stato: Rata["stato"]) => {
    switch (stato) {
      case "pagata": return "default";
      case "scadenza_oggi": return "secondary";
      case "scaduta": return "destructive";
      default: return "outline";
    }
  };

  const getBadgeText = (stato: Rata["stato"]) => {
    switch (stato) {
      case "pagata": return "Pagata";
      case "scadenza_oggi": return "Scade oggi";
      case "scaduta": return "Scaduta";
      default: return "Futura";
    }
  };

  if (isLoadingPagamento || isLoadingRate) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isErrorPagamento || !pagamento) {
    return <div className="text-center text-destructive">Pagamento non trovato o errore nel caricamento.</div>;
  }

  return (
    <div className="space-y-8">
      <Link to="/pagamenti" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Torna a tutti i pagamenti
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <FileText className="h-6 w-6" />
              {pagamento.nomeLavoro || "Pagamento generico"}
            </CardTitle>
            <CardDescription>
              Dettagli del piano di pagamento
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setIsPagamentoEditDialogOpen(true)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-md border p-4">
                <User className="h-6 w-6 text-muted-foreground"/>
                <div>
                    <p className="text-sm text-muted-foreground">Paziente</p>
                    <Link to={`/pazienti/${pagamento.pazienteId}`}>
                        <p className="font-medium hover:underline">{pagamento.pazienteNome}</p>
                    </Link>
                </div>
            </div>
            <div className="flex items-center gap-3 rounded-md border p-4">
                <Euro className="h-6 w-6 text-muted-foreground"/>
                <div>
                    <p className="text-sm text-muted-foreground">Importo Totale</p>
                    <p className="font-medium">€{pagamento.totale.toFixed(2)}</p>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Piano Rateale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rata</TableHead>
                <TableHead>Scadenza</TableHead>
                <TableHead>Importo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Data Pagamento</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rate.map((rata) => (
                <TableRow key={rata.id} className={cn(rata.stato === 'scaduta' && 'bg-destructive/5')}>
                  <TableCell>{rata.numeroRata}/{rata.totaleRate}</TableCell>
                  <TableCell>{format(rata.dataScadenza, "dd MMM yyyy", { locale: it })}</TableCell>
                  <TableCell>€{rata.ammontare.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(rata.stato)}>{getBadgeText(rata.stato)}</Badge>
                  </TableCell>
                  <TableCell>
                    {rata.dataPagamento ? format(rata.dataPagamento, "dd MMM yyyy", { locale: it }) : "-"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRata(rata)}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    {rata.stato !== 'pagata' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => pagaMutation.mutate(rata.id)}
                        disabled={pagaMutation.isPending}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Paga
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isPagamentoEditDialogOpen} onOpenChange={setIsPagamentoEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Modifica Pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div>
                    <Label htmlFor="nomeLavoro">Nome Lavoro</Label>
                    <Input id="nomeLavoro" value={editPagamentoForm.nomeLavoro} onChange={(e) => setEditPagamentoForm({...editPagamentoForm, nomeLavoro: e.target.value})} />
                </div>
                <div>
                    <Label htmlFor="totale">Totale (€)</Label>
                    <Input id="totale" type="number" step="0.01" value={editPagamentoForm.totale} onChange={(e) => setEditPagamentoForm({...editPagamentoForm, totale: parseFloat(e.target.value) || 0})} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsPagamentoEditDialogOpen(false)}>Annulla</Button>
                <Button onClick={handleSavePagamentoChanges} disabled={updatePagamentoMutation.isPending}>
                    {updatePagamentoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salva Modifiche
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRata} onOpenChange={() => setEditingRata(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Modifica Rata {editingRata?.numeroRata}/{editingRata?.totaleRate}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div>
                    <Label htmlFor="rata-ammontare">Ammontare (€)</Label>
                    <Input id="rata-ammontare" type="number" step="0.01" value={editRataForm.ammontare} onChange={(e) => setEditRataForm({...editRataForm, ammontare: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                    <Label htmlFor="rata-dataScadenza">Data Scadenza</Label>
                    <Input id="rata-dataScadenza" type="date" value={editRataForm.dataScadenza} onChange={(e) => setEditRataForm({...editRataForm, dataScadenza: e.target.value})} />
                </div>
                <div>
                    <Label htmlFor="rata-stato">Stato</Label>
                    <Select value={editRataForm.stato} onValueChange={(value) => setEditRataForm({...editRataForm, stato: value as StatoRata})}>
                        <SelectTrigger id="rata-stato">
                            <SelectValue placeholder="Seleziona uno stato" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="futura">Da Pagare</SelectItem>
                            <SelectItem value="pagata">Pagata</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditingRata(null)}>Annulla</Button>
                <Button onClick={handleSaveRataChanges} disabled={updateRataMutation.isPending}>
                    {updateRataMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salva Modifiche
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Questa azione non può essere annullata. Verrà eliminato permanentemente il piano di pagamento e tutte le rate associate.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteMutation.isPending}
                >
                    {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Elimina'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}