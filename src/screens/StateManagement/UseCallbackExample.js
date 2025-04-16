import React, { useState, useCallback, useEffect, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
} from "react-native";

// Memoized child component that only re-renders when its props change
const ExpensiveComponent = memo(({ onClick, label }) => {
  console.log(`Rendering ExpensiveComponent: ${label}`);

  // Simulate expensive rendering
  const startTime = Date.now();
  while (Date.now() - startTime < 10) {
    // Artificial delay to simulate expensive computation
  }

  return (
    <TouchableOpacity style={styles.expensiveButton} onPress={onClick}>
      <Text style={styles.expensiveButtonText}>{label}</Text>
    </TouchableOpacity>
  );
});

// Item component for the list example
const ListItem = memo(({ item, onToggle, onDelete }) => {
  console.log(`Rendering ListItem: ${item.id}`);

  return (
    <View style={styles.listItem}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => onToggle(item.id)}
      >
        <View
          style={[styles.checkbox, item.completed && styles.checkboxChecked]}
        >
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <Text
        style={[
          styles.listItemText,
          item.completed && styles.listItemCompleted,
        ]}
      >
        {item.text}
      </Text>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
      >
        <Text style={styles.deleteButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
});

const UseCallbackExample = () => {
  // Basic counter example
  const [count, setCount] = useState(0);
  const [otherState, setOtherState] = useState(false);

  // Without useCallback - this function is recreated on every render
  const incrementWithoutCallback = () => {
    setCount(count + 1);
  };

  // With useCallback - this function is only recreated when dependencies change
  const incrementWithCallback = useCallback(() => {
    setCount((prevCount) => prevCount + 1);
  }, []);

  // List example
  const [items, setItems] = useState([
    { id: 1, text: "Learn useCallback", completed: false },
    { id: 2, text: "Implement memoization", completed: false },
    { id: 3, text: "Optimize React components", completed: false },
  ]);
  const [newItemText, setNewItemText] = useState("");

  // Without useCallback - these functions would be recreated on every render
  const toggleItemWithoutCallback = (id) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const deleteItemWithoutCallback = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // With useCallback - these functions are only recreated when dependencies change
  const toggleItem = useCallback((id) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const deleteItem = useCallback((id) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }, []);

  const addItem = useCallback(() => {
    if (newItemText.trim()) {
      setItems((prevItems) => [
        ...prevItems,
        { id: Date.now(), text: newItemText.trim(), completed: false },
      ]);
      setNewItemText("");
    }
  }, [newItemText]);

  // Performance measurement
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount((prev) => prev + 1);
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>useCallback Hook</Text>
      <Text style={styles.description}>
        The useCallback hook returns a memoized version of the callback function
        that only changes if one of the dependencies has changed. This is useful
        when passing callbacks to optimized child components that rely on
        reference equality to prevent unnecessary renders.
      </Text>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic Example</Text>
        <Text style={styles.subDescription}>
          Compare a regular function vs. a memoized function with useCallback.
        </Text>

        <View style={styles.counterDisplay}>
          <Text style={styles.counterText}>{count}</Text>
          <Text style={styles.renderCountText}>
            Parent Renders: {renderCount}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <ExpensiveComponent
            onClick={incrementWithoutCallback}
            label="Without useCallback"
          />

          <ExpensiveComponent
            onClick={incrementWithCallback}
            label="With useCallback"
          />
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>
            Toggle other state to cause re-render:
          </Text>
          <Switch
            value={otherState}
            onValueChange={setOtherState}
            trackColor={{ false: "#444", true: "#2196f3" }}
            thumbColor={otherState ? "#fff" : "#f4f3f4"}
          />
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>What's happening?</Text>
          <Text style={styles.explanationText}>
            When you toggle the switch, the component re-renders. Without
            useCallback, the function is recreated on every render, causing the
            child component to re-render unnecessarily. With useCallback, the
            function reference stays the same, preventing unnecessary re-renders
            of the child component.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>List Example</Text>
        <Text style={styles.subDescription}>
          Using useCallback with a list of items to optimize performance.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newItemText}
            onChangeText={setNewItemText}
            placeholder="Add a new item"
            placeholderTextColor="#777"
          />
          <TouchableOpacity style={styles.addButton} onPress={addItem}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {items.map((item) => (
            <ListItem
              key={item.id}
              item={item}
              onToggle={toggleItem}
              onDelete={deleteItem}
            />
          ))}
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>Performance Benefits</Text>
          <Text style={styles.explanationText}>
            Each ListItem is memoized with React.memo, and the callback
            functions are memoized with useCallback. This prevents unnecessary
            re-renders when the list changes, as the function references remain
            stable.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>When to Use useCallback</Text>
        <Text style={styles.subDescription}>
          Guidelines for when useCallback is beneficial:
        </Text>

        <View style={styles.guidelinesList}>
          <Text style={styles.guidelineItem}>
            • When passing callbacks to optimized child components that rely on
            reference equality to prevent unnecessary renders
          </Text>
          <Text style={styles.guidelineItem}>
            • When the callback is used as a dependency in other hooks like
            useEffect
          </Text>
          <Text style={styles.guidelineItem}>
            • When the callback is expensive to create
          </Text>
          <Text style={styles.guidelineItem}>
            • When working with large lists or complex UI where performance is
            critical
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>useCallback vs. useMemo</Text>
        <Text style={styles.subDescription}>
          Understanding the difference between these hooks:
        </Text>

        <View style={styles.comparisonContainer}>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonTitle}>useCallback</Text>
            <Text style={styles.comparisonText}>
              Returns a memoized callback function that only changes if
              dependencies change.
            </Text>
            <Text style={styles.codeExample}>
              {`const memoizedCallback = useCallback(\n  () => doSomething(a, b),\n  [a, b]\n);`}
            </Text>
          </View>

          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonTitle}>useMemo</Text>
            <Text style={styles.comparisonText}>
              Returns a memoized value from a function that only recalculates if
              dependencies change.
            </Text>
            <Text style={styles.codeExample}>
              {`const memoizedValue = useMemo(\n  () => computeExpensiveValue(a, b),\n  [a, b]\n);`}
            </Text>
          </View>
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
  counterDisplay: {
    backgroundColor: "#333",
    padding: 20,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 16,
  },
  counterText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#eee",
    marginBottom: 8,
  },
  renderCountText: {
    fontSize: 14,
    color: "#aaa",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  expensiveButton: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  expensiveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  toggleLabel: {
    color: "#eee",
    fontSize: 14,
  },
  explanationBox: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3",
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#eee",
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: "#aaa",
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 4,
    color: "#eee",
    marginRight: 8,
  },
  addButton: {
    backgroundColor: "#4caf50",
    padding: 10,
    borderRadius: 4,
    width: 60,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  listContainer: {
    marginBottom: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  toggleButton: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#aaa",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#4caf50",
    borderColor: "#4caf50",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    color: "#eee",
  },
  listItemCompleted: {
    textDecorationLine: "line-through",
    color: "#aaa",
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    color: "#f44336",
    fontSize: 18,
    fontWeight: "bold",
  },
  guidelinesList: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
  },
  guidelineItem: {
    color: "#eee",
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  comparisonContainer: {
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
  },
  comparisonItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#eee",
    marginBottom: 8,
  },
  comparisonText: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 8,
    lineHeight: 20,
  },
  codeExample: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#4caf50",
    backgroundColor: "#1e1e1e",
    padding: 8,
    borderRadius: 4,
  },
});

export default UseCallbackExample;
