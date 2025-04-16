import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
  Alert,
  Image,
} from "react-native";

const TouchableHighlightComponent = () => {
  const [count, setCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);

  const handlePress = (message) => {
    Alert.alert("Button Pressed", message);
  };

  const incrementCount = () => {
    setCount(count + 1);
  };

  const selectItem = (id) => {
    setSelectedItem(id);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic TouchableHighlight</Text>
        <Text style={styles.subDescription}>
          A simple button with a press handler and highlight effect.
        </Text>
        <TouchableHighlight
          style={styles.button}
          onPress={() => handlePress("You pressed the basic button!")}
          underlayColor="#0d47a1"
        >
          <Text style={styles.buttonText}>Press Me</Text>
        </TouchableHighlight>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>
          TouchableHighlight with Long Press
        </Text>
        <Text style={styles.subDescription}>
          A button that responds to both regular and long presses.
        </Text>
        <TouchableHighlight
          style={styles.button}
          onPress={() => handlePress("You pressed the button!")}
          onLongPress={() =>
            Alert.alert("Long Press", "You performed a long press!")
          }
          underlayColor="#0d47a1"
          delayLongPress={500}
        >
          <Text style={styles.buttonText}>Press or Long Press</Text>
        </TouchableHighlight>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>TouchableHighlight with State</Text>
        <Text style={styles.subDescription}>
          A button that updates state when pressed.
        </Text>
        <View style={styles.counterContainer}>
          <TouchableHighlight
            style={styles.counterButton}
            onPress={incrementCount}
            underlayColor="#0d47a1"
          >
            <Text style={styles.buttonText}>Increment</Text>
          </TouchableHighlight>
          <View style={styles.countDisplay}>
            <Text style={styles.countText}>Count: {count}</Text>
          </View>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Different Underlay Colors</Text>
        <Text style={styles.subDescription}>
          TouchableHighlight with different underlay colors.
        </Text>
        <View style={styles.underlayContainer}>
          <TouchableHighlight
            style={[styles.underlayButton, { backgroundColor: "#2196f3" }]}
            onPress={() => handlePress("Blue button pressed")}
            underlayColor="#0d47a1"
          >
            <Text style={styles.buttonText}>Blue → Dark Blue</Text>
          </TouchableHighlight>

          <TouchableHighlight
            style={[styles.underlayButton, { backgroundColor: "#4caf50" }]}
            onPress={() => handlePress("Green button pressed")}
            underlayColor="#2e7d32"
          >
            <Text style={styles.buttonText}>Green → Dark Green</Text>
          </TouchableHighlight>

          <TouchableHighlight
            style={[styles.underlayButton, { backgroundColor: "#f44336" }]}
            onPress={() => handlePress("Red button pressed")}
            underlayColor="#b71c1c"
          >
            <Text style={styles.buttonText}>Red → Dark Red</Text>
          </TouchableHighlight>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>List Selection Example</Text>
        <Text style={styles.subDescription}>
          Using TouchableHighlight for list item selection.
        </Text>
        <View style={styles.listContainer}>
          {[1, 2, 3, 4, 5].map((item) => (
            <TouchableHighlight
              key={item}
              style={[
                styles.listItem,
                selectedItem === item && styles.selectedItem,
              ]}
              onPress={() => selectItem(item)}
              underlayColor="#444"
            >
              <View style={styles.listItemContent}>
                <Text style={styles.listItemText}>Item {item}</Text>
                {selectedItem === item && (
                  <Text style={styles.selectedText}>✓</Text>
                )}
              </View>
            </TouchableHighlight>
          ))}
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>TouchableHighlight with Image</Text>
        <Text style={styles.subDescription}>
          Using TouchableHighlight with an image.
        </Text>
        <TouchableHighlight
          style={styles.imageContainer}
          onPress={() => handlePress("Image pressed")}
          underlayColor="#333"
        >
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.imageText}>React Native Logo</Text>
          </View>
        </TouchableHighlight>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>TouchableHighlight Properties</Text>
        <Text style={styles.subDescription}>
          Common TouchableHighlight properties include:
        </Text>
        <View style={styles.propertiesList}>
          <Text style={styles.propertyItem}>
            • onPress - Function called on press
          </Text>
          <Text style={styles.propertyItem}>
            • onLongPress - Function called on long press
          </Text>
          <Text style={styles.propertyItem}>
            • underlayColor - Color of the underlay that shows when pressed
          </Text>
          <Text style={styles.propertyItem}>
            • activeOpacity - Opacity of the wrapped view when button is pressed
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
  underlayContainer: {
    flexDirection: "column",
    gap: 10,
  },
  underlayButton: {
    padding: 15,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 10,
  },
  listContainer: {
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  selectedItem: {
    backgroundColor: "#333",
  },
  listItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listItemText: {
    color: "#eee",
    fontSize: 16,
  },
  selectedText: {
    color: "#4caf50",
    fontSize: 18,
    fontWeight: "bold",
  },
  imageContainer: {
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
  },
  imageWrapper: {
    alignItems: "center",
    padding: 20,
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  imageText: {
    color: "#eee",
    fontSize: 16,
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

export default TouchableHighlightComponent;
