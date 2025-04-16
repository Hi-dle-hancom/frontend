import React, { useReducer, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
} from "react-native";

// Simple counter reducer
const counterReducer = (state, action) => {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + 1 };
    case "DECREMENT":
      return { ...state, count: state.count - 1 };
    case "RESET":
      return { ...state, count: 0 };
    case "SET":
      return { ...state, count: action.payload };
    default:
      return state;
  }
};

// Todo list reducer
const todoReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TODO":
      return {
        ...state,
        todos: [
          ...state.todos,
          { id: Date.now(), text: action.payload, completed: false },
        ],
      };
    case "TOGGLE_TODO":
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        ),
      };
    case "DELETE_TODO":
      return {
        ...state,
        todos: state.todos.filter((todo) => todo.id !== action.payload),
      };
    case "CLEAR_COMPLETED":
      return {
        ...state,
        todos: state.todos.filter((todo) => !todo.completed),
      };
    default:
      return state;
  }
};

// Form reducer
const formReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        [action.field]: action.payload,
      };
    case "RESET_FORM":
      return {
        username: "",
        email: "",
        password: "",
        agreeToTerms: false,
      };
    case "VALIDATE":
      const errors = {};

      if (!state.username) errors.username = "Username is required";
      if (!state.email) errors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(state.email))
        errors.email = "Email is invalid";
      if (!state.password) errors.password = "Password is required";
      else if (state.password.length < 6)
        errors.password = "Password must be at least 6 characters";
      if (!state.agreeToTerms) errors.agreeToTerms = "You must agree to terms";

      return {
        ...state,
        errors,
      };
    default:
      return state;
  }
};

