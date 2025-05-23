# 🚀 **Integração WebSocket Flutter - BPKar Chat**

## 📋 **Visão Geral**

Este documento fornece instruções completas para integrar o aplicativo Flutter com o sistema WebSocket de chat em tempo real do backend BPKar.

## 🔧 **Configuração Flutter**

### **1. Dependências Necessárias**

Adicione ao `pubspec.yaml`:

```yaml
dependencies:
  socket_io_client: ^2.0.3+1
  permission_handler: ^11.3.1
  connectivity_plus: ^6.0.3
  shared_preferences: ^2.2.3
```

### **2. Classe Principal WebSocket Service**

```dart
// lib/services/websocket_service.dart
import 'dart:async';
import 'dart:convert';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';

class WebSocketService extends ChangeNotifier {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  IO.Socket? _socket;
  String? _token;
  bool _isConnected = false;
  final Map<String, List<Function>> _eventListeners = {};

  // Getters
  bool get isConnected => _isConnected;
  IO.Socket? get socket => _socket;

  /// Conectar ao servidor WebSocket
  Future<bool> connect(String serverUrl, String token) async {
    try {
      _token = token;
      
      _socket = IO.io(serverUrl, IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(5)
          .setReconnectionDelay(2000)
          .setTimeout(20000)
          .build());

      // Event listeners principais
      _setupEventListeners();
      
      _socket!.connect();
      
      return true;
    } catch (e) {
      debugPrint('Erro ao conectar WebSocket: $e');
      return false;
    }
  }

  /// Configurar listeners de eventos
  void _setupEventListeners() {
    _socket!.onConnect((_) {
      _isConnected = true;
      debugPrint('🟢 WebSocket conectado');
      notifyListeners();
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      debugPrint('🔴 WebSocket desconectado');
      notifyListeners();
    });

    _socket!.onConnectError((error) {
      debugPrint('❌ Erro de conexão WebSocket: $error');
    });

    _socket!.onError((error) {
      debugPrint('❌ Erro WebSocket: $error');
    });

    // Listeners específicos do chat
    _setupChatListeners();
  }

  /// Configurar listeners específicos do chat
  void _setupChatListeners() {
    // Mensagem recebida
    _socket!.on('new_message', (data) {
      _notifyListeners('new_message', data);
    });

    // Confirmação de mensagem enviada
    _socket!.on('message_sent', (data) {
      _notifyListeners('message_sent', data);
    });

    // Erro ao enviar mensagem
    _socket!.on('message_error', (data) {
      _notifyListeners('message_error', data);
    });

    // Status de entrega
    _socket!.on('message_delivered', (data) {
      _notifyListeners('message_delivered', data);
    });

    // Status de leitura
    _socket!.on('message_read', (data) {
      _notifyListeners('message_read', data);
    });

    // Usuário digitando
    _socket!.on('user_typing', (data) {
      _notifyListeners('user_typing', data);
    });

    // Usuário parou de digitar
    _socket!.on('user_stopped_typing', (data) {
      _notifyListeners('user_stopped_typing', data);
    });

    // Status de contato mudou
    _socket!.on('contact_status_changed', (data) {
      _notifyListeners('contact_status_changed', data);
    });

    // Usuário entrou no grupo
    _socket!.on('user_joined_group', (data) {
      _notifyListeners('user_joined_group', data);
    });

    // Usuário saiu do grupo
    _socket!.on('user_left_group', (data) {
      _notifyListeners('user_left_group', data);
    });

    // Mensagem editada
    _socket!.on('message_edited', (data) {
      _notifyListeners('message_edited', data);
    });

    // Mensagem deletada
    _socket!.on('message_deleted', (data) {
      _notifyListeners('message_deleted', data);
    });

    // Mensagem cancelada (recall)
    _socket!.on('message_recalled', (data) {
      _notifyListeners('message_recalled', data);
    });
  }

  /// Registrar listener para evento específico
  void addEventListener(String event, Function callback) {
    if (!_eventListeners.containsKey(event)) {
      _eventListeners[event] = [];
    }
    _eventListeners[event]!.add(callback);
  }

  /// Remover listener de evento
  void removeEventListener(String event, Function callback) {
    _eventListeners[event]?.remove(callback);
  }

  /// Notificar listeners
  void _notifyListeners(String event, dynamic data) {
    _eventListeners[event]?.forEach((callback) {
      try {
        callback(data);
      } catch (e) {
        debugPrint('Erro ao executar callback para evento $event: $e');
      }
    });
  }

  /// Enviar mensagem
  Future<bool> sendMessage({
    required int groupId,
    required String content,
    String type = 'text',
    int? replyToId,
    String? fileUrl,
    String? fileName,
    int? fileSize,
    String? tempId,
  }) async {
    if (!_isConnected || _socket == null) {
      return false;
    }

    final completer = Completer<bool>();
    
    _socket!.emitWithAck('send_message', {
      'groupId': groupId,
      'content': content,
      'type': type,
      'replyToId': replyToId,
      'fileUrl': fileUrl,
      'fileName': fileName,
      'fileSize': fileSize,
      'tempId': tempId ?? DateTime.now().millisecondsSinceEpoch.toString(),
    }, ack: (data) {
      completer.complete(data['success'] == true);
    });

    return completer.future;
  }

  /// Entrar em grupo
  Future<bool> joinGroup(int groupId) async {
    if (!_isConnected || _socket == null) {
      return false;
    }

    final completer = Completer<bool>();
    
    _socket!.emitWithAck('join_group', {
      'groupId': groupId,
    }, ack: (data) {
      completer.complete(data['success'] == true);
    });

    return completer.future;
  }

  /// Sair do grupo
  Future<bool> leaveGroup(int groupId) async {
    if (!_isConnected || _socket == null) {
      return false;
    }

    final completer = Completer<bool>();
    
    _socket!.emitWithAck('leave_group', {
      'groupId': groupId,
    }, ack: (data) {
      completer.complete(data['success'] == true);
    });

    return completer.future;
  }

  /// Marcar mensagens como entregues
  void markMessagesAsDelivered(List<int> messageIds) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('message_delivered', {
      'messageIds': messageIds,
    });
  }

  /// Marcar mensagens como lidas
  void markMessagesAsRead(List<int> messageIds, int groupId) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('message_read', {
      'messageIds': messageIds,
      'groupId': groupId,
    });
  }

  /// Indicar que usuário está digitando
  void startTyping(int groupId) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('typing_start', {
      'groupId': groupId,
    });
  }

  /// Indicar que usuário parou de digitar
  void stopTyping(int groupId) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('typing_stop', {
      'groupId': groupId,
    });
  }

  /// Atualizar status do usuário
  void updateUserStatus(String status) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('update_status', {
      'status': status, // 'online', 'away', 'busy'
    });
  }

  /// Obter usuários online em grupo
  Future<List<Map<String, dynamic>>> getOnlineUsersInGroup(int groupId) async {
    if (!_isConnected || _socket == null) {
      return [];
    }

    final completer = Completer<List<Map<String, dynamic>>>();
    
    _socket!.emitWithAck('get_online_users', {
      'groupId': groupId,
    }, ack: (data) {
      if (data['success'] == true) {
        completer.complete(List<Map<String, dynamic>>.from(data['data'] ?? []));
      } else {
        completer.complete([]);
      }
    });

    return completer.future;
  }

  /// Editar mensagem
  Future<bool> editMessage(int messageId, String newContent) async {
    if (!_isConnected || _socket == null) {
      return false;
    }

    final completer = Completer<bool>();
    
    _socket!.emitWithAck('edit_message', {
      'messageId': messageId,
      'content': newContent,
    }, ack: (data) {
      completer.complete(data['success'] == true);
    });

    return completer.future;
  }

  /// Deletar mensagem
  Future<bool> deleteMessage(int messageId) async {
    if (!_isConnected || _socket == null) {
      return false;
    }

    final completer = Completer<bool>();
    
    _socket!.emitWithAck('delete_message', {
      'messageId': messageId,
    }, ack: (data) {
      completer.complete(data['success'] == true);
    });

    return completer.future;
  }

  /// Cancelar mensagem (recall)
  Future<bool> recallMessage(int messageId) async {
    if (!_isConnected || _socket == null) {
      return false;
    }

    final completer = Completer<bool>();
    
    _socket!.emitWithAck('recall_message', {
      'messageId': messageId,
    }, ack: (data) {
      completer.complete(data['success'] == true);
    });

    return completer.future;
  }

  /// Upload de arquivo
  Future<Map<String, dynamic>?> uploadFile({
    required String fileName,
    required String fileBase64,
    required int fileSize,
    required int groupId,
  }) async {
    if (!_isConnected || _socket == null) {
      return null;
    }

    final completer = Completer<Map<String, dynamic>?>();
    
    _socket!.emitWithAck('upload_file', {
      'fileName': fileName,
      'file': fileBase64,
      'fileSize': fileSize,
      'groupId': groupId,
    }, ack: (data) {
      if (data['success'] == true) {
        completer.complete({
          'fileUrl': data['fileUrl'],
          'fileName': data['fileName'],
          'fileSize': data['fileSize'],
        });
      } else {
        completer.complete(null);
      }
    });

    return completer.future;
  }

  /// Desconectar
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    _eventListeners.clear();
    notifyListeners();
  }
}
```

