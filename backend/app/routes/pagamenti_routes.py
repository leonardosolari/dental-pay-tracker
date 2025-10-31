from flask import Blueprint, jsonify, request
from app.models import Pagamento, Rata
from app import db
from datetime import datetime
from dateutil.relativedelta import relativedelta

# Crea un Blueprint per le route dei pagamenti
bp = Blueprint('pagamenti', __name__)

@bp.route('/pagamenti', methods=['GET'])
def get_pagamenti():
    pagamenti = Pagamento.query.order_by(Pagamento.data_creazione.desc()).all()
    return jsonify([p.to_dict() for p in pagamenti])

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