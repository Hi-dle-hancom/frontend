import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

const TextInputComponent = () => {
  const [basicText, setBasicText] = useState("");
  const [multilineText, setMultilineText] = useState("");
  const [secureText, setSecureText] = useState("");
  const [numericText, setNumericText] = useState("");
  const [emailText, setEmailText] = useState("");
  const [phoneText, setPhoneText] = useState("");
  const [formattedText, setFormattedText] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const formatPhoneNumber = (text) => {
    // Extract numbers only
    const cleaned = text.replace(/\D/g, "");

    // Format as phone number (xxx-xxxx-xxxx)
    let formatted = "";
    if (cleaned.length <= 3) {
      formatted = cleaned;
    } else if (cleaned.length <= 7) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(
        3,
        7
      )}-${cleaned.slice(7, 11)}`;
    }

    return formatted;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhoneText(formatted);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic Text Input</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter text here"
          placeholderTextColor="#777"
          value={basicText}
          onChangeText={setBasicText}
        />
        <Text style={styles.inputValue}>Input value: {basicText}</Text>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Multiline Text Input</Text>
        <TextInput
          style={styles.multilineInput}
          placeholder="Enter multiple lines of text here"
          placeholderTextColor="#777"
          value={multilineText}
          onChangeText={setMultilineText}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.inputValue}>Input value: {multilineText}</Text>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Password Input</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter password"
            placeholderTextColor="#777"
            value={secureText}
            onChangeText={setSecureText}
            secureTextEntry={!isPasswordVisible}
          />
          <TouchableOpacity
            style={styles.visibilityToggle}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Text style={styles.toggleText}>
              {isPasswordVisible ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Numeric Input</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter numbers only"
          placeholderTextColor="#777"
          value={numericText}
          onChangeText={setNumericText}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Email Input</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email address"
          placeholderTextColor="#777"
          value={emailText}
          onChangeText={setEmailText}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>
          Phone Number Input (Auto Formatting)
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          placeholderTextColor="#777"
          value={phoneText}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Styled Input</Text>
        <TextInput
          style={styles.styledInput}
          placeholder="Styled input"
          placeholderTextColor="#777"
          value={formattedText}
          onChangeText={setFormattedText}
        />
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
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 8,
    color: "#eee",
    backgroundColor: "#333",
  },
  multilineInput: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 8,
    minHeight: 100,
    color: "#eee",
    backgroundColor: "#333",
  },
  inputValue: {
    marginTop: 8,
    fontSize: 14,
    color: "#aaa",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: "#333",
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#eee",
  },
  visibilityToggle: {
    paddingHorizontal: 12,
    height: 50,
    justifyContent: "center",
  },
  toggleText: {
    color: "#2196f3",
  },
  styledInput: {
    height: 50,
    borderWidth: 0,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: "#333",
    color: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
});

export default TextInputComponent;
