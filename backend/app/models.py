from app import db  # Importa l'istanza db dal pacchetto app
from datetime import datetime

class Paziente(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(80), nullable=False)
    cognome = db.Column(db.String(80), nullable=False)
    data_creazione = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    pagamenti = db.relationship('Pagamento', backref='paziente', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": str(self.id),
            "nome": self.nome,
            "cognome": self.cognome,
            "dataCreazione": self.data_creazione.isoformat()
        }

class Pagamento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paziente_id = db.Column(db.Integer, db.ForeignKey('paziente.id'), nullable=False)
    nome_lavoro = db.Column(db.String(120), nullable=True)
    modalita = db.Column(db.String(20), nullable=False) # 'unico' o 'rate'
    totale = db.Column(db.Float, nullable=False)
    data_creazione = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    rate = db.relationship('Rata', backref='pagamento', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": str(self.id),
            "pazienteId": str(self.paziente_id),
            "nomeLavoro": self.nome_lavoro,
            "modalita": self.modalita,
            "totale": self.totale,
            "dataCreazione": self.data_creazione.isoformat(),
            "pazienteNome": f"{self.paziente.nome} {self.paziente.cognome}" if self.paziente else "N/A"
        }

class Rata(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pagamento_id = db.Column(db.Integer, db.ForeignKey('pagamento.id'), nullable=False)
    numero_rata = db.Column(db.Integer, nullable=False)
    totale_rate = db.Column(db.Integer, nullable=False)
    ammontare = db.Column(db.Float, nullable=False)
    data_scadenza = db.Column(db.DateTime, nullable=False)
    data_pagamento = db.Column(db.DateTime, nullable=True)
    stato = db.Column(db.String(20), nullable=False, default='futura') # 'pagata', 'scadenza_oggi', 'scaduta', 'futura'

    def to_dict(self):
        today = datetime.utcnow().date()
        scadenza = self.data_scadenza.date()
        stato_dinamico = self.stato
        
        if self.stato != 'pagata':
            if scadenza < today:
                stato_dinamico = 'scaduta'
            elif scadenza == today:
                stato_dinamico = 'scadenza_oggi'
            else:
                stato_dinamico = 'futura'

        return {
            "id": str(self.id),
            "pagamentoId": str(self.pagamento_id),
            "numeroRata": self.numero_rata,
            "totaleRate": self.totale_rate,
            "ammontare": self.ammontare,
            "dataScadenza": self.data_scadenza.isoformat(),
            "dataPagamento": self.data_pagamento.isoformat() if self.data_pagamento else None,
            "stato": stato_dinamico,
            "pazienteNome": f"{self.pagamento.paziente.nome} {self.pagamento.paziente.cognome}",
            "nomeLavoro": self.pagamento.nome_lavoro
        }