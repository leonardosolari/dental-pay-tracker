from flask import Blueprint, jsonify, request
from app.models import Rata, Pagamento, Paziente
from app import db
from datetime import datetime

# Crea un Blueprint per le route delle rate
bp = Blueprint('rate', __name__)

@bp.route('/rate', methods=['GET'])
def get_rate():
    rate = Rata.query.join(Pagamento).join(Paziente).order_by(Rata.data_scadenza.asc()).all()
    return jsonify([r.to_dict() for r in rate])

@bp.route('/rate/<int:rata_id>/paga', methods=['POST'])
def paga_rata(rata_id):
    rata = Rata.query.get_or_404(rata_id)
    rata.stato = 'pagata'
    rata.data_pagamento = datetime.utcnow()
    db.session.commit()
    return jsonify(rata.to_dict())

@bp.route('/rate/<int:rata_id>', methods=['PUT'])
def update_rata(rata_id):
    data = request.get_json()
    rata = Rata.query.get_or_404(rata_id)
    
    if 'ammontare' in data:
        rata.ammontare = float(data['ammontare'])
    if 'dataScadenza' in data:
        rata.data_scadenza = datetime.strptime(data['dataScadenza'], '%Y-%m-%d')
        
    db.session.commit()
    return jsonify(rata.to_dict())