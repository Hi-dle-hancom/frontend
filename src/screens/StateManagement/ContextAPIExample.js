import React, { createContext, useContext, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// Theme Context 생성
const ThemeContext = createContext();
const ThemeUpdateContext = createContext();

// Theme Provider Component
const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  const theme = {
    backgroundColor: darkMode ? "#101010" : "#FFFFFF",
    textColor: darkMode ? "#FFFFFF" : "#333333",
    buttonColor: darkMode ? "#444444" : "#EFEFEF",
    buttonTextColor: darkMode ? "#FFFFFF" : "#333333",
    borderColor: darkMode ? "#555555" : "#DDDDDD",
  };

  return (
    <ThemeContext.Provider value={theme}>
      <ThemeUpdateContext.Provider value={toggleTheme}>
        {children}
      </ThemeUpdateContext.Provider>
    </ThemeContext.Provider>
  );
};

// Custom Hook
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

const useThemeUpdate = () => {
  const context = useContext(ThemeUpdateContext);
  if (context === undefined) {
    throw new Error("useThemeUpdate must be used within a ThemeProvider");
  }
  return context;
};

// ------------------------------------------------------------

// Counter Context
const CounterContext = createContext();
const CounterUpdateContext = createContext();

// Counter Provider Component
const CounterProvider = ({ children }) => {
  const [count, setCount] = useState(0);

  const increment = () => setCount((prevCount) => prevCount + 1);
  const decrement = () => setCount((prevCount) => prevCount - 1);
  const reset = () => setCount(0);

  const counterValue = { count };
  const counterUpdates = { increment, decrement, reset };

  return (
    <CounterContext.Provider value={counterValue}>
      <CounterUpdateContext.Provider value={counterUpdates}>
        {children}
      </CounterUpdateContext.Provider>
    </CounterContext.Provider>
  );
};

// Counter Custom Hook
const useCounter = () => {
  const context = useContext(CounterContext);
  if (context === undefined) {
    throw new Error("useCounter must be used within a CounterProvider");
  }
  return context;
};

const useCounterUpdate = () => {
  const context = useContext(CounterUpdateContext);
  if (context === undefined) {
    throw new Error("useCounterUpdate must be used within a CounterProvider");
  }
  return context;
};

// Theme Toggle Button Component
const ThemeToggleButton = () => {
  const theme = useTheme();
  const toggleTheme = useThemeUpdate();

  return (
    <TouchableOpacity
      style={[
        styles.themeButton,
        { backgroundColor: theme.buttonColor, borderColor: theme.borderColor },
      ]}
      onPress={toggleTheme}
    >
      <Text style={[styles.themeButtonText, { color: theme.textColor }]}>
        Change Theme
      </Text>
    </TouchableOpacity>
  );
};

// Counter Display Component
const CounterDisplay = () => {
  const { count } = useCounter();
  const theme = useTheme();

  return (
    <View style={styles.counterDisplay}>
      <Text style={[styles.counterValue, { color: theme.textColor }]}>
        {count}
      </Text>
    </View>
  );
};

// Counter Controls Component
const CounterControls = () => {
  const { increment, decrement, reset } = useCounterUpdate();
  const theme = useTheme();

  return (
    <View style={styles.controlsContainer}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme.buttonColor,
            borderColor: theme.borderColor,
          },
        ]}
        onPress={increment}
      >
        <Text style={[styles.buttonText, { color: theme.textColor }]}>
          Increase
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme.buttonColor,
            borderColor: theme.borderColor,
          },
        ]}
        onPress={decrement}
      >
        <Text style={[styles.buttonText, { color: theme.textColor }]}>
          Decrease
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme.buttonColor,
            borderColor: theme.borderColor,
          },
        ]}
        onPress={reset}
      >
        <Text style={[styles.buttonText, { color: theme.textColor }]}>
          Reset
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Counter Component
const Counter = () => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.counterContainer,
        {
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
        },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
        Counter:
      </Text>
      <CounterDisplay />
      <CounterControls />
    </View>
  );
};

// Main Component
const ContextAPIExample = () => {
  return (
    <ThemeProvider>
      <CounterProvider>
        <ContextAPIWrapper />
      </CounterProvider>
    </ThemeProvider>
  );
};

// 컨텐츠 래퍼 컴포넌트
const ContextAPIWrapper = () => {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundColor,
            borderColor: theme.borderColor,
          },
        ]}
      >
        <Text style={[styles.description, { color: theme.textColor }]}>
          Context API is a built-in React feature that provides data to the
          entire component tree. This example demonstrates how to manage theme
          and counter state using multiple contexts and simplify context
          consumption through custom hooks.
        </Text>

        <ThemeToggleButton />
        <Counter />
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundColor,
            borderColor: theme.borderColor,
          },
        ]}
      >
        <Text style={[styles.codeTitle, { color: theme.textColor }]}>
          Code Structure:
        </Text>
        <Text style={[styles.codeDescription, { color: theme.textColor }]}>
          1. createContext() for context creation{"\n"}
          2. Implement context Provider component{"\n"}
          3. Simplify context consumption with custom hooks{"\n"}
          4. Manage multiple states with multiple Providers{"\n"}
          5. Access state with useContext() in components{"\n"}
          6. Optimize performance with state and update function separation
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  themeButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
  },
  themeButtonText: {
    fontWeight: "600",
  },
  counterContainer: {
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  counterDisplay: {
    alignItems: "center",
    marginBottom: 15,
  },
  counterValue: {
    fontSize: 48,
    fontWeight: "bold",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
  },
  buttonText: {
    fontWeight: "600",
  },
  codeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  codeDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default ContextAPIExample;