const UseReducerExample = () => {
  // Counter example with useReducer
  const [counterState, counterDispatch] = useReducer(counterReducer, {
    count: 0,
  });
  const [inputValue, setInputValue] = useState("");

  // Todo list example with useReducer
  const [todoState, todoDispatch] = useReducer(todoReducer, { todos: [] });
  const [todoText, setTodoText] = useState("");

  // Form example with useReducer
  const [formState, formDispatch] = useReducer(formReducer, {
    username: "",
    email: "",
    password: "",
    agreeToTerms: false,
    errors: {},
  });

  const handleSetCount = () => {
    const num = parseInt(inputValue);
    if (!isNaN(num)) {
      counterDispatch({ type: "SET", payload: num });
      setInputValue("");
    }
  };

  const handleAddTodo = () => {
    if (todoText.trim()) {
      todoDispatch({ type: "ADD_TODO", payload: todoText.trim() });
      setTodoText("");
    }
  };

  const validateForm = () => {
    formDispatch({ type: "VALIDATE" });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>useReducer Hook</Text>
      <Text style={styles.description}>
        The useReducer hook is an alternative to useState for complex state
        logic. It's similar to how Redux works, using actions and reducers to
        update state.
      </Text>

      {/* Counter Example */}
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Counter Example</Text>
        <Text style={styles.subDescription}>
          A simple counter implemented with useReducer.
        </Text>

        <View style={styles.counterDisplay}>
          <Text style={styles.counterText}>{counterState.count}</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => counterDispatch({ type: "DECREMENT" })}
          >
            <Text style={styles.buttonText}>Decrement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => counterDispatch({ type: "RESET" })}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => counterDispatch({ type: "INCREMENT" })}
          >
            <Text style={styles.buttonText}>Increment</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Enter a number"
            placeholderTextColor="#777"
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.setButton} onPress={handleSetCount}>
            <Text style={styles.buttonText}>Set</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Todo List Example */}
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Todo List Example</Text>
        <Text style={styles.subDescription}>
          A todo list implemented with useReducer.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.todoInput}
            value={todoText}
            onChangeText={setTodoText}
            placeholder="Add a new todo"
            placeholderTextColor="#777"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddTodo}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.todoList}>
          {todoState.todos.length === 0 ? (
            <Text style={styles.emptyText}>No todos yet. Add one above!</Text>
          ) : (
            todoState.todos.map((todo) => (
              <View key={todo.id} style={styles.todoItem}>
                <TouchableOpacity
                  style={styles.todoCheckbox}
                  onPress={() =>
                    todoDispatch({ type: "TOGGLE_TODO", payload: todo.id })
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      todo.completed && styles.checkboxChecked,
                    ]}
                  >
                    {todo.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>

                <Text
                  style={[
                    styles.todoText,
                    todo.completed && styles.todoCompleted,
                  ]}
                >
                  {todo.text}
                </Text>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() =>
                    todoDispatch({ type: "DELETE_TODO", payload: todo.id })
                  }
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {todoState.todos.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => todoDispatch({ type: "CLEAR_COMPLETED" })}
          >
            <Text style={styles.buttonText}>Clear Completed</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Form Example */}
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Form Validation Example</Text>
        <Text style={styles.subDescription}>
          A form with validation implemented using useReducer.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.formInput}
            value={formState.username}
            onChangeText={(text) =>
              formDispatch({
                type: "UPDATE_FIELD",
                field: "username",
                payload: text,
              })
            }
            placeholder="Enter username"
            placeholderTextColor="#777"
          />
          {formState.errors?.username && (
            <Text style={styles.errorText}>{formState.errors.username}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.formInput}
            value={formState.email}
            onChangeText={(text) =>
              formDispatch({
                type: "UPDATE_FIELD",
                field: "email",
                payload: text,
              })
            }
            placeholder="Enter email"
            placeholderTextColor="#777"
            keyboardType="email-address"
          />
          {formState.errors?.email && (
            <Text style={styles.errorText}>{formState.errors.email}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.formInput}
            value={formState.password}
            onChangeText={(text) =>
              formDispatch({
                type: "UPDATE_FIELD",
                field: "password",
                payload: text,
              })
            }
            placeholder="Enter password"
            placeholderTextColor="#777"
            secureTextEntry
          />
          {formState.errors?.password && (
            <Text style={styles.errorText}>{formState.errors.password}</Text>
          )}
        </View>

        <View style={styles.switchContainer}>
          <Switch
            value={formState.agreeToTerms}
            onValueChange={(value) =>
              formDispatch({
                type: "UPDATE_FIELD",
                field: "agreeToTerms",
                payload: value,
              })
            }
            trackColor={{ false: "#444", true: "#2196f3" }}
            thumbColor={formState.agreeToTerms ? "#fff" : "#f4f3f4"}
          />
          <Text style={styles.switchLabel}>
            I agree to the terms and conditions
          </Text>
        </View>
        {formState.errors?.agreeToTerms && (
          <Text style={styles.errorText}>{formState.errors.agreeToTerms}</Text>
        )}

        <View style={styles.formButtonsContainer}>
          <TouchableOpacity
            style={[styles.formButton, styles.resetButton]}
            onPress={() => formDispatch({ type: "RESET_FORM" })}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.formButton, styles.submitButton]}
            onPress={validateForm}
          >
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* useReducer vs useState */}
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>useReducer vs useState</Text>
        <Text style={styles.subDescription}>
          When to use useReducer instead of useState:
        </Text>

        <View style={styles.comparisonList}>
          <Text style={styles.comparisonItem}>
            • When state logic is complex and involves multiple sub-values
          </Text>
          <Text style={styles.comparisonItem}>
            • When the next state depends on the previous state
          </Text>
          <Text style={styles.comparisonItem}>
            • When state updates are frequent or complex
          </Text>
          <Text style={styles.comparisonItem}>
            • When you want to improve performance by avoiding multiple setState
            calls
          </Text>
          <Text style={styles.comparisonItem}>
            • When you need more predictable state transitions
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
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2196f3",
    padding: 10,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 4,
    color: "#eee",
    marginRight: 8,
  },
  setButton: {
    backgroundColor: "#2196f3",
    padding: 10,
    borderRadius: 4,
    width: 60,
    alignItems: "center",
  },
  todoInput: {
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
  todoList: {
    marginTop: 16,
    marginBottom: 16,
  },
  emptyText: {
    color: "#aaa",
    textAlign: "center",
    fontStyle: "italic",
    padding: 16,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  todoCheckbox: {
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
  todoText: {
    flex: 1,
    fontSize: 16,
    color: "#eee",
  },
  todoCompleted: {
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
  clearButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#eee",
  },
  formInput: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    color: "#eee",
    borderWidth: 1,
    borderColor: "#444",
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  switchLabel: {
    marginLeft: 8,
    color: "#eee",
    fontSize: 14,
  },
  formButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  formButton: {
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  resetButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#aaa",
  },
  resetButtonText: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#2196f3",
  },
  comparisonList: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 4,
  },
  comparisonItem: {
    color: "#eee",
    fontSize: 14,
    marginBottom: 8,
  },
});

export default UseReducerExample;
