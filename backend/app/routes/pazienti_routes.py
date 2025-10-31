from flask import Blueprint, jsonify, request
from app.models import Paziente
from app import db

# Crea un Blueprint per le route dei pazienti
bp = Blueprint('pazienti', __name__)

@bp.route('/pazienti', methods=['GET'])
def get_pazienti():
    pazienti = Paziente.query.order_by(Paziente.data_creazione.desc()).all()
    return jsonify([p.to_dict() for p in pazienti])

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