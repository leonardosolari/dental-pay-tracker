from flask import Blueprint, jsonify, request
from app.models import Pagamento, Rata
from app import db
from datetime import datetime

# Crea un Blueprint per le route dei pagamenti
bp = Blueprint('pagamenti', __name__)

@bp.route('/pagamenti', methods=['GET'])
def get_pagamenti():
    pagamenti = Pagamento.query.order_by(Pagamento.data_creazione.desc()).all()
    return jsonify([p.to_dict() for p in pagamenti])

@bp.route('/pagamenti/<int:pagamento_id>', methods=['GET'])
def get_pagamento(pagamento_id):
    pagamento = Pagamento.query.get_or_404(pagamento_id)
    return jsonify(pagamento.to_dict())

@bp.route('/pagamenti/<int:pagamento_id>/rate', methods=['GET'])
def get_rate_pagamento(pagamento_id):
    rate = Rata.query.filter_by(pagamento_id=pagamento_id).order_by(Rata.numero_rata.asc()).all()
    return jsonify([r.to_dict() for r in rate])

@bp.route('/pagamenti', methods=['POST'])
def add_pagamento():
    data = request.get_json()
    
    nuovo_pagamento = Pagamento(
        paziente_id=int(data['pazienteId']),
        nome_lavoro=data.get('nomeLavoro'),
        modalita=data['modalita'],
        totale=float(data['totale'])
    )
    db.session.add(nuovo_pagamento)
    
    if 'rate' in data and isinstance(data['rate'], list):
        numero_rate_totali = len(data['rate'])
        for i, rata_data in enumerate(data['rate']):
            data_scadenza = datetime.strptime(rata_data['dataScadenza'], '%Y-%m-%d').date()
            nuova_rata = Rata(
                pagamento=nuovo_pagamento,
                numero_rata=i + 1,
                totale_rate=numero_rate_totali,
                ammontare=float(rata_data['ammontare']),
                data_scadenza=data_scadenza
            )
            db.session.add(nuova_rata)

    db.session.commit()
    return jsonify(nuovo_pagamento.to_dict()), 201