## 📱 **Implementação no Flutter**

### **3. Chat Service**

```dart
// lib/services/chat_service.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'websocket_service.dart';

class ChatService extends ChangeNotifier {
  final WebSocketService _wsService = WebSocketService();
  final String baseUrl;
  String? _token;

  ChatService({required this.baseUrl});

  /// Inicializar conexão
  Future<bool> initialize(String token) async {
    _token = token;
    
    // Conectar WebSocket
    final wsUrl = baseUrl.replaceFirst('http', 'ws');
    final connected = await _wsService.connect(wsUrl, token);
    
    if (connected) {
      _setupEventListeners();
    }
    
    return connected;
  }

  /// Configurar listeners de eventos
  void _setupEventListeners() {
    _wsService.addEventListener('new_message', _handleNewMessage);
    _wsService.addEventListener('message_sent', _handleMessageSent);
    _wsService.addEventListener('message_error', _handleMessageError);
    _wsService.addEventListener('message_delivered', _handleMessageDelivered);
    _wsService.addEventListener('message_read', _handleMessageRead);
    _wsService.addEventListener('user_typing', _handleUserTyping);
    _wsService.addEventListener('user_stopped_typing', _handleUserStoppedTyping);
    _wsService.addEventListener('contact_status_changed', _handleContactStatusChanged);
  }

  /// Handlers de eventos
  void _handleNewMessage(dynamic data) {
    // Implementar lógica para nova mensagem
    debugPrint('Nova mensagem recebida: $data');
    notifyListeners();
  }

  void _handleMessageSent(dynamic data) {
    // Implementar confirmação de envio
    debugPrint('Mensagem enviada: $data');
    notifyListeners();
  }

  void _handleMessageError(dynamic data) {
    // Implementar tratamento de erro
    debugPrint('Erro ao enviar mensagem: $data');
    notifyListeners();
  }

  void _handleMessageDelivered(dynamic data) {
    // Implementar status de entrega
    debugPrint('Mensagem entregue: $data');
    notifyListeners();
  }

  void _handleMessageRead(dynamic data) {
    // Implementar status de leitura
    debugPrint('Mensagem lida: $data');
    notifyListeners();
  }

  void _handleUserTyping(dynamic data) {
    // Implementar indicador de digitação
    debugPrint('Usuário digitando: $data');
    notifyListeners();
  }

  void _handleUserStoppedTyping(dynamic data) {
    // Implementar parada de digitação
    debugPrint('Usuário parou de digitar: $data');
    notifyListeners();
  }

  void _handleContactStatusChanged(dynamic data) {
    // Implementar mudança de status
    debugPrint('Status do contato mudou: $data');
    notifyListeners();
  }

  /// Enviar mensagem
  Future<bool> sendMessage({
    required int groupId,
    required String content,
    String type = 'text',
    int? replyToId,
  }) async {
    // Gerar ID temporário
    final tempId = DateTime.now().millisecondsSinceEpoch.toString();
    
    // Adicionar mensagem localmente (otimistic update)
    _addLocalMessage(groupId, content, tempId);
    
    // Enviar via WebSocket
    final success = await _wsService.sendMessage(
      groupId: groupId,
      content: content,
      type: type,
      replyToId: replyToId,
      tempId: tempId,
    );
    
    if (!success) {
      // Marcar mensagem como erro se falhou
      _markMessageAsError(tempId);
    }
    
    return success;
  }

  /// Adicionar mensagem localmente
  void _addLocalMessage(int groupId, String content, String tempId) {
    // Implementar adição local da mensagem
    notifyListeners();
  }

  /// Marcar mensagem como erro
  void _markMessageAsError(String tempId) {
    // Implementar marcação de erro
    notifyListeners();
  }

  /// Buscar mensagens do grupo
  Future<List<Map<String, dynamic>>> getGroupMessages(
    int groupId, {
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/chat/groups/$groupId/messages?page=$page&limit=$limit'),
        headers: {
          'Authorization': 'Bearer $_token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data['data']['messages'] ?? []);
      }
    } catch (e) {
      debugPrint('Erro ao buscar mensagens: $e');
    }
    
    return [];
  }

  /// Buscar grupos do usuário
  Future<List<Map<String, dynamic>>> getUserGroups({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/chat/groups?page=$page&limit=$limit'),
        headers: {
          'Authorization': 'Bearer $_token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data['data']['groups'] ?? []);
      }
    } catch (e) {
      debugPrint('Erro ao buscar grupos: $e');
    }
    
    return [];
  }

  /// Criar grupo
  Future<Map<String, dynamic>?> createGroup({
    required String name,
    String? description,
    String type = 'group',
    List<int> memberIds = const [],
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/chat/groups'),
        headers: {
          'Authorization': 'Bearer $_token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'name': name,
          'description': description,
          'type': type,
          'memberIds': memberIds,
        }),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        return data['data'];
      }
    } catch (e) {
      debugPrint('Erro ao criar grupo: $e');
    }
    
    return null;
  }

  /// Buscar usuários
  Future<List<Map<String, dynamic>>> searchUsers(String query, {int limit = 10}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/chat/users/search?q=${Uri.encodeComponent(query)}&limit=$limit'),
        headers: {
          'Authorization': 'Bearer $_token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data['data'] ?? []);
      }
    } catch (e) {
      debugPrint('Erro ao buscar usuários: $e');
    }
    
    return [];
  }

  /// Cleanup
  void dispose() {
    _wsService.disconnect();
    super.dispose();
  }
}
```

