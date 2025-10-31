import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pagamento, Rata } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, User, FileText, Euro, Calendar, CheckCircle2, Loader2 } from "lucide-react";
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

export default function PagamentoDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: pagamento, isLoading: isLoadingPagamento, isError: isErrorPagamento } = useQuery({
    queryKey: ["pagamento", id],
    queryFn: () => fetchPagamento(id!),
    enabled: !!id,
  });

  const { data: rate = [], isLoading: isLoadingRate } = useQuery({
    queryKey: ["ratePagamento", id],
    queryFn: () => fetchRatePagamento(id!),
    enabled: !!id,
  });

  const pagaMutation = useMutation({
    mutationFn: pagaRata,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['ratePagamento', id] });
        queryClient.invalidateQueries({ queryKey: ['rate'] }); // Invalida anche la cache della dashboard
        toast({ title: "Pagamento registrato!" });
    }
  });

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
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <FileText className="h-6 w-6" />
            {pagamento.nomeLavoro || "Pagamento generico"}
          </CardTitle>
          <CardDescription>
            Dettagli del piano di pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-md border p-4">
                <User className="h-6 w-6 text-muted-foreground"/>
                <div>
                    <p className="text-sm text-muted-foreground">Paziente</p>
                    <p className="font-medium">{pagamento.pazienteNome}</p>
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
                  <TableCell className="text-right">
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
    </div>
  );
}