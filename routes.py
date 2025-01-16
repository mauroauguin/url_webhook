from flask import jsonify, Blueprint, request
from database import get_conversations_by_phone, get_all_conversations, get_bot_status, set_bot_status

api = Blueprint('api', __name__)

@api.route('/api/conversations', methods=['GET'])
def get_conversations():
    try:
        conversations = get_all_conversations()
        print("Conversaciones obtenidas:", conversations)  # Debug
        return jsonify(conversations)
    except Exception as e:
        print(f"Error al obtener conversaciones: {e}")  # Debug
        return jsonify([])

@api.route('/api/conversations/<phone_number>', methods=['GET'])
def get_phone_conversations(phone_number):
    try:
        conversations = get_conversations_by_phone(phone_number)
        # Convertir los resultados de la base de datos a diccionarios
        formatted_conversations = []
        for conv in conversations:
            formatted_conversations.append({
                'id': conv[0],
                'phone_number': conv[1],
                'incoming_message': conv[2],
                'response_message': conv[3],
                'timestamp': conv[4]
            })
        print("Conversaciones del teléfono:", formatted_conversations)  # Debug
        return jsonify(formatted_conversations)
    except Exception as e:
        print(f"Error al obtener conversaciones del teléfono: {e}")  # Debug
        return jsonify([]) 

@api.route('/api/bot-status/<phone_number>', methods=['GET'])
def get_phone_bot_status(phone_number):
    status = get_bot_status(phone_number)
    return jsonify({'is_active': status})

@api.route('/api/bot-status/<phone_number>', methods=['POST'])
def update_bot_status(phone_number):
    data = request.json
    is_active = data.get('is_active', True)
    set_bot_status(phone_number, is_active)
    return jsonify({'success': True}) 