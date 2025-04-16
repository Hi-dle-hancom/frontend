import React, { useState } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity } from "react-native";
import { Provider, useSelector, useDispatch } from "react-redux";
import { createStore } from "redux";

// Action Types
const INCREMENT = "INCREMENT";
const DECREMENT = "DECREMENT";
const RESET = "RESET";
const SET_COLOR = "SET_COLOR";

// Action Functions
const increment = () => ({ type: INCREMENT });
const decrement = () => ({ type: DECREMENT });
const reset = () => ({ type: RESET });
const setColor = (color) => ({ type: SET_COLOR, payload: color });

// 초기 상태
const initialState = {
  counter: 0,
  color: "#eee",
};

// Reducer
const counterReducer = (state = initialState, action) => {
  switch (action.type) {
    case INCREMENT:
      return { ...state, counter: state.counter + 1 };
    case DECREMENT:
      return { ...state, counter: state.counter - 1 };
    case RESET:
      return { ...state, counter: 0 };
    case SET_COLOR:
      return { ...state, color: action.payload };
    default:
      return state;
  }
};

// Store Creation
const store = createStore(counterReducer);

// Counter Component
const CounterDisplay = () => {
  const { counter, color } = useSelector((state) => state);

  return (
    <View style={styles.counterDisplay}>
      <Text style={[styles.counterValue, { color }]}>{counter}</Text>
    </View>
  );
};

// Counter Controls button Component
const CounterControls = () => {
  const dispatch = useDispatch();

  return (
    <View style={styles.controlsContainer}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => dispatch(increment())}
      >
        <Text style={styles.buttonText}>Increase</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => dispatch(decrement())}
      >
        <Text style={styles.buttonText}>Decrease</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => dispatch(reset())}>
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
};

// Color Selector Component
const ColorSelector = () => {
  const dispatch = useDispatch();
  const colors = ["#007AFF", "#FF3B30", "#4CD964", "#FF9500", "#5856D6"];

  return (
    <View style={styles.colorContainer}>
      <Text style={styles.colorTitle}>Change Counter Color:</Text>
      <View style={styles.colorOptions}>
        {colors.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.colorOption, { backgroundColor: color }]}
            onPress={() => dispatch(setColor(color))}
          />
        ))}
      </View>
    </View>
  );
};

// Main Component
const ReduxExample = () => {
  return (
    <Provider store={store}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.description}>
            Redux is a predictable state container for managing centralized
            state. This example demonstrates the basic concepts of actions,
            reducers, and the store with React Redux's Provider, useSelector,
            and useDispatch hooks.
          </Text>

          <View style={styles.counterContainer}>
            <Text style={styles.sectionTitle}>Counter:</Text>
            <CounterDisplay />
            <CounterControls />
          </View>

          <ColorSelector />
        </View>

        <View style={styles.card}>
          <Text style={styles.codeTitle}>Code Structure:</Text>
          <Text style={styles.codeDescription}>
            1. Define actions (INCREMENT, DECREMENT, RESET, SET_COLOR){"\n"}
            2. Create reducer function (state change logic){"\n"}
            3. Create store (createStore){"\n"}
            4. Wrap app with Provider{"\n"}
            5. Read state with useSelector{"\n"}
            6. Dispatch actions with useDispatch
          </Text>
        </View>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#101010",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#eee",
  },
  card: {
    backgroundColor: "#242423",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  description: {
    fontSize: 14,
    color: "#eee",
    marginBottom: 20,
    lineHeight: 20,
  },
  counterContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#eee",
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
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  colorContainer: {
    marginTop: 10,
  },
  colorTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#eee",
  },
  colorOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  codeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#eee",
  },
  codeDescription: {
    fontSize: 14,
    color: "#eee",
    lineHeight: 22,
  },
});

export default ReduxExample;
