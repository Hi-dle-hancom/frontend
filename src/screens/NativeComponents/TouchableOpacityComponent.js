import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";

const TouchableOpacityComponent = () => {
  const [count, setCount] = useState(0);
  const [activeButton, setActiveButton] = useState(null);

  const handlePress = (message) => {
    Alert.alert("Button Pressed", message);
  };

  const handleLongPress = () => {
    Alert.alert("Long Press", "You performed a long press!");
  };

  const incrementCount = () => {
    setCount(count + 1);
  };

  const selectButton = (buttonId) => {
    setActiveButton(buttonId);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic TouchableOpacity</Text>
        <Text style={styles.subDescription}>
          A simple button with a press handler.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handlePress("You pressed the basic button!")}
        >
          <Text style={styles.buttonText}>Press Me</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>
          TouchableOpacity with Long Press
        </Text>
        <Text style={styles.subDescription}>
          A button that responds to both regular and long presses.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handlePress("You pressed the button!")}
          onLongPress={handleLongPress}
          delayLongPress={500}
        >
          <Text style={styles.buttonText}>Press or Long Press</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>TouchableOpacity with State</Text>
        <Text style={styles.subDescription}>
          A button that updates state when pressed.
        </Text>
        <View style={styles.counterContainer}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={incrementCount}
          >
            <Text style={styles.buttonText}>Increment</Text>
          </TouchableOpacity>
          <View style={styles.countDisplay}>
            <Text style={styles.countText}>Count: {count}</Text>
          </View>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Custom Styling</Text>
        <Text style={styles.subDescription}>
          TouchableOpacity components with different styles.
        </Text>
        <View style={styles.customButtonsContainer}>
          <TouchableOpacity
            style={[styles.customButton, styles.primaryButton]}
            onPress={() => handlePress("Primary button pressed")}
          >
            <Text style={styles.customButtonText}>Primary</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.customButton, styles.secondaryButton]}
            onPress={() => handlePress("Secondary button pressed")}
          >
            <Text style={[styles.customButtonText, styles.secondaryButtonText]}>
              Secondary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.customButton, styles.dangerButton]}
            onPress={() => handlePress("Danger button pressed")}
          >
            <Text style={styles.customButtonText}>Danger</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Active State Example</Text>
        <Text style={styles.subDescription}>
          Buttons that change appearance when active.
        </Text>
        <View style={styles.tabContainer}>
          {["Tab 1", "Tab 2", "Tab 3"].map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tabButton,
                activeButton === index && styles.activeTabButton,
              ]}
              onPress={() => selectButton(index)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeButton === index && styles.activeTabButtonText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>TouchableOpacity Properties</Text>
        <Text style={styles.subDescription}>
          Common TouchableOpacity properties include:
        </Text>
        <View style={styles.propertiesList}>
          <Text style={styles.propertyItem}>
            • onPress - Function called on press
          </Text>
          <Text style={styles.propertyItem}>
            • onLongPress - Function called on long press
          </Text>
          <Text style={styles.propertyItem}>
            • activeOpacity - Opacity when touched (0-1)
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
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterButton: {
    backgroundColor: "#2196f3",
    padding: 15,
    borderRadius: 4,
    flex: 1,
    alignItems: "center",
  },
  countDisplay: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 4,
    marginLeft: 10,
    flex: 1,
    alignItems: "center",
  },
  countText: {
    color: "#eee",
    fontSize: 16,
  },
  customButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  customButton: {
    padding: 12,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#2196f3",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#2196f3",
  },
  dangerButton: {
    backgroundColor: "#f44336",
  },
  customButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  secondaryButtonText: {
    color: "#2196f3",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#2196f3",
  },
  tabButtonText: {
    color: "#aaa",
  },
  activeTabButtonText: {
    color: "#fff",
    fontWeight: "500",
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

export default TouchableOpacityComponent;
