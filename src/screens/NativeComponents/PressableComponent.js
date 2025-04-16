import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";

const PressableComponent = () => {
  const [pressCount, setPressCount] = useState(0);
  const [longPressCount, setLongPressCount] = useState(0);
  const [pressableStates, setPressableStates] = useState({
    pressed: false,
    pressIn: false,
    pressOut: false,
  });

  const handlePress = () => {
    setPressCount(pressCount + 1);
    Alert.alert("Pressed", "You pressed the button!");
  };

  const handleLongPress = () => {
    setLongPressCount(longPressCount + 1);
    Alert.alert("Long Pressed", "You long pressed the button!");
  };

  const updatePressableState = (state, value) => {
    setPressableStates((prev) => ({
      ...prev,
      [state]: value,
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic Pressable</Text>
        <Text style={styles.subDescription}>
          A simple pressable button with onPress handler.
        </Text>
        <Pressable style={styles.button} onPress={handlePress}>
          <Text style={styles.buttonText}>Press Me</Text>
        </Pressable>
        <Text style={styles.resultText}>Press count: {pressCount}</Text>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Pressable with Long Press</Text>
        <Text style={styles.subDescription}>
          A pressable that responds to both regular and long presses.
        </Text>
        <Pressable
          style={styles.button}
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
        >
          <Text style={styles.buttonText}>Press or Long Press</Text>
        </Pressable>
        <Text style={styles.resultText}>
          Long press count: {longPressCount}
        </Text>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Pressable with Style Function</Text>
        <Text style={styles.subDescription}>
          A pressable with dynamic styling based on press state.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.styledButton,
            pressed ? styles.buttonPressed : styles.buttonNormal,
          ]}
          onPress={() =>
            Alert.alert("Pressed", "Style changed while pressing!")
          }
        >
          <Text style={styles.buttonText}>Press to See Style Change</Text>
        </Pressable>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Pressable Events</Text>
        <Text style={styles.subDescription}>
          Demonstrating different press events.
        </Text>
        <Pressable
          style={[
            styles.eventsButton,
            pressableStates.pressed && styles.buttonPressed,
          ]}
          onPressIn={() => updatePressableState("pressIn", true)}
          onPressOut={() => {
            updatePressableState("pressIn", false);
            updatePressableState("pressOut", true);
            setTimeout(() => updatePressableState("pressOut", false), 1000);
          }}
          onPress={() => {
            updatePressableState("pressed", true);
            setTimeout(() => updatePressableState("pressed", false), 1000);
          }}
        >
          <Text style={styles.buttonText}>Press to Test Events</Text>
        </Pressable>
        <View style={styles.eventsContainer}>
          <Text
            style={[
              styles.eventText,
              pressableStates.pressIn && styles.activeEventText,
            ]}
          >
            onPressIn: {pressableStates.pressIn ? "Active" : "Inactive"}
          </Text>
          <Text
            style={[
              styles.eventText,
              pressableStates.pressOut && styles.activeEventText,
            ]}
          >
            onPressOut: {pressableStates.pressOut ? "Active" : "Inactive"}
          </Text>
          <Text
            style={[
              styles.eventText,
              pressableStates.pressed && styles.activeEventText,
            ]}
          >
            onPress: {pressableStates.pressed ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Pressable with HitSlop</Text>
        <Text style={styles.subDescription}>
          A pressable with extended touch area using hitSlop.
        </Text>
        <View style={styles.hitSlopContainer}>
          <Pressable
            style={styles.smallButton}
            hitSlop={20}
            onPress={() =>
              Alert.alert("Hit Slop", "Touched with extended area!")
            }
          >
            <Text style={styles.smallButtonText}>Small Target</Text>
          </Pressable>
          <Text style={styles.hitSlopDescription}>
            The touch area extends 20px beyond the visible button
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Pressable Properties</Text>
        <Text style={styles.subDescription}>
          Common Pressable properties include:
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
            • hitSlop - Extends the touch area
          </Text>
          <Text style={styles.propertyItem}>
            • android_ripple - Android ripple effect configuration
          </Text>
          <Text style={styles.propertyItem}>
            • disabled - Disables all interactions
          </Text>
          <Text style={styles.propertyItem}>
            • delayLongPress - Delay in ms for long press
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
  button: {
    backgroundColor: "#2196f3",
    padding: 15,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  resultText: {
    marginTop: 12,
    color: "#eee",
    fontSize: 14,
    textAlign: "center",
  },
  styledButton: {
    padding: 15,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonNormal: {
    backgroundColor: "#2196f3",
  },
  buttonPressed: {
    backgroundColor: "#0d47a1",
  },
  eventsButton: {
    backgroundColor: "#2196f3",
    padding: 15,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 12,
  },
  eventsContainer: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
  },
  eventText: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 8,
  },
  activeEventText: {
    color: "#4caf50",
    fontWeight: "500",
  },
  hitSlopContainer: {
    alignItems: "center",
    backgroundColor: "#333",
    padding: 20,
    borderRadius: 4,
  },
  smallButton: {
    backgroundColor: "#2196f3",
    padding: 8,
    borderRadius: 4,
    width: 100,
    alignItems: "center",
  },
  smallButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  hitSlopDescription: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
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

export default PressableComponent;
