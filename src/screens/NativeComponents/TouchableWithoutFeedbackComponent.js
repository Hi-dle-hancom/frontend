import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  Keyboard,
  TextInput,
} from "react-native";

const TouchableWithoutFeedbackComponent = () => {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const handlePress = (message) => {
    Alert.alert("Pressed", message);
  };

  const incrementCount = () => {
    setCount(count + 1);
  };

  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic TouchableWithoutFeedback</Text>
        <Text style={styles.subDescription}>
          A simple touchable area with no visual feedback.
        </Text>
        <TouchableWithoutFeedback
          onPress={() => handlePress("You pressed the basic touchable area!")}
        >
          <View style={styles.touchableArea}>
            <Text style={styles.touchableText}>
              Press Me (No Visual Feedback)
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Dismissing Keyboard</Text>
        <Text style={styles.subDescription}>
          Using TouchableWithoutFeedback to dismiss the keyboard when tapping
          outside an input.
        </Text>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.keyboardDismissContainer}>
            <Text style={styles.inputLabel}>Enter some text:</Text>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type here..."
              placeholderTextColor="#777"
            />
            <Text style={styles.dismissHint}>
              Tap outside the input to dismiss keyboard
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Custom Interaction</Text>
        <Text style={styles.subDescription}>
          Using TouchableWithoutFeedback to create a custom interaction.
        </Text>
        <View style={styles.customInteractionContainer}>
          <TouchableWithoutFeedback onPress={incrementCount}>
            <View style={styles.counterBox}>
              <Text style={styles.counterText}>{count}</Text>
            </View>
          </TouchableWithoutFeedback>
          <Text style={styles.counterInstructions}>
            Tap the box to increment the counter
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Information Toggle</Text>
        <Text style={styles.subDescription}>
          Using TouchableWithoutFeedback to toggle information display.
        </Text>
        <TouchableWithoutFeedback onPress={toggleInfo}>
          <View style={styles.infoContainer}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>
                What is TouchableWithoutFeedback?
              </Text>
              <Text style={styles.infoToggle}>{showInfo ? "▲" : "▼"}</Text>
            </View>

            {showInfo && (
              <View style={styles.infoContent}>
                <Text style={styles.infoText}>
                  TouchableWithoutFeedback is a wrapper for making views respond
                  properly to touches. It doesn't provide any visual feedback
                  when pressed, making it useful for custom interactions or when
                  you want to implement your own visual feedback.
                </Text>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Long Press Example</Text>
        <Text style={styles.subDescription}>
          TouchableWithoutFeedback with long press handler.
        </Text>
        <TouchableWithoutFeedback
          onLongPress={() =>
            Alert.alert("Long Pressed", "You performed a long press!")
          }
          delayLongPress={1000}
        >
          <View style={styles.longPressArea}>
            <Text style={styles.touchableText}>
              Long Press Me (Hold for 1 second)
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>
          TouchableWithoutFeedback Properties
        </Text>
        <Text style={styles.subDescription}>
          Common TouchableWithoutFeedback properties include:
        </Text>
        <View style={styles.propertiesList}>
          <Text style={styles.propertyItem}>
            • onPress - Function called on press
          </Text>
          <Text style={styles.propertyItem}>
            • onLongPress - Function called on long press
          </Text>
          <Text style={styles.propertyItem}>
            • onPressIn - Function called when press is detected
          </Text>
          <Text style={styles.propertyItem}>
            • onPressOut - Function called when press is released
          </Text>
          <Text style={styles.propertyItem}>
            • delayLongPress - Delay in ms for long press
          </Text>
          <Text style={styles.propertyItem}>
            • disabled - Disables all interactions
          </Text>
          <Text style={styles.propertyItem}>
            • hitSlop - Extends the touch area
          </Text>
          <Text style={styles.propertyItem}>
            • pressRetentionOffset - Controls touch cancelation
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
  touchableArea: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
    borderStyle: "dashed",
  },
  touchableText: {
    color: "#eee",
    fontSize: 16,
  },
  keyboardDismissContainer: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 4,
  },
  inputLabel: {
    color: "#eee",
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#444",
    padding: 12,
    borderRadius: 4,
    color: "#eee",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#555",
  },
  dismissHint: {
    color: "#aaa",
    fontSize: 12,
    fontStyle: "italic",
  },
  customInteractionContainer: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 4,
    alignItems: "center",
  },
  counterBox: {
    width: 100,
    height: 100,
    backgroundColor: "#2196f3",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 10,
  },
  counterText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
  },
  counterInstructions: {
    color: "#aaa",
    fontSize: 14,
  },
  infoContainer: {
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: (showInfo) => (showInfo ? 1 : 0),
    borderBottomColor: "#444",
  },
  infoTitle: {
    color: "#eee",
    fontSize: 16,
    fontWeight: "500",
  },
  infoToggle: {
    color: "#2196f3",
    fontSize: 16,
  },
  infoContent: {
    padding: 15,
  },
  infoText: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 20,
  },
  longPressArea: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
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

export default TouchableWithoutFeedbackComponent;
