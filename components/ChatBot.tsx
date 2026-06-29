import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { supabase } from '@/services/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME: Message = {
  role: 'assistant',
  content: '¡Hola! Soy el asesor de AhorraPeru 👋 Puedo ayudarte a entender las opciones de ahorro en Perú o encontrar el producto que más te conviene. ¿En qué te ayudo?',
};

const FAQ = [
  {
    question: '¿Qué es la TREA?',
    answer: 'La TREA (Tasa de Rendimiento Efectiva Anual) es lo que realmente ganarás en un año, ya incluyendo la capitalización de intereses. Es la métrica más honesta para comparar — a diferencia de la TNA, está calculada para todo el año completo.',
  },
  {
    question: '¿Qué es el FSD?',
    answer: 'El Fondo de Seguro de Depósitos protege tu dinero hasta S/ 124,000 si el banco o financiera quiebra. Cubre bancos, financieras y cajas municipales reguladas por la SBS. Los fondos mutuos y AFP no están cubiertos por el FSD.',
  },
  {
    question: '¿Cuál me conviene?',
    answer: null,
  },
  {
    question: '¿CTS vs plazo fijo?',
    answer: 'La CTS es un beneficio laboral automático si trabajas en planilla — no puedes elegir no tenerla, solo dónde depositarla. El plazo fijo es una decisión voluntaria con tu ahorro libre. Lo ideal: primero optimiza el banco de tu CTS, luego el plazo fijo con lo que ahorres.',
  },
  {
    question: '¿Cómo uso el comparador?',
    answer: 'En el tab "Comparar" toca el "+" en cualquier producto. Al seleccionar dos, aparece el botón "Comparar →" en la parte de abajo. Verás tasas, riesgo, liquidez y montos mínimos lado a lado, con el ganador resaltado en cada criterio.',
  },
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFaq, setShowFaq] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const sendToAI = useCallback(async (history: Message[]) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('clever-processor', {
        body: {
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        },
      });
      if (error) throw error;
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, tuve un problema de conexión. Intenta de nuevo en un momento.' },
      ]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }, [scrollToEnd]);

  const handleFaq = useCallback((item: typeof FAQ[0]) => {
    setShowFaq(false);
    const userMsg: Message = { role: 'user', content: item.question };

    if (item.answer) {
      const botMsg: Message = { role: 'assistant', content: item.answer };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      scrollToEnd();
    } else {
      const updated = [...messages, userMsg];
      setMessages(updated);
      scrollToEnd();
      sendToAI(updated);
    }
  }, [messages, sendToAI, scrollToEnd]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;
    setShowFaq(false);
    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    scrollToEnd();
    sendToAI(updated);
  }, [input, loading, messages, sendToAI, scrollToEnd]);

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Ionicons name="chatbubble-ellipses" size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={() => setOpen(false)} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.panel}
          >
            <SafeAreaView style={styles.panelInner} edges={['bottom']}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.avatar}>
                    <Ionicons name="sparkles" size={14} color="#FFF" />
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>Asesor AhorraPeru</Text>
                    <Text style={styles.headerSub}>Responde en segundos · IA</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Mensajes */}
              <ScrollView
                ref={scrollRef}
                style={styles.messages}
                contentContainerStyle={styles.messagesContent}
              >
                {messages.map((msg, i) => (
                  <View
                    key={i}
                    style={[
                      styles.bubble,
                      msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot,
                    ]}
                  >
                    <Text style={[
                      styles.bubbleText,
                      msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextBot,
                    ]}>
                      {msg.content}
                    </Text>
                  </View>
                ))}

                {loading && (
                  <View style={[styles.bubble, styles.bubbleBot, styles.loadingBubble]}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                  </View>
                )}

                {showFaq && !loading && (
                  <View style={styles.faqBlock}>
                    <Text style={styles.faqTitle}>Preguntas frecuentes</Text>
                    {FAQ.map((item, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.faqChip}
                        onPress={() => handleFaq(item)}
                      >
                        <Text style={styles.faqChipText}>{item.question}</Text>
                        <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Input */}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Escribe tu pregunta..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  maxLength={300}
                  returnKeyType="send"
                  blurOnSubmit
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
                  onPress={handleSend}
                  disabled={!input.trim() || loading}
                >
                  <Ionicons name="send" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  panel: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  panelInner: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  closeBtn: { padding: 4 },

  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 8 },

  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleBot: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextBot: { color: Colors.textPrimary },
  bubbleTextUser: { color: '#FFF' },
  loadingBubble: { paddingVertical: 14, paddingHorizontal: 20 },

  faqBlock: { marginTop: 8, gap: 6 },
  faqTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  faqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  faqChipText: { fontSize: 13, color: Colors.primary, fontWeight: '600', flex: 1 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: Colors.border },
});
