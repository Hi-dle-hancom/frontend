import React, { useState, useReducer, useContext, createContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/common";

// Context API 예제를 위한 Context 생성
const ThemeContext = createContext();

// useReducer 예제를 위한 reducer 함수
const counterReducer = (state, action) => {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    case "reset":
      return { count: 0 };
    default:
      return state;
  }
};

// Context Provider 컴포넌트
const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Context를 사용하는 컴포넌트
const ThemedComponent = () => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <View
      style={[
        styles.themedComponent,
        { backgroundColor: isDarkMode ? "#101010" : "#eee" },
      ]}
    >
      <Text
        style={{
          color: isDarkMode ? "#eee" : "#101010",
          marginBottom: 10,
        }}
      >
        Current Theme: {isDarkMode ? "Dark" : "Light"}
      </Text>
      <TouchableOpacity
        style={[commonStyles.button, { backgroundColor: "#242423" }]}
        onPress={toggleTheme}
      >
        <Text style={commonStyles.buttonText}>Change Theme</Text>
      </TouchableOpacity>
    </View>
  );
};

// useState 예제 컴포넌트
const UseStateExample = () => {
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);

  const addItem = () => {
    if (text.trim()) {
      setItems([...items, text]);
      setText("");
    }
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  return (
    <View>
      <Text style={commonStyles.sectionTitle}>useState</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[commonStyles.input, { flex: 1 }]}
          value={text}
          onChangeText={setText}
          placeholder="Add Item"
          placeholderTextColor="#eee"
        />
        <TouchableOpacity
          style={[
            commonStyles.button,
            styles.addButton,
            { backgroundColor: "#808080" },
          ]}
          onPress={addItem}
        >
          <Text style={commonStyles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.item}>
          <Text style={styles.itemText}>{item}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeItem(index)}
          >
            <Text style={styles.removeButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

// useReducer 예제 컴포넌트
const UseReducerExample = () => {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });

  return (
    <View>
      <Text style={commonStyles.sectionTitle}>useReducer</Text>
      <Text style={styles.counterText}>Count: {state.count}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[commonStyles.button, { backgroundColor: "#808080" }]}
          onPress={() => dispatch({ type: "decrement" })}
        >
          <Text style={commonStyles.buttonText}>Decrement</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[commonStyles.button, { backgroundColor: "#606060" }]}
          onPress={() => dispatch({ type: "reset" })}
        >
          <Text style={commonStyles.buttonText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[commonStyles.button, { backgroundColor: "#808080" }]}
          onPress={() => dispatch({ type: "increment" })}
        >
          <Text style={commonStyles.buttonText}>Increment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StateManagementScreen = ({ navigation }) => {
  const stateExamples = [
    { name: "useState", route: "UseStateExample" },
    { name: "useEffect", route: "UseEffectExample" },
    { name: "useContext", route: "UseContextExample" },
    { name: "useReducer", route: "UseReducerExample" },
    { name: "useMemo", route: "UseMemoExample" },
    { name: "useCallback", route: "UseCallbackExample" },
    { name: "useRef", route: "UseRefExample" },
    { name: "Redux", route: "ReduxExample" },
    { name: "Context API", route: "ContextAPIExample" },
    { name: "Swiper", route: "SwiperExample" },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.componentsContainer}>
        {stateExamples.map((example, index) => (
          <TouchableOpacity
            key={index}
            style={styles.componentItem}
            onPress={() => navigation.navigate(example.route)}
          >
            <Text style={styles.componentName}>{example.name}</Text>
            <Text style={styles.viewDetails}>View Details &gt;</Text>
          </TouchableOpacity>
        ))}
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
    color: "#eee",
    lineHeight: 22,
  },
  componentsContainer: {
    marginBottom: 20,
  },
  componentItem: {
    backgroundColor: "#242423",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  componentName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#eee",
  },
  viewDetails: {
    fontSize: 14,
    color: "#007AFF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButton: {
    marginLeft: 10,
    paddingHorizontal: 15,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    marginVertical: 5,
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  itemText: {
    flex: 1,
    color: colors.text,
  },
  removeButton: {
    backgroundColor: colors.error,
    padding: 5,
    borderRadius: 5,
  },
  removeButtonText: {
    color: "#eee",
  },
  counterText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
    color: colors.text,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  themedComponent: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default StateManagementScreen;