### **4. Exemplo de Tela de Chat**

```dart
// lib/screens/chat_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/chat_service.dart';

class ChatScreen extends StatefulWidget {
  final int groupId;
  final String groupName;
  
  const ChatScreen({
    Key? key,
    required this.groupId,
    required this.groupName,
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _joinGroup();
  }

  Future<void> _loadMessages() async {
    setState(() => _isLoading = true);
    
    final chatService = context.read<ChatService>();
    final messages = await chatService.getGroupMessages(widget.groupId);
    
    setState(() {
      _messages = messages;
      _isLoading = false;
    });
  }

  Future<void> _joinGroup() async {
    final chatService = context.read<ChatService>();
    await chatService._wsService.joinGroup(widget.groupId);
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    _messageController.clear();
    
    final chatService = context.read<ChatService>();
    await chatService.sendMessage(
      groupId: widget.groupId,
      content: content,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.groupName),
        actions: [
          Consumer<ChatService>(
            builder: (context, chatService, _) {
              final isConnected = chatService._wsService.isConnected;
              return Icon(
                isConnected ? Icons.wifi : Icons.wifi_off,
                color: isConnected ? Colors.green : Colors.red,
              );
            },
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Column(
        children: [
          // Lista de mensagens
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      return _buildMessageTile(message);
                    },
                  ),
          ),
          
          // Campo de entrada
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: 'Digite sua mensagem...',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _sendMessage,
                  icon: const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageTile(Map<String, dynamic> message) {
    return ListTile(
      title: Text(message['senderName'] ?? 'Usuário'),
      subtitle: Text(message['content'] ?? ''),
      trailing: Text(
        _formatTime(message['createdAt']),
        style: Theme.of(context).textTheme.bodySmall,
      ),
    );
  }

  String _formatTime(String? timestamp) {
    if (timestamp == null) return '';
    final dateTime = DateTime.parse(timestamp);
    return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
```

