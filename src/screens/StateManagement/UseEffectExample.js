import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  TextInput,
  ActivityIndicator,
} from "react-native";

const UseEffectExample = () => {
  // Basic counter example
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");

  // Timer example
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Data loading simulation example
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Input validation example
  const [username, setUsername] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  // useEffect with no dependency array - runs once on mount
  useEffect(() => {
    console.log("Component has mounted");

    // Cleanup function to run on unmount
    return () => {
      console.log("Component has unmounted");
    };
  }, []);

  // useEffect that runs when count changes
  useEffect(() => {
    setMessage(`Count has changed to ${count}`);

    // Special message when count is a multiple of 10
    if (count !== 0 && count % 10 === 0) {
      setMessage(`Congratulations! You've reached ${count}!`);
    }
  }, [count]);

  // useEffect for timer example
  useEffect(() => {
    let interval = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    }

    // Clean up interval in cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);

  // Data loading simulation
  const loadData = () => {
    setIsLoading(true);
    setError(null);
    setData(null);

    // Simulate data loading (returns data or error after 2 seconds)
    setTimeout(() => {
      const random = Math.random();

      if (random > 0.3) {
        // Success case
        setData({
          id: Math.floor(Math.random() * 1000),
          name: "Sample Data",
          value: Math.floor(Math.random() * 100),
        });
      } else {
        // Error case
        setError("An error occurred while loading data.");
      }

      setIsLoading(false);
    }, 2000);
  };

  // useEffect for input validation
  useEffect(() => {
    // Username validation logic
    if (username.length === 0) {
      setIsValid(false);
      setValidationMessage("Please enter a username.");
    } else if (username.length < 4) {
      setIsValid(false);
      setValidationMessage("Username must be at least 4 characters long.");
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setIsValid(false);
      setValidationMessage(
        "Username can only contain letters, numbers, and underscores."
      );
    } else {
      setIsValid(true);
      setValidationMessage("Username is valid.");
    }
  }, [username]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>useEffect Hook</Text>
      <Text style={styles.description}>
        useEffect is a React hook that lets you perform side effects in
        functional components. It's used for data fetching, subscriptions,
        manual DOM manipulations, and more.
      </Text>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic Counter Example</Text>
        <Text style={styles.countText}>Count: {count}</Text>
        <Text style={styles.messageText}>{message}</Text>
        <View style={styles.buttonRow}>
          <Button
            title="Increase"
            onPress={() => setCount(count + 1)}
            color="#2196f3"
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="Decrease"
            onPress={() => setCount(count - 1)}
            color="#2196f3"
          />
          <View style={styles.buttonSpacer} />
          <Button title="Reset" onPress={() => setCount(0)} color="#2196f3" />
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Timer Example</Text>
        <Text style={styles.timerText}>{seconds} seconds</Text>
        <View style={styles.buttonRow}>
          <Button
            title={isRunning ? "Pause" : "Start"}
            onPress={() => setIsRunning(!isRunning)}
            color="#2196f3"
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="Reset"
            onPress={() => {
              setIsRunning(false);
              setSeconds(0);
            }}
            color="#2196f3"
          />
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Data Loading Simulation</Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196f3" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        ) : data ? (
          <View style={styles.dataContainer}>
            <Text style={styles.dataText}>ID: {data.id}</Text>
            <Text style={styles.dataText}>Name: {data.name}</Text>
            <Text style={styles.dataText}>Value: {data.value}</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Text style={styles.infoText}>Press the button to load data.</Text>
        )}
        <Button
          title="Load Data"
          onPress={loadData}
          disabled={isLoading}
          color="#2196f3"
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Input Validation Example</Text>
        <TextInput
          style={[
            styles.input,
            isValid
              ? styles.validInput
              : username.length > 0
              ? styles.invalidInput
              : {},
          ]}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
          placeholderTextColor="#777"
        />
        <Text
          style={[
            styles.validationMessage,
            isValid ? styles.validMessage : styles.invalidMessage,
          ]}
        >
          {validationMessage}
        </Text>
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
    marginBottom: 16,
    color: "#eee",
  },
  countText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#eee",
  },
  messageText: {
    textAlign: "center",
    marginBottom: 16,
    color: "#aaa",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonSpacer: {
    width: 8,
  },
  timerText: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#eee",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#eee",
  },
  dataContainer: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
  },
  dataText: {
    fontSize: 16,
    marginBottom: 8,
    color: "#eee",
  },
  errorText: {
    color: "#f44336",
    marginBottom: 16,
    fontSize: 16,
  },
  infoText: {
    color: "#aaa",
    marginBottom: 16,
    fontSize: 16,
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
  validInput: {
    borderColor: "green",
  },
  invalidInput: {
    borderColor: "#f44336",
  },
  validationMessage: {
    marginBottom: 16,
    fontSize: 14,
  },
  validMessage: {
    color: "green",
  },
  invalidMessage: {
    color: "#f44336",
  },
});

export default UseEffectExample;
