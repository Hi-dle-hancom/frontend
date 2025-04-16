import React, { createContext, useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  Switch,
  TextInput,
} from "react-native";

// Create theme context
const ThemeContext = createContext();
const UserContext = createContext();

// Theme provider component
const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const theme = {
    isDarkMode,
    toggleTheme: () => setIsDarkMode((prev) => !prev),
    colors: isDarkMode
      ? {
          background: "#121212",
          surface: "#1e1e1e",
          primary: "#bb86fc",
          text: "#ffffff",
          border: "#333333",
        }
      : {
          background: "#ffffff",
          surface: "#f5f5f5",
          primary: "#6200ee",
          text: "#000000",
          border: "#e0e0e0",
        },
  };

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

// User provider component
const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: "",
    isLoggedIn: false,
  });

  const login = (name) => {
    setUser({
      name,
      isLoggedIn: true,
    });
  };

  const logout = () => {
    setUser({
      name: "",
      isLoggedIn: false,
    });
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Theme usage component
const ThemedComponent = () => {
  const theme = useContext(ThemeContext);

  return (
    <View
      style={[
        styles.themedComponent,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.themedText, { color: theme.colors.text }]}>
        This component is currently in {theme.isDarkMode ? "dark" : "light"}{" "}
        mode.
      </Text>
      <Button
        title={`Switch to ${theme.isDarkMode ? "light" : "dark"} mode`}
        onPress={theme.toggleTheme}
        color={theme.colors.primary}
      />
    </View>
  );
};

// User profile component
const UserProfile = () => {
  const { user, logout } = useContext(UserContext);
  const theme = useContext(ThemeContext);

  return (
    <View
      style={[
        styles.userProfile,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.profileText, { color: theme.colors.text }]}>
        {user.isLoggedIn ? `Hello, ${user.name}!` : "You are not logged in."}
      </Text>
      {user.isLoggedIn && (
        <Button title="Logout" onPress={logout} color={theme.colors.primary} />
      )}
    </View>
  );
};

// Login form component
const LoginForm = () => {
  const { user, login } = useContext(UserContext);
  const theme = useContext(ThemeContext);
  const [name, setName] = useState("");

  const handleLogin = () => {
    if (name.trim()) {
      login(name);
      setName("");
    }
  };

  if (user.isLoggedIn) {
    return null;
  }

  return (
    <View
      style={[
        styles.loginForm,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.isDarkMode ? "#333" : "#f5f5f5",
            color: theme.colors.text,
            borderColor: theme.colors.border,
          },
        ]}
        placeholder="Enter your name"
        placeholderTextColor={theme.isDarkMode ? "#aaa" : "#999"}
        value={name}
        onChangeText={setName}
      />
      <Button
        title="Login"
        onPress={handleLogin}
        color={theme.colors.primary}
        disabled={!name.trim()}
      />
    </View>
  );
};

// Nested component
const NestedComponent = () => {
  const theme = useContext(ThemeContext);

  return (
    <View style={styles.nestedContainer}>
      <Text style={[styles.nestedTitle, { color: theme.colors.text }]}>
        Nested Components
      </Text>
      <ThemedComponent />
      <UserProfile />
      <LoginForm />
    </View>
  );
};

// Main component
const UseContextExample = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>useContext Hook</Text>
      <Text style={styles.description}>
        useContext is a React hook that subscribes to a context and returns its
        current value. It allows you to share data across the component tree
        without passing props down manually.
      </Text>

      <ThemeProvider>
        <UserProvider>
          <View style={styles.exampleContainer}>
            <Text style={styles.exampleTitle}>Theme Context Example</Text>
            <Text style={styles.subDescription}>
              ThemeContext is used to manage the app-wide theme. All components
              below share the same theme context.
            </Text>
            <ThemedComponent />
          </View>

          <View style={styles.exampleContainer}>
            <Text style={styles.exampleTitle}>User Context Example</Text>
            <Text style={styles.subDescription}>
              UserContext is used to manage user information and authentication
              state.
            </Text>
            <UserProfile />
            <LoginForm />
          </View>

          <View style={styles.exampleContainer}>
            <Text style={styles.exampleTitle}>Nested Context Example</Text>
            <Text style={styles.subDescription}>
              Multiple contexts can be nested and used together. In this
              example, we use both ThemeContext and UserContext.
            </Text>
            <NestedComponent />
          </View>
        </UserProvider>
      </ThemeProvider>
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
  themedComponent: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  themedText: {
    fontSize: 16,
    marginBottom: 12,
  },
  userProfile: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  profileText: {
    fontSize: 16,
    marginBottom: 12,
  },
  loginForm: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  nestedContainer: {
    marginTop: 8,
  },
  nestedTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    color: "#eee",
  },
});

export default UseContextExample;
