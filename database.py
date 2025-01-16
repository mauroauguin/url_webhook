import sqlite3
from datetime import datetime
import os

def init_db():
    # Asegurarse de que el directorio existe
    db_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(db_dir, 'conversations.db')
    
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        # Crear tabla de conversaciones si no existe
        c.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT NOT NULL,
                incoming_message TEXT NOT NULL,
                response_message TEXT NOT NULL,
                timestamp DATETIME NOT NULL
            )
        ''')
        
        # Crear tabla para el estado del bot
        c.execute('''
            CREATE TABLE IF NOT EXISTS bot_status (
                phone_number TEXT PRIMARY KEY,
                is_active BOOLEAN DEFAULT 1
            )
        ''')
        
        conn.commit()
        print("Base de datos inicializada correctamente")
    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")
    finally:
        conn.close()

def save_conversation(phone_number, incoming_message, response_message):
    db_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(db_dir, 'conversations.db')
    
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        c.execute('''
            INSERT INTO conversations (phone_number, incoming_message, response_message, timestamp)
            VALUES (?, ?, ?, ?)
        ''', (phone_number, incoming_message, response_message, timestamp))
        
        conn.commit()
        print(f"Conversación guardada para {phone_number}")
    except Exception as e:
        print(f"Error al guardar la conversación: {e}")
    finally:
        conn.close()

def get_conversations_by_phone(phone_number):
    db_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(db_dir, 'conversations.db')
    
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        c.execute('''
            SELECT * FROM conversations 
            WHERE phone_number = ? 
            ORDER BY timestamp ASC
        ''', (phone_number,))
        
        conversations = c.fetchall()
        return conversations
    except Exception as e:
        print(f"Error al obtener conversaciones: {e}")
        return []
    finally:
        conn.close()

def get_all_conversations():
    db_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(db_dir, 'conversations.db')
    
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        c.execute('''
            SELECT phone_number, COUNT(*) as message_count 
            FROM conversations 
            GROUP BY phone_number 
            ORDER BY MAX(timestamp) DESC
        ''')
        
        conversations = c.fetchall()
        return [{'phone_number': row[0], 'message_count': row[1]} for row in conversations]
    except Exception as e:
        print(f"Error al obtener todas las conversaciones: {e}")
        return []
    finally:
        conn.close()

def get_bot_status(phone_number):
    db_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(db_dir, 'conversations.db')
    
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        c.execute('SELECT is_active FROM bot_status WHERE phone_number = ?', (phone_number,))
        result = c.fetchone()
        
        # Si no existe registro, crear uno con estado activo por defecto
        if result is None:
            c.execute('INSERT INTO bot_status (phone_number, is_active) VALUES (?, 1)', (phone_number,))
            conn.commit()
            return True
            
        return bool(result[0])
    finally:
        conn.close()

def set_bot_status(phone_number, is_active):
    db_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(db_dir, 'conversations.db')
    
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        c.execute('''
            INSERT OR REPLACE INTO bot_status (phone_number, is_active)
            VALUES (?, ?)
        ''', (phone_number, is_active))
        
        conn.commit()
    finally:
        conn.close() 