import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";

const KeyboardAvoidingViewComponent = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello there!" },
    { id: 2, text: "How are you doing?" },
  ]);

  const handleSend = () => {
    if (message.trim() === "") return;

    const newMessage = {
      id: messages.length + 1,
      text: message,
    };

    setMessages([...messages, newMessage]);
    setMessage("");
    Keyboard.dismiss();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic KeyboardAvoidingView</Text>
        <Text style={styles.subDescription}>
          A simple implementation with padding behavior.
        </Text>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.basicExample}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.innerContainer}>
              <Text style={styles.label}>Enter your name:</Text>
              <TextInput
                style={styles.input}
                placeholder="Type here..."
                placeholderTextColor="#777"
              />
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Chat Interface Example</Text>
        <Text style={styles.subDescription}>
          A chat interface that adjusts when the keyboard appears.
        </Text>
        <View style={styles.chatContainer}>
          <ScrollView style={styles.messagesContainer}>
            {messages.map((msg) => (
              <View key={msg.id} style={styles.messageItem}>
                <Text style={styles.messageText}>{msg.text}</Text>
              </View>
            ))}
          </ScrollView>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={100}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.chatInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                placeholderTextColor="#777"
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Different Behaviors</Text>
        <Text style={styles.subDescription}>
          KeyboardAvoidingView supports different behaviors:
        </Text>
        <View style={styles.behaviorsContainer}>
          <View style={styles.behaviorItem}>
            <Text style={styles.behaviorTitle}>padding</Text>
            <Text style={styles.behaviorDescription}>
              Adds padding to the bottom of the view equal to the keyboard
              height.
            </Text>
          </View>
          <View style={styles.behaviorItem}>
            <Text style={styles.behaviorTitle}>height</Text>
            <Text style={styles.behaviorDescription}>
              Decreases the height of the view by the keyboard height.
            </Text>
          </View>
          <View style={styles.behaviorItem}>
            <Text style={styles.behaviorTitle}>position</Text>
            <Text style={styles.behaviorDescription}>
              Translates the view upward by the keyboard height.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>KeyboardAvoidingView Properties</Text>
        <Text style={styles.subDescription}>
          Common KeyboardAvoidingView properties include:
        </Text>
        <View style={styles.propertiesList}>
          <Text style={styles.propertyItem}>
            • behavior - How the view responds to keyboard (padding, height,
            position)
          </Text>
          <Text style={styles.propertyItem}>
            • keyboardVerticalOffset - Additional distance from the keyboard
          </Text>
          <Text style={styles.propertyItem}>
            • contentContainerStyle - Style for the content container
          </Text>
          <Text style={styles.propertyItem}>
            • enabled - Whether to automatically adjust for keyboard
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101010",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#eee",
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    color: "#aaa",
    lineHeight: 22,
  },
  exampleContainer: {
    backgroundColor: "#242423",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
    color: "#eee",
  },
  subDescription: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 12,
  },
  basicExample: {
    backgroundColor: "#333",
    borderRadius: 4,
    padding: 16,
  },
  innerContainer: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#eee",
  },
  input: {
    backgroundColor: "#444",
    padding: 12,
    borderRadius: 4,
    color: "#eee",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#555",
  },
  button: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  chatContainer: {
    backgroundColor: "#333",
    borderRadius: 4,
    height: 300,
    overflow: "hidden",
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
    height: 220,
  },
  messageItem: {
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#eee",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#444",
    backgroundColor: "#333",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 20,
    color: "#eee",
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#2196f3",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  behaviorsContainer: {
    backgroundColor: "#333",
    borderRadius: 4,
    padding: 16,
  },
  behaviorItem: {
    marginBottom: 16,
  },
  behaviorTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#eee",
    marginBottom: 4,
  },
  behaviorDescription: {
    fontSize: 14,
    color: "#aaa",
  },
  propertiesList: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 4,
  },
  propertyItem: {
    color: "#eee",
    fontSize: 14,
    marginBottom: 8,
  },
});

export default KeyboardAvoidingViewComponent;
