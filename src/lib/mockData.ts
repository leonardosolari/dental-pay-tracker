import { Paziente, Pagamento, Rata } from "@/types";

// Funzione helper per creare date
const giorni = (offset: number) => {
  const data = new Date();
  data.setDate(data.getDate() + offset);
  return data;
};

export const mockPazienti: Paziente[] = [
  { id: "1", nome: "Mario", cognome: "Rossi", dataCreazione: giorni(-30) },
  { id: "2", nome: "Laura", cognome: "Bianchi", dataCreazione: giorni(-45) },
  { id: "3", nome: "Giuseppe", cognome: "Verdi", dataCreazione: giorni(-20) },
  { id: "4", nome: "Anna", cognome: "Neri", dataCreazione: giorni(-60) },
];

export const mockPagamenti: Pagamento[] = [
  {
    id: "1",
    pazienteId: "1",
    nomeLavoro: "Implantologia",
    modalita: "rate",
    totale: 3000,
    dataCreazione: giorni(-30),
  },
  {
    id: "2",
    pazienteId: "2",
    nomeLavoro: "Ortodonzia",
    modalita: "rate",
    totale: 2400,
    dataCreazione: giorni(-25),
  },
  {
    id: "3",
    pazienteId: "3",
    nomeLavoro: "Pulizia dentale",
    modalita: "unico",
    totale: 150,
    dataCreazione: giorni(-10),
  },
  {
    id: "4",
    pazienteId: "4",
    nomeLavoro: "Protesi",
    modalita: "rate",
    totale: 4500,
    dataCreazione: giorni(-40),
  },
];

export const mockRate: Rata[] = [
  // Rate scadute
  {
    id: "1",
    pagamentoId: "1",
    numeroRata: 1,
    totaleRate: 6,
    ammontare: 500,
    dataScadenza: giorni(-15),
    stato: "scaduta",
  },
  {
    id: "2",
    pagamentoId: "4",
    numeroRata: 1,
    totaleRate: 5,
    ammontare: 900,
    dataScadenza: giorni(-5),
    stato: "scaduta",
  },
  // Rate in scadenza oggi
  {
    id: "3",
    pagamentoId: "2",
    numeroRata: 1,
    totaleRate: 4,
    ammontare: 600,
    dataScadenza: giorni(0),
    stato: "scadenza_oggi",
  },
  {
    id: "4",
    pagamentoId: "1",
    numeroRata: 2,
    totaleRate: 6,
    ammontare: 500,
    dataScadenza: giorni(0),
    stato: "scadenza_oggi",
  },
  // Rate future
  {
    id: "5",
    pagamentoId: "2",
    numeroRata: 2,
    totaleRate: 4,
    ammontare: 600,
    dataScadenza: giorni(30),
    stato: "futura",
  },
  {
    id: "6",
    pagamentoId: "4",
    numeroRata: 2,
    totaleRate: 5,
    ammontare: 900,
    dataScadenza: giorni(25),
    stato: "futura",
  },
  // Rate pagate
  {
    id: "7",
    pagamentoId: "3",
    numeroRata: 1,
    totaleRate: 1,
    ammontare: 150,
    dataScadenza: giorni(-8),
    dataPagamento: giorni(-8),
    stato: "pagata",
  },
];
