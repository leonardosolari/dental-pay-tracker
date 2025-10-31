import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from database import db, Paziente
from datetime import datetime
from dateutil.relativedelta import relativedelta
from database import Pagamento, Rata

# --- CONFIGURAZIONE ---
app = Flask(__name__)
CORS(app) # Abilita CORS per tutte le rotte

# Configurazione del database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'dental_tracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# --- COMANDO PER INIZIALIZZARE IL DB ---
@app.cli.command("init-db")
def init_db_command():
    """Crea le tabelle del database."""
    with app.app_context():
        db.create_all()
    print("Database inizializzato.")

# --- ENDPOINTS API ---

# PAZIENTI
@app.route('/api/pazienti', methods=['GET'])
def get_pazienti():
    pazienti = Paziente.query.order_by(Paziente.data_creazione.desc()).all()
    return jsonify([p.to_dict() for p in pazienti])

@app.route('/api/pazienti', methods=['POST'])
def add_paziente():
    data = request.get_json()
    if not data or not 'nome' in data or not 'cognome' in data:
        return jsonify({'error': 'Nome e cognome sono obbligatori'}), 400

    nuovo_paziente = Paziente(
        nome=data['nome'],
        cognome=data['cognome']
    )
    db.session.add(nuovo_paziente)
    db.session.commit()
    return jsonify(nuovo_paziente.to_dict()), 201

# --- ENDPOINTS PAGAMENTI ---
@app.route('/api/pagamenti', methods=['GET'])
def get_pagamenti():
    pagamenti = Pagamento.query.order_by(Pagamento.data_creazione.desc()).all()
    return jsonify([p.to_dict() for p in pagamenti])

@app.route('/api/pagamenti', methods=['POST'])
def add_pagamento():
    data = request.get_json()
    
    nuovo_pagamento = Pagamento(
        paziente_id=int(data['pazienteId']),
        nome_lavoro=data.get('nomeLavoro'),
        modalita=data['modalita'],
        totale=float(data['totale'])
    )
    db.session.add(nuovo_pagamento)
    
    # Se il pagamento è a rate, creiamo le rate
    if data['modalita'] == 'rate' and 'numeroRate' in data:
        numero_rate = int(data['numeroRate'])
        if numero_rate > 0:
            ammontare_rata = round(float(data['totale']) / numero_rate, 2)
            for i in range(numero_rate):
                data_scadenza = datetime.utcnow() + relativedelta(months=i+1)
                nuova_rata = Rata(
                    pagamento=nuovo_pagamento,
                    numero_rata=i + 1,
                    totale_rate=numero_rate,
                    ammontare=ammontare_rata,
                    data_scadenza=data_scadenza
                )
                db.session.add(nuova_rata)

    db.session.commit()
    return jsonify(nuovo_pagamento.to_dict()), 201

# --- ENDPOINTS RATE ---
@app.route('/api/rate', methods=['GET'])
def get_rate():
    rate = Rata.query.join(Pagamento).join(Paziente).order_by(Rata.data_scadenza.asc()).all()
    return jsonify([r.to_dict() for r in rate])

@app.route('/api/rate/<int:rata_id>/paga', methods=['POST'])
def paga_rata(rata_id):
    rata = Rata.query.get_or_404(rata_id)
    rata.stato = 'pagata'
    rata.data_pagamento = datetime.utcnow()
    db.session.commit()
    return jsonify(rata.to_dict())

@app.route('/api/rate/<int:rata_id>', methods=['PUT'])
def update_rata(rata_id):
    data = request.get_json()
    rata = Rata.query.get_or_404(rata_id)
    
    if 'ammontare' in data:
        rata.ammontare = float(data['ammontare'])
    if 'dataScadenza' in data:
        # Il frontend manda una stringa tipo "2024-12-31"
        rata.data_scadenza = datetime.strptime(data['dataScadenza'], '%Y-%m-%d')
        
    db.session.commit()
    return jsonify(rata.to_dict())


# --- ESECUZIONE ---
if __name__ == '__main__':
    app.run(debug=True)