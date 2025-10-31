export interface Paziente {
  id: string;
  nome: string;
  cognome: string;
  dataCreazione: Date;
}

export type ModalitaPagamento = "unico" | "rate";

export interface Pagamento {
  id: string;
  pazienteId: string;
  nomeLavoro?: string;
  modalita: ModalitaPagamento;
  totale: number;
  dataCreazione: Date;
  pazienteNome?: string;
}

export type StatoRata = "pagata" | "scadenza_oggi" | "scaduta" | "futura";

export interface Rata {
  id: string;
  pagamentoId: string;
  pazienteId?: string;
  numeroRata: number;
  totaleRate: number;
  ammontare: number;
  dataScadenza: Date;
  dataPagamento?: Date;
  stato: StatoRata;
  pazienteNome?: string;
  nomeLavoro?: string;
}