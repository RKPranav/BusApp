import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const ChatScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  // Use layout effect to update header title if needed
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Group Chat',
    });
  }, [navigation]);

  useEffect(() => {
    // Query chats collection ordered by createdAt
    const q = query(collection(db, 'chats'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, snapshot => {
      const msgs = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  const onSend = async () => {
    if (text.trim().length === 0) return;

    try {
      const { uid, email } = auth.currentUser;
      await addDoc(collection(db, 'chats'), {
        text,
        senderId: uid,
        senderEmail: email,
        createdAt: serverTimestamp(),
      });
      setText('');
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  const renderItem = ({ item }) => {
    const isMyMessage = item.senderId === auth.currentUser?.uid;
    return (
      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}
      >
        {!isMyMessage && (
          <Text style={styles.senderName}>
            {item.senderEmail?.split('@')[0]}
          </Text>
        )}
        <Text
          style={[
            styles.messageText,
            isMyMessage ? styles.myText : styles.theirText,
          ]}
        >
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        inverted // Show newest messages at bottom
        contentContainerStyle={{ padding: 10 }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity onPress={onSend} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginVertical: 4,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e5ea',
  },
  senderName: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
  },
  myText: {
    color: '#fff',
  },
  theirText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#f9f9f9',
  },
  sendBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
