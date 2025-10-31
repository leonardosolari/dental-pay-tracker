from flask import Blueprint, jsonify, request
from app.models import Paziente, Pagamento, Rata
from app import db
from datetime import datetime

# Crea un Blueprint per le route dei pazienti
bp = Blueprint('pazienti', __name__)

@bp.route('/pazienti', methods=['GET'])
def get_pazienti():
    pazienti = Paziente.query.order_by(Paziente.data_creazione.desc()).all()
    return jsonify([p.to_dict() for p in pazienti])

@bp.route('/pazienti/<int:paziente_id>', methods=['GET'])
def get_paziente(paziente_id):
    paziente = Paziente.query.get_or_404(paziente_id)
    return jsonify(paziente.to_dict())

@bp.route('/pazienti', methods=['POST'])
def add_paziente():
    data = request.get_json()
    if not data or not 'nome' in data or not 'cognome' in data:
        return jsonify({'error': 'Nome e cognome sono obbligatori'}), 400

    # Formatta nome e cognome: rimuovi spazi e applica la capitalizzazione (es. "mario rossi" -> "Mario Rossi")
    nome = data['nome'].strip().title()
    cognome = data['cognome'].strip().title()

    if not nome or not cognome:
        return jsonify({'error': 'Nome e cognome non possono essere vuoti'}), 400

    nuovo_paziente = Paziente(
        nome=nome,
        cognome=cognome
    )
    db.session.add(nuovo_paziente)
    db.session.commit()
    return jsonify(nuovo_paziente.to_dict()), 201

@bp.route('/pazienti/<int:paziente_id>', methods=['PUT'])
def update_paziente(paziente_id):
    paziente = Paziente.query.get_or_404(paziente_id)
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Dati non forniti'}), 400

    nome = data.get('nome', '').strip().title()
    cognome = data.get('cognome', '').strip().title()

    if not nome or not cognome:
        return jsonify({'error': 'Nome e cognome non possono essere vuoti'}), 400

    paziente.nome = nome
    paziente.cognome = cognome
    db.session.commit()
    return jsonify(paziente.to_dict())

@bp.route('/pazienti/<int:paziente_id>/pagamenti', methods=['GET'])
def get_pagamenti_paziente(paziente_id):
    paziente = Paziente.query.get_or_404(paziente_id)
    pagamenti = Pagamento.query.filter_by(paziente_id=paziente.id).order_by(Pagamento.data_creazione.desc()).all()
    return jsonify([p.to_dict() for p in pagamenti])

@bp.route('/pazienti/<int:paziente_id>/rate_scadute', methods=['GET'])
def get_rate_scadute_paziente(paziente_id):
    today = datetime.utcnow().date()
    rate = Rata.query.join(Pagamento).filter(
        Pagamento.paziente_id == paziente_id,
        Rata.stato != 'pagata',
        Rata.data_scadenza < today
    ).order_by(Rata.data_scadenza.asc()).all()
    return jsonify([r.to_dict() for r in rate])