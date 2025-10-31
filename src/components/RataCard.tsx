import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rata } from "@/types";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, Euro, Edit2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RataCardProps {
  rata: Rata;
  onEdit: (rata: Rata) => void;
  onPaga: (rata: Rata) => void;
}

export default function RataCard({ rata, onEdit, onPaga }: RataCardProps) {
  const getBadgeVariant = (stato: Rata["stato"]) => {
    switch (stato) {
      case "pagata":
        return "default"; // 'default' in shadcn è solitamente il colore primario (es. blu o verde a seconda del tema)
      case "scadenza_oggi":
        return "secondary"; // Puoi personalizzare questo colore se vuoi
      case "scaduta":
        return "destructive"; // Rosso
      default:
        return "outline";
    }
  };

  const getBadgeText = (stato: Rata["stato"]) => {
    switch (stato) {
      case "pagata":
        return "Pagata";
      case "scadenza_oggi":
        return "Scade oggi";
      case "scaduta":
        return "Scaduta";
      default:
        return "Futura";
    }
  };

  return (
    <Card className={cn("p-4 transition-all hover:shadow-md", rata.stato === "scaduta" && "border-destructive")}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">
              {rata.pazienteNome || "Paziente non trovato"}
            </h3>
            <Badge variant={getBadgeVariant(rata.stato)}>{getBadgeText(rata.stato)}</Badge>
          </div>
          {rata.nomeLavoro && (
            <p className="mt-1 text-sm text-muted-foreground">{rata.nomeLavoro}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(rata.dataScadenza, "dd MMMM yyyy", { locale: it })}</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-foreground">
              <Euro className="h-4 w-4" />
              <span>{rata.ammontare.toFixed(2)}</span>
            </div>
            <span className="text-muted-foreground">
              Rata {rata.numeroRata}/{rata.totaleRate}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {rata.stato !== "pagata" && (
            <>
              <Button variant="outline" size="icon" onClick={() => onEdit(rata)} title="Modifica">
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="default" size="icon" onClick={() => onPaga(rata)} title="Segna come pagata">
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}