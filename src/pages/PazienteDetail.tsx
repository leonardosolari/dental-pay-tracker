import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Paziente, Pagamento, Rata } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, Edit, User, FileText, AlertTriangle, Loader2, Trash2 } from "lucide-react";

const API_BASE_URL = "/api";


const fetchPaziente = async (id: string): Promise<Paziente> => {
  const res = await fetch(`${API_BASE_URL}/pazienti/${id}`);
  if (!res.ok) throw new Error("Paziente non trovato");
  const data = await res.json();
  return { ...data, dataCreazione: new Date(data.dataCreazione) };
};

const fetchPagamentiPaziente = async (id: string): Promise<Pagamento[]> => {
  const res = await fetch(`${API_BASE_URL}/pazienti/${id}/pagamenti`);
  if (!res.ok) throw new Error("Errore nel recupero dei pagamenti");
  const data = await res.json();
  return data.map((p) => ({ ...p, dataCreazione: new Date(p.dataCreazione) }));
};

const fetchRateScadutePaziente = async (id: string): Promise<Rata[]> => {
  const res = await fetch(`${API_BASE_URL}/pazienti/${id}/rate_scadute`);
  if (!res.ok) throw new Error("Errore nel recupero delle rate scadute");
  const data = await res.json();
  return data.map((r) => ({ ...r, dataScadenza: new Date(r.dataScadenza) }));
};

const updatePaziente = async (pazienteData: { id: string; nome: string; cognome: string }): Promise<Paziente> => {
  const res = await fetch(`${API_BASE_URL}/pazienti/${pazienteData.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: pazienteData.nome, cognome: pazienteData.cognome }),
  });
  if (!res.ok) throw new Error("Errore nell'aggiornamento del paziente");
  return res.json();
};

const deletePaziente = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/pazienti/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Errore nell'eliminazione del paziente.");
};

export default function PazienteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ nome: "", cognome: "" });

  const {
    data: paziente,
    isLoading: isLoadingPaziente,
    isError: isErrorPaziente,
  } = useQuery({
    queryKey: ["paziente", id],
    queryFn: () => fetchPaziente(id!),
    enabled: !!id,
  });

  const { data: pagamenti = [], isLoading: isLoadingPagamenti } = useQuery({
    queryKey: ["pagamentiPaziente", id],
    queryFn: () => fetchPagamentiPaziente(id!),
    enabled: !!id,
  });

  const { data: rateScadute = [], isLoading: isLoadingRate } = useQuery({
    queryKey: ["rateScadutePaziente", id],
    queryFn: () => fetchRateScadutePaziente(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: updatePaziente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente", id] });
      queryClient.invalidateQueries({ queryKey: ["pazienti"] });
      setIsEditDialogOpen(false);
      toast({ title: "Paziente aggiornato con successo!" });
    },
    onError: (error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaziente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pazienti"] });
      toast({ title: "Paziente eliminato con successo!" });
      navigate("/pazienti");
    },
    onError: (error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleEditClick = () => {
    if (paziente) {
      setEditForm({ nome: paziente.nome, cognome: paziente.cognome });
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveChanges = () => {
    if (id) {
      updateMutation.mutate({ id, ...editForm });
    }
  };

  const handleDelete = () => {
    if (id) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoadingPaziente || isLoadingPagamenti || isLoadingRate) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isErrorPaziente || !paziente) {
    return <div className="text-center text-destructive">Paziente non trovato o errore nel caricamento.</div>;
  }

  return (
    <div className="space-y-8">
      <Link to="/pazienti" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Torna a tutti i pazienti
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <User className="h-6 w-6" />
              {paziente.nome} {paziente.cognome}
            </CardTitle>
            <CardDescription>
              Registrato il {format(paziente.dataCreazione, "dd MMMM yyyy", { locale: it })}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleEditClick}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {rateScadute.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Rate Scadute Non Pagate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rateScadute.map((rata) => (
                <div
                  key={rata.id}
                  className="flex items-center justify-between rounded-md border border-destructive/50 bg-destructive/5 p-3"
                >
                  <div>
                    <p className="font-medium">
                      Rata {rata.numeroRata} di {rata.totaleRate}
                      {rata.nomeLavoro && (
                        <span className="font-normal text-muted-foreground">
                          {" - "}
                          <Link to={`/pagamenti/${rata.pagamentoId}`} className="hover:underline">
                            {rata.nomeLavoro}
                          </Link>
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Scaduta il {format(rata.dataScadenza, "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div className="text-lg font-bold text-destructive">€{rata.ammontare.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lavori e Pagamenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pagamenti.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lavoro</TableHead>
                  <TableHead>Totale</TableHead>
                  <TableHead>Modalità</TableHead>
                  <TableHead>Data Creazione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagamenti.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link to={`/pagamenti/${p.id}`} className="hover:underline">
                        {p.nomeLavoro || "-"}
                      </Link>
                    </TableCell>
                    <TableCell>€{p.totale.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={p.modalita === "rate" ? "secondary" : "outline"}>
                        {p.modalita === "rate" ? "Rateale" : "Unico"}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(p.dataCreazione, "dd/MM/yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-4 text-center text-muted-foreground">Nessun pagamento registrato per questo paziente.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Paziente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="cognome">Cognome</Label>
              <Input
                id="cognome"
                value={editForm.cognome}
                onChange={(e) => setEditForm({ ...editForm, cognome: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveChanges} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Questa azione non può essere annullata. Verrà eliminato permanentemente il paziente e tutti i suoi dati, inclusi i piani di pagamento e le rate associate.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteMutation.isPending}
                >
                    {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sì, elimina paziente'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}