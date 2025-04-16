import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableHighlight,
  Pressable,
  Alert,
} from "react-native";

const ButtonComponent = () => {
  const [count, setCount] = useState(0);

  const handlePress = () => {
    setCount(count + 1);
    Alert.alert(
      "Button Pressed",
      `Button has been pressed ${count + 1} times.`
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic Button Component</Text>
        <Button title="Default Button" onPress={handlePress} />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Colored Button</Text>
        <Button title="Custom Button" onPress={handlePress} color="#2196f3" />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Disabled Button</Text>
        <Button title="Disabled Button" onPress={handlePress} disabled />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Custom Button Style</Text>
        <TouchableOpacity style={styles.customButton} onPress={handlePress}>
          <Text style={styles.customButtonText}>Custom Style Button</Text>
        </TouchableOpacity>
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
  touchableButton: {
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
  customButton: {
    backgroundColor: "#4caf50",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  customButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

export default ButtonComponent;
