const socket = io();
let activePhoneNumber = null;

// Variables para los elementos del formulario
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const botToggle = document.getElementById('bot-toggle');
let isBotActive = true;

// Cargar lista de números de teléfono
async function loadPhoneNumbers() {
    try {
        const response = await fetch('/api/conversations');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const conversations = await response.json();
        console.log("Conversaciones cargadas:", conversations); // Debug

        const phoneNumbersDiv = document.getElementById('phone-numbers');
        if (conversations && conversations.length > 0) {
            phoneNumbersDiv.innerHTML = conversations.map(conv => `
                <div class="phone-number-item" onclick="loadConversation('${conv.phone_number}')">
                    ${conv.phone_number} (${conv.message_count} mensajes)
                </div>
            `).join('');
        } else {
            phoneNumbersDiv.innerHTML = '<p>No hay conversaciones disponibles</p>';
        }
    } catch (error) {
        console.error('Error cargando números:', error);
        document.getElementById('phone-numbers').innerHTML = '<p>Error cargando conversaciones</p>';
    }
}

// Cargar conversación específica
async function loadConversation(phoneNumber) {
    try {
        activePhoneNumber = phoneNumber;
        messageInput.disabled = false;
        botToggle.disabled = false;
        sendButton.disabled = !messageInput.value.trim();
        
        await loadBotStatus(phoneNumber);
        const response = await fetch(`/api/conversations/${phoneNumber}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const messages = await response.json();
        console.log("Mensajes cargados:", messages); // Debug
        displayMessages(messages);
        
        // Actualizar clase activa
        document.querySelectorAll('.phone-number-item').forEach(item => {
            item.classList.remove('active');
            if (item.textContent.includes(phoneNumber)) {
                item.classList.add('active');
            }
        });
    } catch (error) {
        console.error('Error cargando conversación:', error);
        document.getElementById('chat-messages').innerHTML = '<p>Error cargando mensajes</p>';
        messageInput.disabled = true;
        botToggle.disabled = true;
        sendButton.disabled = true;
    }
}

// Mostrar mensajes
function displayMessages(messages) {
    const chatDiv = document.getElementById('chat-messages');
    if (messages && messages.length > 0) {
        chatDiv.innerHTML = messages.map(msg => {
            let messageHtml = '';
            
            // Si hay mensaje entrante, mostrarlo
            if (msg.incoming_message && msg.incoming_message.trim() !== '') {
                messageHtml += `
                    <div class="message incoming">
                        <div class="message-content">
                            <strong>Recibido:</strong><br>
                            ${msg.incoming_message}
                        </div>
                        <div class="message-timestamp">${msg.timestamp}</div>
                    </div>
                `;
            }
            
            // Si hay mensaje de respuesta, mostrarlo
            if (msg.response_message && msg.response_message.trim() !== '') {
                messageHtml += `
                    <div class="message outgoing">
                        <div class="message-content">
                            <strong>Enviado:</strong><br>
                            ${msg.response_message}
                        </div>
                        <div class="message-timestamp">${msg.timestamp}</div>
                    </div>
                `;
            }
            
            return messageHtml;
        }).join('');
        
        // Asegurarse de que el scroll esté en la parte inferior
        setTimeout(() => {
            chatDiv.scrollTop = chatDiv.scrollHeight;
        }, 100);
    } else {
        chatDiv.innerHTML = '<p>No hay mensajes para mostrar</p>';
    }
}

// Escuchar nuevos mensajes
socket.on('new_message', (data) => {
    console.log("Nuevo mensaje recibido:", data); // Debug
    if (activePhoneNumber === data.phone_number) {
        // Agregar el nuevo mensaje a la conversación actual
        const chatDiv = document.getElementById('chat-messages');
        let messageHtml = '';
        
        if (data.incoming_message && data.incoming_message.trim() !== '') {
            messageHtml = `
                <div class="message incoming">
                    <div class="message-content">
                        <strong>Recibido:</strong><br>
                        ${data.incoming_message}
                    </div>
                    <div class="message-timestamp">${data.timestamp}</div>
                </div>
            `;
        } else if (data.response_message && data.response_message.trim() !== '') {
            messageHtml = `
                <div class="message outgoing">
                    <div class="message-content">
                        <strong>Enviado:</strong><br>
                        ${data.response_message}
                    </div>
                    <div class="message-timestamp">${data.timestamp}</div>
                </div>
            `;
        }
        
        // Agregar el nuevo mensaje al final
        if (messageHtml) {
            if (chatDiv.innerHTML === '<p>No hay mensajes para mostrar</p>') {
                chatDiv.innerHTML = messageHtml;
            } else {
                chatDiv.insertAdjacentHTML('beforeend', messageHtml);
            }
            chatDiv.scrollTop = chatDiv.scrollHeight;
        }
    }
    loadPhoneNumbers(); // Actualizar lista de conversaciones
});

// Cargar datos iniciales
document.addEventListener('DOMContentLoaded', () => {
    console.log("Cargando datos iniciales..."); // Debug
    loadPhoneNumbers();
});

// Habilitar/deshabilitar botón de envío según si hay número activo y mensaje
messageInput.addEventListener('input', () => {
    sendButton.disabled = !activePhoneNumber || !messageInput.value.trim();
});

// Función para enviar mensaje
async function sendMessage() {
    if (!activePhoneNumber || !messageInput.value.trim()) return;
    
    try {
        const response = await fetch('/api/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone_number: activePhoneNumber,
                message: messageInput.value.trim()
            })
        });

        if (!response.ok) {
            throw new Error('Error al enviar mensaje');
        }

        // Limpiar el input después de enviar
        messageInput.value = '';
        sendButton.disabled = true;
        
        // Ya no necesitamos recargar la conversación completa
        // await loadConversation(activePhoneNumber);
        
        // El mensaje enviado se mostrará a través del evento socket.on('new_message')
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al enviar el mensaje');
    }
}

// Event listeners para enviar mensaje
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Función para cargar el estado del bot
async function loadBotStatus(phoneNumber) {
    try {
        const response = await fetch(`/api/bot-status/${phoneNumber}`);
        const data = await response.json();
        isBotActive = data.is_active;
        updateBotToggleUI();
    } catch (error) {
        console.error('Error cargando estado del bot:', error);
    }
}

// Función para actualizar la UI del botón
function updateBotToggleUI() {
    botToggle.classList.remove('active', 'inactive');
    botToggle.classList.add(isBotActive ? 'active' : 'inactive');
    botToggle.title = isBotActive ? 'Bot Activo' : 'Bot Inactivo';
}

// Agregar event listener para el botón del bot
botToggle.addEventListener('click', async () => {
    if (!activePhoneNumber) return;
    
    isBotActive = !isBotActive;
    updateBotToggleUI();
    
    try {
        await fetch(`/api/bot-status/${activePhoneNumber}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_active: isBotActive })
        });
    } catch (error) {
        console.error('Error actualizando estado del bot:', error);
    }
}); 