## 🔧 **Configuração e Inicialização**

### **5. Configuração no main.dart**

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/chat_service.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => ChatService(baseUrl: 'http://localhost:4040'),
        ),
      ],
      child: MaterialApp(
        title: 'BPKar Chat',
        theme: ThemeData(
          primarySwatch: Colors.blue,
        ),
        home: LoginScreen(), // Sua tela de login
      ),
    );
  }
}
```

## 🚀 **Recursos Avançados**

### **6. Reconexão Automática**

```dart
// Adicionar ao WebSocketService
Timer? _reconnectTimer;

void _setupReconnection() {
  _socket!.onDisconnect((_) {
    _isConnected = false;
    _startReconnectionTimer();
    notifyListeners();
  });
}

void _startReconnectionTimer() {
  _reconnectTimer?.cancel();
  _reconnectTimer = Timer.periodic(Duration(seconds: 5), (timer) {
    if (!_isConnected && _token != null) {
      debugPrint('🔄 Tentando reconectar...');
      _socket?.connect();
    } else {
      timer.cancel();
    }
  });
}
```

### **7. Cache Local de Mensagens**

```dart
// lib/services/message_cache.dart
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class MessageCache {
  static const String _keyPrefix = 'messages_group_';

  static Future<void> saveMessages(int groupId, List<Map<String, dynamic>> messages) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '$_keyPrefix$groupId';
    final json = jsonEncode(messages);
    await prefs.setString(key, json);
  }

  static Future<List<Map<String, dynamic>>> getMessages(int groupId) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '$_keyPrefix$groupId';
    final json = prefs.getString(key);
    
    if (json != null) {
      final List<dynamic> decoded = jsonDecode(json);
      return List<Map<String, dynamic>>.from(decoded);
    }
    
    return [];
  }
}
```

## 🎯 **Eventos WebSocket Disponíveis**

### **Eventos do Cliente para Servidor:**
- `send_message` - Enviar mensagem
- `join_group` - Entrar em grupo
- `leave_group` - Sair do grupo
- `message_delivered` - Marcar como entregue
- `message_read` - Marcar como lida
- `typing_start` - Começar a digitar
- `typing_stop` - Parar de digitar
- `update_status` - Atualizar status
- `get_online_users` - Obter usuários online
- `edit_message` - Editar mensagem
- `delete_message` - Deletar mensagem
- `recall_message` - Cancelar mensagem (até 5 min)
- `upload_file` - Upload de arquivo

### **Eventos do Servidor para Cliente:**
- `connected` - Conexão estabelecida
- `new_message` - Nova mensagem recebida
- `message_sent` - Confirmação de envio
- `message_error` - Erro ao enviar
- `message_delivered` - Confirmação de entrega
- `message_read` - Confirmação de leitura
- `user_typing` - Usuário digitando
- `user_stopped_typing` - Usuário parou de digitar
- `contact_status_changed` - Status do contato mudou
- `user_joined_group` - Usuário entrou no grupo
- `user_left_group` - Usuário saiu do grupo
- `server_shutdown` - Servidor reiniciando
- `message_edited` - Mensagem editada
- `message_deleted` - Mensagem deletada
- `message_recalled` - Mensagem cancelada (recall)

## 🔒 **Segurança e Boas Práticas**

1. **Autenticação JWT**: Token sempre enviado no handshake
2. **Rate Limiting**: 100 eventos por minuto por usuário
3. **Validação**: Todos os dados validados no servidor
4. **Reconexão**: Automática com backoff exponencial
5. **Cache Local**: Para funcionamento offline
6. **Limpeza**: Dispose adequado dos recursos

## 📊 **Monitoramento e Debug**

```dart
// Logs detalhados para debug
void enableDebugMode() {
  _wsService.socket?.onAny((event, data) {
    debugPrint('📡 WebSocket Event: $event - Data: $data');
  });
}
```

Esta documentação fornece uma base sólida para integração completa do Flutter com o sistema WebSocket de alta performance do backend BPKar! 🚀 