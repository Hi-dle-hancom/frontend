import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
} from "react-native";

// Helper function to check if a number is prime (intentionally inefficient for demo)
const isPrime = (num) => {
  console.log(`Calculating if ${num} is prime...`);
  if (num <= 1) return false;
  if (num <= 3) return true;

  if (num % 2 === 0 || num % 3 === 0) return false;

  let i = 5;
  while (i * i <= num) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
    i += 6;
  }

  // Artificial delay to simulate expensive computation
  const startTime = Date.now();
  while (Date.now() - startTime < 100) {
    // Busy wait to simulate expensive calculation
  }

  return true;
};

// Helper function to calculate Fibonacci (intentionally inefficient for demo)
const fibonacci = (n) => {
  console.log(`Calculating fibonacci(${n})...`);
  if (n <= 1) return n;

  // Artificial delay to simulate expensive computation
  const startTime = Date.now();
  while (Date.now() - startTime < 100) {
    // Busy wait to simulate expensive calculation
  }

  return fibonacci(n - 1) + fibonacci(n - 2);
};

const UseMemoExample = () => {
  // Basic example state
  const [number, setNumber] = useState(10);
  const [otherState, setOtherState] = useState(false);

  // Without useMemo - this calculation runs on every render
  const isPrimeWithoutMemo = () => {
    return isPrime(number);
  };

  // With useMemo - this calculation only runs when dependencies change
  const isPrimeWithMemo = useMemo(() => {
    return isPrime(number);
  }, [number]);

  // Fibonacci example
  const [fibNumber, setFibNumber] = useState(10);
  const [fibInput, setFibInput] = useState("10");

  // Calculate Fibonacci with useMemo
  const fibResult = useMemo(() => {
    if (fibNumber > 30) return "Number too large (>30)";
    return fibonacci(fibNumber);
  }, [fibNumber]);

  // List filtering example
  const [filterText, setFilterText] = useState("");
  const [sortByPrice, setSortByPrice] = useState(false);

  // Sample product data
  const products = [
    { id: 1, name: "Laptop", category: "Electronics", price: 999 },
    { id: 2, name: "Smartphone", category: "Electronics", price: 699 },
    { id: 3, name: "Headphones", category: "Audio", price: 199 },
    { id: 4, name: "Monitor", category: "Electronics", price: 299 },
    { id: 5, name: "Keyboard", category: "Accessories", price: 89 },
    { id: 6, name: "Mouse", category: "Accessories", price: 49 },
    { id: 7, name: "Speakers", category: "Audio", price: 149 },
    { id: 8, name: "Tablet", category: "Electronics", price: 399 },
    { id: 9, name: "Webcam", category: "Accessories", price: 79 },
    { id: 10, name: "Microphone", category: "Audio", price: 129 },
  ];

  // Filter and sort products with useMemo
  const filteredAndSortedProducts = useMemo(() => {
    console.log("Filtering and sorting products...");

    // Artificial delay to simulate expensive computation
    const startTime = Date.now();
    while (Date.now() - startTime < 50) {
      // Busy wait to simulate expensive calculation
    }

    let result = products;

    // Filter by name or category
    if (filterText) {
      const lowerCaseFilter = filterText.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerCaseFilter) ||
          product.category.toLowerCase().includes(lowerCaseFilter)
      );
    }

    // Sort by price if enabled
    if (sortByPrice) {
      result = [...result].sort((a, b) => a.price - b.price);
    }

    return result;
  }, [filterText, sortByPrice]);

  // Performance measurement
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount((prev) => prev + 1);
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>useMemo Hook</Text>
      <Text style={styles.description}>
        The useMemo hook returns a memoized value that only recalculates when
        one of its dependencies changes. This is useful for expensive
        calculations that should not be recomputed on every render.
      </Text>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic Example</Text>
        <Text style={styles.subDescription}>
          Compare a regular calculation vs. a memoized calculation with useMemo.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter a number:</Text>
          <TextInput
            style={styles.input}
            value={number.toString()}
            onChangeText={(text) => {
              const num = parseInt(text);
              if (!isNaN(num)) setNumber(num);
              else if (text === "") setNumber(0);
            }}
            keyboardType="numeric"
            placeholder="Enter number"
            placeholderTextColor="#777"
          />
        </View>

        <View style={styles.resultContainer}>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Without useMemo:</Text>
            <Text style={styles.resultValue}>
              {number} is {isPrimeWithoutMemo() ? "prime" : "not prime"}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>With useMemo:</Text>
            <Text style={styles.resultValue}>
              {number} is {isPrimeWithMemo ? "prime" : "not prime"}
            </Text>
          </View>
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

        <Text style={styles.renderCountText}>
          Component Renders: {renderCount}
        </Text>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>What's happening?</Text>
          <Text style={styles.explanationText}>
            When you toggle the switch, the component re-renders. Without
            useMemo, the isPrime calculation runs on every render, even when the
            number hasn't changed. With useMemo, the calculation only runs when
            the number changes, improving performance.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Fibonacci Example</Text>
        <Text style={styles.subDescription}>
          Calculate Fibonacci numbers efficiently with useMemo.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter a number (max 30):</Text>
          <View style={styles.fibInputRow}>
            <TextInput
              style={styles.input}
              value={fibInput}
              onChangeText={setFibInput}
              keyboardType="numeric"
              placeholder="Enter number"
              placeholderTextColor="#777"
            />
            <TouchableOpacity
              style={styles.calculateButton}
              onPress={() => {
                const num = parseInt(fibInput);
                if (!isNaN(num)) setFibNumber(num);
              }}
            >
              <Text style={styles.buttonText}>Calculate</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fibResult}>
          <Text style={styles.fibResultLabel}>Fibonacci({fibNumber}):</Text>
          <Text style={styles.fibResultValue}>{fibResult}</Text>
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>Performance Benefit</Text>
          <Text style={styles.explanationText}>
            The Fibonacci calculation is expensive, especially for larger
            numbers. useMemo ensures we only recalculate when the input number
            changes, not on every render.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>List Filtering Example</Text>
        <Text style={styles.subDescription}>
          Filter and sort a list of products efficiently with useMemo.
        </Text>

        <View style={styles.filterContainer}>
          <TextInput
            style={styles.filterInput}
            value={filterText}
            onChangeText={setFilterText}
            placeholder="Filter by name or category"
            placeholderTextColor="#777"
          />

          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by price:</Text>
            <Switch
              value={sortByPrice}
              onValueChange={setSortByPrice}
              trackColor={{ false: "#444", true: "#2196f3" }}
              thumbColor={sortByPrice ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>

        <View style={styles.productList}>
          {filteredAndSortedProducts.length === 0 ? (
            <Text style={styles.noResultsText}>No products found</Text>
          ) : (
            filteredAndSortedProducts.map((product) => (
              <View key={product.id} style={styles.productItem}>
                <View>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category}</Text>
                </View>
                <Text style={styles.productPrice}>${product.price}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>
            Optimizing List Operations
          </Text>
          <Text style={styles.explanationText}>
            Filtering and sorting operations can be expensive, especially for
            large lists. useMemo ensures these operations only run when the
            filter text or sort preference changes, not on every render.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>When to Use useMemo</Text>
        <Text style={styles.subDescription}>
          Guidelines for when useMemo is beneficial:
        </Text>

        <View style={styles.guidelinesList}>
          <Text style={styles.guidelineItem}>
            • When you have computationally expensive calculations
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to prevent unnecessary re-renders of child
            components
          </Text>
          <Text style={styles.guidelineItem}>
            • When the calculated value is used as a dependency in other hooks
          </Text>
          <Text style={styles.guidelineItem}>
            • When filtering or transforming large arrays or objects
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to maintain referential equality for objects or
            arrays
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Performance Considerations</Text>
          <Text style={styles.warningText}>
            useMemo itself has a cost. For simple calculations, the overhead of
            useMemo might be greater than just recalculating the value. Use it
            when the computation is genuinely expensive or when referential
            equality matters.
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: "#eee",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    color: "#eee",
    borderWidth: 1,
    borderColor: "#444",
  },
  resultContainer: {
    backgroundColor: "#333",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  resultItem: {
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    color: "#eee",
    fontWeight: "500",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  toggleLabel: {
    color: "#eee",
    fontSize: 14,
  },
  renderCountText: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
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
  fibInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  calculateButton: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 4,
    marginLeft: 8,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  fibResult: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: "center",
  },
  fibResultLabel: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 8,
  },
  fibResultValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#eee",
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterInput: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    color: "#eee",
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 12,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
  },
  sortLabel: {
    color: "#eee",
    fontSize: 14,
  },
  productList: {
    marginBottom: 16,
  },
  noResultsText: {
    color: "#aaa",
    textAlign: "center",
    fontStyle: "italic",
    padding: 16,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#eee",
  },
  productCategory: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4caf50",
  },
  guidelinesList: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  guidelineItem: {
    color: "#eee",
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#eee",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: "#aaa",
    lineHeight: 20,
  },
});

export default UseMemoExample;
