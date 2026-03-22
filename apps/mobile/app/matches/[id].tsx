import { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import socket, { connectSocket } from '@/lib/socket';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ChatScreen() {
  const { id } = useLocalSearchParams(); // matchId
  const [match, setMatch] = useState<any>(null);
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);
  
  const { user: currentUser } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id) {
       fetchMatchAndChat();
    }
  }, [id]);

  useEffect(() => {
    const chatRoomId = chatRoom?.id || chatRoom?._id;
    if (chatRoomId) {
      connectSocket(currentUser?.id);
      socket.emit('join-chat', { chatRoomId });

      const handleNewMessage = (payload: any) => {
        const message = payload.message || payload;
        const chatId = payload.chatId || payload.chatRoomId;
        
        if (chatId === chatRoomId) {
          setMessages(prev => {
            if (prev.find(m => (m._id || m.id) === (message._id || message.id))) return prev;
            return [...prev, message];
          });
        }
      };

      const handlePinned = async (payload: any) => {
        if (payload.chatRoomId === chatRoomId) {
           try {
             const msgData = await api.get(`/api/chats/${chatRoomId}/messages/${payload.messageId}`);
             setChatRoom((prev: any) => ({ ...prev, pinnedMessageId: msgData }));
           } catch (e) {
             setChatRoom((prev: any) => ({ ...prev, pinnedMessageId: payload.messageId }));
           }
        }
      };

      socket.on('new-message', handleNewMessage);
      socket.on('message-pinned', handlePinned);

      return () => {
        socket.off('new-message', handleNewMessage);
        socket.off('message-pinned', handlePinned);
        socket.emit('leave-chat', { chatRoomId });
      };
    }
  }, [chatRoom?.id, chatRoom?._id]);

  const fetchMatchAndChat = async () => {
    try {
      setLoading(true);
      const matchData: any = await api.get(`/api/matches/${id}`);
      setMatch(matchData);
      
      const chatRoomId = matchData.chatRoomId;
      if (!chatRoomId) throw new Error("No chat room ID found");

      const roomData: any = await api.get(`/api/chats/${chatRoomId}`);
      console.log('Fetched Room Data:', roomData);
      if (roomData.pinnedMessageId && typeof roomData.pinnedMessageId === 'string') {
        try {
          const pinMsg = await api.get(`/api/chats/${chatRoomId}/messages/${roomData.pinnedMessageId}`);
          roomData.pinnedMessageId = pinMsg;
        } catch (e) {
          console.warn("Failed to fetch pinned message details", e);
        }
      }
      setChatRoom(roomData);
      
      const chatRes: any = await api.get(`/api/chats/${chatRoomId}/messages?limit=25`);
      console.log('Fetched Messages:', chatRes.messages?.length);
      setMessages(chatRes.messages || []);
      setHasMore(chatRes.messages?.length === 25);
    } catch (error) {
      console.error("Fetch Match/Chat Error:", error);
      Alert.alert("Error", "Failed to load chat. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    const chatRoomId = chatRoom?.id || chatRoom?._id;
    if (loadingMore || !hasMore || messages.length === 0 || !chatRoomId) return;
    setLoadingMore(true);
    try {
      const oldestMsg = messages[0];
      const chatRes: any = await api.get(`/api/chats/${chatRoomId}/messages?before=${oldestMsg.createdAt}&limit=25`);
      if (chatRes.messages?.length > 0) {
        setMessages(prev => [...chatRes.messages, ...prev]);
        setHasMore(chatRes.messages.length === 25);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Load More Error:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const sendMessage = async () => {
    const chatRoomId = chatRoom?.id || chatRoom?._id;
    if (!msg.trim() || !chatRoomId || sending) return;

    const content = msg.trim();
    const replyId = replyingTo?._id || replyingTo?.id;
    
    // Optimistic Update
    const tempId = 'temp-' + Date.now();
    const optimisticMsg = {
      _id: tempId,
      content,
      senderId: currentUser,
      createdAt: new Date().toISOString(),
      replyToId: replyId,
      replyTo: replyingTo,
      isOptimistic: true
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setMsg("");
    setReplyingTo(null);
    setSending(true);

    try {
      const res: any = await api.post(`/api/chats/${chatRoomId}/messages`, { content, replyToId: replyId });
      setMessages(prev => prev.map(m => m._id === tempId ? { ...res, replyTo: replyingTo } : m));
    } catch (error) {
       console.error("Send Message Error:", error);
       setMessages(prev => prev.filter(m => m._id !== tempId));
       setMsg(content);
       Alert.alert("Error", "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const getSenderInfo = (sender: any) => {
    if (!sender) return { id: 'unknown', displayName: 'Unknown', photo: null };
    if (typeof sender === 'string') {
      const member = chatRoom?.members?.find((m: any) => (m.id || m._id) === sender);
      return { 
        id: sender, 
        displayName: member?.displayName || 'User', 
        photo: member?.photo 
      };
    }
    return { 
      id: sender._id || sender.id, 
      displayName: sender.displayName || 'User', 
      photo: sender.photo 
    };
  };

  const partner = useMemo(() => {
    if (!chatRoom?.members || chatRoom.members.length > 2) return null;
    return chatRoom.members.find((m: any) => (m.id || m._id) === currentUser?.id ? false : true);
  }, [chatRoom, currentUser?.id]);

  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const sharedMedia = useMemo(() => messages.filter(m => m.photoUrl), [messages]);

  const pinnedMessage = useMemo(() => {
    if (!chatRoom?.pinnedMessageId) return null;
    if (typeof chatRoom.pinnedMessageId === 'object') return chatRoom.pinnedMessageId;
    return messages.find(m => (m._id || m.id) === chatRoom.pinnedMessageId);
  }, [chatRoom?.pinnedMessageId, messages]);

  const renderMessage = ({ item, index }: { item: any, index: number }) => {
    const sender = getSenderInfo(item.senderId);
    const isMe = sender.id === currentUser?.id;
    const msgId = messages.length - 1 - index;
    const nextMsg = messages[msgId + 1];
    const prevMsg = messages[msgId - 1];
    
    const isFirstInGroup = !prevMsg || getSenderInfo(prevMsg.senderId).id !== sender.id;
    const isLastInGroup = !nextMsg || getSenderInfo(nextMsg.senderId).id !== sender.id;

    return (
      <View style={[
        styles.messageWrapper, 
        isMe ? styles.myMessageWrapper : styles.otherMessageWrapper,
        { marginBottom: isLastInGroup ? 12 : 3 }
      ]}>
        {!isMe && (
          <View style={styles.avatarContainer}>
            {isLastInGroup ? (
              <Image source={{ uri: sender.photo }} style={styles.senderAvatar} />
            ) : null}
          </View>
        )}
        <View style={styles.messageContentWrapper}>
          {!isMe && isFirstInGroup && (
            <Text style={[styles.senderName, { color: theme.accent }]}>{sender.displayName}</Text>
          )}
          
          <Pressable 
            onLongPress={() => Alert.alert("Options", "", [
              { text: "Reply", onPress: () => setReplyingTo(item) },
              { text: "Pin", onPress: () => api.post(`/api/chats/${chatRoom?.id || chatRoom?._id}/messages/${item._id || item.id}/pin`, {}) },
              { text: "Cancel", style: "cancel" }
            ])}
            style={({ pressed }) => [
              styles.bubble, 
              isMe ? 
                { backgroundColor: theme.accent, borderBottomRightRadius: isLastInGroup ? 4 : 20 } : 
                { backgroundColor: theme.surface, borderTopLeftRadius: isFirstInGroup ? 4 : 20 },
              { borderBottomLeftRadius: isLastInGroup ? 4 : 20 },
              { borderTopRightRadius: isFirstInGroup ? 4 : 20 },
              pressed && { opacity: 0.85 },
              !isMe && { borderColor: theme.border, borderWidth: 1 }
            ]}
          >
            {item.replyToId && (
              <View style={[
                styles.replyPreview, 
                { 
                  backgroundColor: isMe ? 'rgba(255,255,255,0.5)' : 'rgba(184, 240, 64, 0.2)', 
                  borderLeftColor: isMe ? theme.accent_text : theme.accent 
                }
              ]}>
                <Text style={[styles.replyName, { color: isMe ? theme.accent_text : theme.text }]} numberOfLines={1}>
                  {getSenderInfo((item.replyTo || item.replyToId).senderId).displayName}
                </Text>
                <Text style={[styles.replyText, { color: isMe ? theme.accent_text : theme.muted }]} numberOfLines={1}>
                  {(item.replyTo || item.replyToId).content}
                </Text>
              </View>
            )}
            <Text style={[styles.messageText, { color: isMe ? theme.accent_text : theme.text }]}>
              {item.content}
            </Text>
            <View style={styles.bubbleFooter}>
               <Text style={[styles.timestamp, { color: isMe ? 'rgba(255,255,255,0.6)' : theme.muted }]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
               {item.isOptimistic && (
                 <IconSymbol name="clock.fill" size={8} color="rgba(255,255,255,0.6)" style={{ marginLeft: 4 }} />
               )}
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ 
        headerTitle: () => (
          <View style={styles.headerTitleContainer}>
             <Text style={[styles.headerEventName, { color: theme.text }]} numberOfLines={1}>{match?.event?.name || 'Squad Chat'}</Text>
             <View style={styles.headerSubtitleRow}>
               <View style={[styles.dot, { backgroundColor: '#B8F040' }]} />
               <Text style={[styles.headerSubtitle, { color: theme.muted2 }]}>
                 {partner ? `with ${partner.displayName}` : `${chatRoom?.members?.length || 0} members active`}
               </Text>
             </View>
          </View>
        ),
        headerLeft: () => (
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
               <IconSymbol name="chevron.right" size={24} color={theme.text} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            {!partner && (
               <View style={[styles.headerAvatar, { backgroundColor: theme.bg3, justifyContent: 'center', alignItems: 'center' }]}>
                 <IconSymbol name="person.2.fill" size={20} color={theme.muted2} />
               </View>
            )}
            {partner && (
               <Image source={{ uri: partner.photo }} style={styles.headerAvatar} />
            )}
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfo(true)}>
            <IconSymbol name="info.circle" size={22} color={theme.text} />
          </TouchableOpacity>
        ),
        headerBackVisible: false,
        headerStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
      }} />

      {pinnedMessage && (
        <TouchableOpacity 
          style={[styles.pinnedBanner, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
          onPress={() => {
            const idx = invertedMessages.findIndex(m => (m._id || m.id) === (pinnedMessage._id || pinnedMessage.id));
            if (idx !== -1) {
              flatListRef.current?.scrollToIndex({ index: idx, animated: true });
            } else {
              Alert.alert("Pinned Message", pinnedMessage.content);
            }
          }}
        >
          <View style={[styles.pinnedIcon, { backgroundColor: theme.accent_dim }]}>
            <IconSymbol name="map.fill" size={12} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
             <Text style={[styles.pinnedLabel, { color: theme.accent }]}>PINNED MESSAGE</Text>
             <Text style={[styles.pinnedText, { color: theme.text }]} numberOfLines={1}>
               {pinnedMessage.content || 'Photo attachment'}
             </Text>
          </View>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 90}
      >
        <View style={styles.chatArea}>
          <View style={[styles.bgOverlay, { backgroundColor: theme.bg2, opacity: 0.3 }]} />
          
          {loading ? (
             <ActivityIndicator color={theme.accent} size="large" style={{ marginTop: 100 }} />
          ) : (
            <FlatList
              ref={flatListRef}
              data={invertedMessages}
              renderItem={renderMessage}
              keyExtractor={(item) => (item._id || item.id || Math.random().toString())}
              contentContainerStyle={styles.listContent}
              inverted={true}
              onEndReached={loadMoreMessages}
              onEndReachedThreshold={0.5}
              ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 10 }} /> : null}
              ListEmptyComponent={
                <View style={[styles.emptyContainer, { transform: [{ scaleY: -1 }] }]}>
                  <View style={[styles.emptyIcon, { backgroundColor: theme.accent_dim }]}>
                    <IconSymbol name="paperplane.fill" size={32} color={theme.accent} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>Say hi to the squad!</Text>
                </View>
              }
            />
          )}
        </View>

        {replyingTo && (
          <View style={[styles.replyBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <View style={[styles.replyBarIndicator, { backgroundColor: theme.accent }]} />
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <Text style={[styles.replyBarName, { color: theme.text }]}>Replying to {getSenderInfo(replyingTo.senderId).displayName}</Text>
              <Text style={[styles.replyBarText, { color: theme.muted }]}>{replyingTo.content}</Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.replyBarClose}>
              <IconSymbol name="xmark" size={16} color={theme.muted} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Type a message..."
              placeholderTextColor={theme.muted}
              value={msg}
              onChangeText={setMsg}
              multiline
            />
            <TouchableOpacity 
              onPress={sendMessage} 
              disabled={!msg.trim() || sending}
              style={[styles.sendBtn, { backgroundColor: msg.trim() ? theme.accent : theme.border }]}
            >
              {sending ? <ActivityIndicator size="small" color="#000" /> : <IconSymbol name="arrow.up" size={18} color={msg.trim() ? theme.accent_text : theme.muted} />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showInfo} animationType="slide" transparent={true} onRequestClose={() => setShowInfo(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
             <View style={styles.modalHeader}>
               <Text style={[styles.modalTitle, { color: theme.text }]}>Squad Details</Text>
               <TouchableOpacity onPress={() => setShowInfo(false)}>
                 <IconSymbol name="checkmark" size={24} color={theme.text} />
               </TouchableOpacity>
             </View>
             <FlatList
               data={chatRoom?.members || []}
               keyExtractor={(item) => (item.id || item._id)}
               renderItem={({ item }) => (
                 <View style={styles.memberItem}>
                   <Image source={{ uri: item.photo }} style={styles.memberAvatar} />
                   <View style={{ flex: 1 }}>
                     <Text style={[styles.memberName, { color: theme.text }]}>{item.displayName}</Text>
                     <View style={styles.memberStatusRow}>
                        <View style={[styles.statusDot, { backgroundColor: item.confirmationStatus === 'going' ? '#B8F040' : theme.muted }]} />
                        <Text style={[styles.memberStatus, { color: theme.muted2 }]}>
                          {item.confirmationStatus === 'going' ? 'Confirmed Going' : 'Pending Confirmation'}
                        </Text>
                     </View>
                   </View>
                 </View>
               )}
               ListHeaderComponent={() => (
                 <View style={styles.modalEventHeader}>
                    <Image source={{ uri: match?.event?.coverImage }} style={styles.modalEventImage} />
                    <Text style={[styles.modalEventName, { color: theme.text }]}>{match?.event?.name}</Text>
                    <Text style={[styles.modalEventMeta, { color: theme.muted}]}>{match?.event?.venue} • {new Date(match?.event?.date).toLocaleDateString()}</Text>
                 </View>
               )}
               ListFooterComponent={() => (
                 sharedMedia.length > 0 ? (
                   <View style={styles.modalMediaSection}>
                     <View style={styles.modalSeparator} />
                     <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Shared Media</Text>
                     <View style={styles.mediaGrid}>
                       {sharedMedia.slice(0, 9).map((m, idx) => (
                         <TouchableOpacity key={m._id || idx} style={styles.mediaItem}>
                           <Image source={{ uri: m.photoUrl }} style={styles.mediaThumbnail} />
                         </TouchableOpacity>
                       ))}
                     </View>
                   </View>
                 ) : null
               )}
             />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitleContainer: { flex: 1, paddingLeft: 10 },
  headerEventName: { fontSize: 16, fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif', fontWeight: 'bold' },
  headerSubtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  headerSubtitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 10 },
  backBtn: { padding: 4 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
  infoBtn: { marginRight: 15 },
  chatArea: { flex: 1, position: 'relative' },
  bgOverlay: { ...StyleSheet.absoluteFillObject },
  pinnedBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    gap: 12, 
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3
  },
  pinnedIcon: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  pinnedLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  pinnedText: { fontSize: 13, marginTop: 1 },
  listContent: { padding: 16, paddingBottom: 20 },
  messageWrapper: { maxWidth: '85%', flexDirection: 'row', alignItems: 'flex-end' },
  myMessageWrapper: { alignSelf: 'flex-end' },
  otherMessageWrapper: { alignSelf: 'flex-start', gap: 8 },
  avatarContainer: { width: 32 },
  senderAvatar: { width: 32, height: 32, borderRadius: 16 },
  messageContentWrapper: { flex: 1 },
  senderName: { fontSize: 11, fontWeight: '700', marginBottom: 2, marginLeft: 6 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  replyPreview: { padding: 8, borderRadius: 8, borderLeftWidth: 3, marginBottom: 8 },
  replyName: { fontSize: 11, fontWeight: '700' },
  replyText: { fontSize: 12, marginTop: 2 },
  messageText: { fontSize: 15, lineHeight: 21 },
  bubbleFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 },
  timestamp: { fontSize: 9, fontWeight: '500' },
  replyBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  replyBarIndicator: { width: 4, height: '100%', borderRadius: 2 },
  replyBarName: { fontSize: 11, fontWeight: '700' },
  replyBarText: { fontSize: 12, marginTop: 1 },
  replyBarClose: { padding: 4 },
  inputContainer: { paddingHorizontal: 12, paddingVertical: 8, paddingBottom: Platform.OS === 'ios' ? 10 : 16 },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 24, borderWidth: 1, paddingLeft: 16, paddingRight: 6, paddingVertical: 6 },
  input: { flex: 1, minHeight: 40, maxHeight: 120, paddingTop: 10, paddingBottom: 10, fontSize: 16 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '80%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Instrument Serif' : 'serif' },
  modalEventHeader: { marginBottom: 32, alignItems: 'center' },
  modalEventImage: { width: '100%', height: 160, borderRadius: 20, marginBottom: 16 },
  modalEventName: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  modalEventMeta: { fontSize: 14, textAlign: 'center' },
  modalMediaSection: { marginTop: 24, paddingBottom: 40 },
  modalSeparator: { height: 1, backgroundColor: '#eee', marginBottom: 24 },
  modalSectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mediaItem: { width: '31.5%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f0f0' },
  mediaThumbnail: { width: '100%', height: '100%' },
  memberItem: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  memberAvatar: { width: 48, height: 48, borderRadius: 24 },
  memberName: { fontSize: 16, fontWeight: '600' },
  memberStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  memberStatus: { fontSize: 13 },
});
