import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Button,
  Switch,
} from "react-native";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/common";

const UseStateExample = () => {
  // Basic counter example
  const [count, setCount] = useState(0);

  // Text input example
  const [text, setText] = useState("");

  // Object state example
  const [person, setPerson] = useState({
    name: "John Doe",
    age: 30,
    isEmployed: true,
  });

  // Array state example
  const [items, setItems] = useState(["Apple", "Banana", "Orange"]);
  const [newItem, setNewItem] = useState("");

  // Boolean state example
  const [isEnabled, setIsEnabled] = useState(false);

  // Object state update functions
  const updateName = (name) => {
    setPerson((prevPerson) => ({
      ...prevPerson,
      name,
    }));
  };

  const updateAge = (age) => {
    setPerson((prevPerson) => ({
      ...prevPerson,
      age: parseInt(age) || 0,
    }));
  };

  const toggleEmployment = () => {
    setPerson((prevPerson) => ({
      ...prevPerson,
      isEmployed: !prevPerson.isEmployed,
    }));
  };

  // Array state update functions
  const addItem = () => {
    if (newItem.trim()) {
      setItems((prevItems) => [...prevItems, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (index) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView>
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>useState Hook</Text>
          <Text style={styles.description}>
            useState is a React hook that allows you to manage state in
            functional components. It returns a state value and a function to
            update that value.
          </Text>
        </View>

        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Basic Counter Example</Text>
          <Text style={styles.countText}>Count: {count}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setCount(count + 1)}
            >
              <Text style={styles.buttonText}>Increase</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setCount(count - 1)}
            >
              <Text style={styles.buttonText}>Decrease</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setCount(0)}>
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Text Input Example</Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Enter text here"
            placeholderTextColor="#777"
          />
          <Text style={styles.inputValue}>Input value: {text}</Text>
          <Button title="Clear" onPress={() => setText("")} color="#eee" />
        </View>

        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Object State Example</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name:</Text>
            <TextInput
              style={styles.input}
              value={person.name}
              onChangeText={updateName}
              placeholder="Enter name"
              placeholderTextColor="#777"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Age:</Text>
            <TextInput
              style={styles.input}
              value={person.age.toString()}
              onChangeText={updateAge}
              keyboardType="numeric"
              placeholder="Enter age"
              placeholderTextColor="#777"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Employment:</Text>
            <Switch
              value={person.isEmployed}
              onValueChange={toggleEmployment}
            />
          </View>
          <Text style={styles.personInfo}>
            {person.name} is {person.age} years old and is currently{" "}
            {person.isEmployed ? "employed" : "unemployed"}.
          </Text>
        </View>

        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Array State Example</Text>
          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              value={newItem}
              onChangeText={setNewItem}
              placeholder="Enter new item"
              placeholderTextColor="#777"
            />
            <TouchableOpacity style={styles.addButton} onPress={addItem}>
              <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.itemList}>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.item}>{item}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeItem(index)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Boolean State Example</Text>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              Status: {isEnabled ? "ON" : "OFF"}
            </Text>
            <Switch value={isEnabled} onValueChange={setIsEnabled} />
          </View>
          {isEnabled && (
            <Text style={styles.conditionalText}>
              This text is only visible when the switch is ON.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  description: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  countText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.text,
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    padding: 10,
    color: colors.text,
    marginVertical: 5,
  },
  inputValue: {
    marginBottom: 16,
    fontSize: 16,
    color: colors.text,
  },
  formGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    width: 80,
    fontSize: 16,
    color: colors.text,
  },
  personInfo: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  itemList: {
    marginTop: 16,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#808080",
  },
  item: {
    fontSize: 16,
    color: colors.text,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  toggleText: {
    color: "#eee",
  },
  conditionalText: {
    padding: 16,
    backgroundColor: "#808080",
    borderRadius: 4,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#808080",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: "#808080",
    padding: 5,
    borderRadius: 3,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
  },
});

export default UseStateExample;
