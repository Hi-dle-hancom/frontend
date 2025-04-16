import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Switch,
} from "react-native";

// Example 1: Basic useImperativeHandle
const CustomInput = forwardRef((props, ref) => {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  // Expose custom methods to parent component
  useImperativeHandle(ref, () => ({
    // Custom methods
    clear: () => {
      setValue("");
    },
    focus: () => {
      inputRef.current.focus();
    },
    blur: () => {
      inputRef.current.blur();
    },
    setValue: (text) => {
      setValue(text);
    },
    // Custom properties
    getValue: () => value,
    isEmpty: () => value.trim() === "",
  }));

  return (
    <TextInput
      ref={inputRef}
      style={styles.customInput}
      value={value}
      onChangeText={setValue}
      placeholder={props.placeholder || "Type something..."}
      placeholderTextColor="#777"
      {...props}
    />
  );
});

// Example 2: Form Validation
const ValidatedInput = forwardRef((props, ref) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const validate = () => {
    if (props.required && value.trim() === "") {
      setError("This field is required");
      return false;
    }

    if (props.minLength && value.length < props.minLength) {
      setError(`Minimum length is ${props.minLength} characters`);
      return false;
    }

    if (props.pattern && !new RegExp(props.pattern).test(value)) {
      setError(props.patternError || "Invalid format");
      return false;
    }

    setError("");
    return true;
  };

  useImperativeHandle(ref, () => ({
    validate,
    focus: () => inputRef.current.focus(),
    getValue: () => value,
    setValue: (text) => setValue(text),
    clear: () => {
      setValue("");
      setError("");
    },
    hasError: () => error !== "",
  }));

  return (
    <View style={styles.validatedInputContainer}>
      <TextInput
        ref={inputRef}
        style={[styles.customInput, error ? styles.inputError : null]}
        value={value}
        onChangeText={(text) => {
          setValue(text);
          if (error) validate();
        }}
        placeholder={props.placeholder || "Type something..."}
        placeholderTextColor="#777"
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

// Example 3: Animation Controller
const AnimatedBox = forwardRef((props, ref) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // Expose animation controls
  useImperativeHandle(ref, () => ({
    fadeIn: (duration = 500) => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    },
    fadeOut: (duration = 500) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }).start();
    },
    bounce: () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    },
    moveUp: (distance = 50, duration = 500) => {
      Animated.timing(translateYAnim, {
        toValue: -distance,
        duration,
        useNativeDriver: true,
      }).start();
    },
    moveDown: (distance = 50, duration = 500) => {
      Animated.timing(translateYAnim, {
        toValue: distance,
        duration,
        useNativeDriver: true,
      }).start();
    },
    reset: () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    },
  }));

  return (
    <Animated.View
      style={[
        styles.animatedBox,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
        },
        props.style,
      ]}
    >
      <Text style={styles.animatedBoxText}>
        {props.children || "Animated Box"}
      </Text>
    </Animated.View>
  );
});

// Example 4: Custom Counter
const Counter = forwardRef((props, ref) => {
  const [count, setCount] = useState(props.initialValue || 0);
  const [isLocked, setIsLocked] = useState(false);

  useImperativeHandle(ref, () => ({
    increment: () => {
      if (!isLocked) {
        setCount((prev) => prev + 1);
        return true;
      }
      return false;
    },
    decrement: () => {
      if (!isLocked && count > 0) {
        setCount((prev) => prev - 1);
        return true;
      }
      return false;
    },
    reset: () => {
      if (!isLocked) {
        setCount(props.initialValue || 0);
        return true;
      }
      return false;
    },
    setValue: (value) => {
      if (!isLocked) {
        setCount(value);
        return true;
      }
      return false;
    },
    lock: () => setIsLocked(true),
    unlock: () => setIsLocked(false),
    isLocked: () => isLocked,
    getValue: () => count,
  }));

  return (
    <View style={styles.counterContainer}>
      <Text style={[styles.counterValue, isLocked && styles.lockedText]}>
        {count}
      </Text>
      {isLocked && (
        <View style={styles.lockedBadge}>
          <Text style={styles.lockedBadgeText}>Locked</Text>
        </View>
      )}
    </View>
  );
});

const UseImperativeHandleExample = () => {
  // Example 1: Basic useImperativeHandle
  const customInputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");

  const handleGetValue = () => {
    if (customInputRef.current) {
      setInputValue(customInputRef.current.getValue());
    }
  };

  // Example 2: Form Validation
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const emailRef = useRef(null);
  const [formStatus, setFormStatus] = useState("");

  const validateForm = () => {
    const isUsernameValid = usernameRef.current.validate();
    const isPasswordValid = passwordRef.current.validate();
    const isEmailValid = emailRef.current.validate();

    if (isUsernameValid && isPasswordValid && isEmailValid) {
      setFormStatus("Form is valid! ✅");
      return true;
    } else {
      setFormStatus("Please fix the errors ❌");
      return false;
    }
  };

  const resetForm = () => {
    usernameRef.current.clear();
    passwordRef.current.clear();
    emailRef.current.clear();
    setFormStatus("");
  };

  // Example 3: Animation Controller
  const animatedBoxRef = useRef(null);

  // Example 4: Custom Counter
  const counterRef = useRef(null);
  const [counterStatus, setCounterStatus] = useState("");
  const [isCounterLocked, setIsCounterLocked] = useState(false);

  const toggleCounterLock = () => {
    if (counterRef.current) {
      if (counterRef.current.isLocked()) {
        counterRef.current.unlock();
        setIsCounterLocked(false);
        setCounterStatus("Counter unlocked");
      } else {
        counterRef.current.lock();
        setIsCounterLocked(true);
        setCounterStatus("Counter locked");
      }
    }
  };

  const incrementCounter = () => {
    if (counterRef.current) {
      const success = counterRef.current.increment();
      if (!success) {
        setCounterStatus("Cannot increment: counter is locked");
      } else {
        setCounterStatus("");
      }
    }
  };

  const decrementCounter = () => {
    if (counterRef.current) {
      const success = counterRef.current.decrement();
      if (!success) {
        if (counterRef.current.isLocked()) {
          setCounterStatus("Cannot decrement: counter is locked");
        } else {
          setCounterStatus("Cannot decrement: already at 0");
        }
      } else {
        setCounterStatus("");
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>useImperativeHandle Hook</Text>
      <Text style={styles.description}>
        The useImperativeHandle hook customizes the instance value that is
        exposed when using ref with React.forwardRef. It allows a child
        component to expose specific functions or properties to its parent
        component.
      </Text>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>1. Basic Example</Text>
        <Text style={styles.subDescription}>
          A custom input component that exposes methods like clear, focus, and
          getValue to its parent.
        </Text>

        <CustomInput ref={customInputRef} placeholder="Type here..." />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => customInputRef.current?.focus()}
          >
            <Text style={styles.buttonText}>Focus</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => customInputRef.current?.blur()}
          >
            <Text style={styles.buttonText}>Blur</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => customInputRef.current?.clear()}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={handleGetValue}>
            <Text style={styles.buttonText}>Get Value</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => customInputRef.current?.setValue("Hello World!")}
          >
            <Text style={styles.buttonText}>Set Value</Text>
          </TouchableOpacity>
        </View>

        {inputValue ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Current Value:</Text>
            <Text style={styles.resultValue}>{inputValue}</Text>
          </View>
        ) : null}

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>How it works</Text>
          <Text style={styles.explanationText}>
            The CustomInput component uses useImperativeHandle to expose
            specific methods to its parent. This allows the parent to control
            the input (focus, clear, etc.) without exposing the entire input ref
            or internal state.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>2. Form Validation</Text>
        <Text style={styles.subDescription}>
          Validated input components that expose validation methods to the
          parent form.
        </Text>

        <ValidatedInput
          ref={usernameRef}
          placeholder="Username"
          required
          minLength={3}
        />

        <ValidatedInput
          ref={passwordRef}
          placeholder="Password"
          secureTextEntry
          required
          minLength={6}
        />

        <ValidatedInput
          ref={emailRef}
          placeholder="Email"
          required
          pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
          patternError="Please enter a valid email address"
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={validateForm}>
            <Text style={styles.buttonText}>Validate</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={resetForm}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {formStatus ? (
          <View style={styles.formStatusContainer}>
            <Text style={styles.formStatusText}>{formStatus}</Text>
          </View>
        ) : null}

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>Form Validation</Text>
          <Text style={styles.explanationText}>
            Each ValidatedInput component exposes a validate method that checks
            its own value against validation rules. The parent form can call
            these methods to validate the entire form without knowing the
            internal implementation details of each input.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>3. Animation Controller</Text>
        <Text style={styles.subDescription}>
          An animated component that exposes animation controls to its parent.
        </Text>

        <AnimatedBox ref={animatedBoxRef}>Control My Animations</AnimatedBox>

        <View style={styles.animationControls}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.animButton}
              onPress={() => animatedBoxRef.current?.fadeIn()}
            >
              <Text style={styles.buttonText}>Fade In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.animButton}
              onPress={() => animatedBoxRef.current?.fadeOut()}
            >
              <Text style={styles.buttonText}>Fade Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.animButton}
              onPress={() => animatedBoxRef.current?.bounce()}
            >
              <Text style={styles.buttonText}>Bounce</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.animButton}
              onPress={() => animatedBoxRef.current?.moveUp()}
            >
              <Text style={styles.buttonText}>Move Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.animButton}
              onPress={() => animatedBoxRef.current?.moveDown()}
            >
              <Text style={styles.buttonText}>Move Down</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.animButton}
              onPress={() => animatedBoxRef.current?.reset()}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>Animation Control</Text>
          <Text style={styles.explanationText}>
            The AnimatedBox component encapsulates all the animation logic but
            exposes simple methods like fadeIn, fadeOut, and bounce. This allows
            the parent component to trigger animations without knowing how
            they're implemented.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>4. Custom Counter</Text>
        <Text style={styles.subDescription}>
          A counter component with locking functionality exposed to its parent.
        </Text>

        <Counter ref={counterRef} initialValue={5} />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={decrementCounter}
          >
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.counterButton}
            onPress={incrementCounter}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => {
              counterRef.current?.reset();
              setCounterStatus("");
            }}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.lockContainer}>
          <Text style={styles.lockLabel}>Lock Counter:</Text>
          <Switch
            value={isCounterLocked}
            onValueChange={toggleCounterLock}
            trackColor={{ false: "#444", true: "#2196f3" }}
            thumbColor={isCounterLocked ? "#fff" : "#f4f3f4"}
          />
        </View>

        {counterStatus ? (
          <View style={styles.counterStatusContainer}>
            <Text style={styles.counterStatusText}>{counterStatus}</Text>
          </View>
        ) : null}

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>State Control</Text>
          <Text style={styles.explanationText}>
            The Counter component exposes methods to increment, decrement, and
            lock its internal state. The parent can control the counter's
            behavior without directly manipulating its state. The lock feature
            demonstrates conditional state changes based on internal rules.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>When to Use useImperativeHandle</Text>
        <Text style={styles.subDescription}>
          Best practices and use cases for useImperativeHandle:
        </Text>

        <View style={styles.guidelinesList}>
          <Text style={styles.guidelineItem}>
            • When you need to expose specific methods from a child component to
            its parent
          </Text>
          <Text style={styles.guidelineItem}>
            • When you want to hide the internal implementation details of a
            component
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to create reusable components with a clean API
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to expose validation methods from form components
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to control animations from a parent component
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to expose custom behavior that doesn't fit the props
            model
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Use Sparingly</Text>
          <Text style={styles.warningText}>
            While useImperativeHandle is powerful, it should be used sparingly.
            In most cases, props and state should be sufficient for component
            communication. Overusing imperative code can make your application
            harder to understand and maintain. Use it when the declarative
            approach doesn't fit your needs.
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
  customInput: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    color: "#eee",
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#2196f3",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  resultContainer: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    color: "#eee",
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
  validatedInputContainer: {
    marginBottom: 12,
  },
  inputError: {
    borderColor: "#f44336",
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
  },
  formStatusContainer: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: "center",
  },
  formStatusText: {
    color: "#eee",
    fontSize: 16,
  },
  animatedBox: {
    width: "100%",
    height: 100,
    backgroundColor: "#2196f3",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  animatedBoxText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  animationControls: {
    marginBottom: 16,
  },
  animButton: {
    backgroundColor: "#2196f3",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  counterContainer: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  counterValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#eee",
  },
  lockedText: {
    color: "#aaa",
  },
  counterButton: {
    backgroundColor: "#2196f3",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  lockContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  lockLabel: {
    color: "#eee",
    fontSize: 14,
  },
  lockedBadge: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#f44336",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockedBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  counterStatusContainer: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: "center",
  },
  counterStatusText: {
    color: "#f44336",
    fontSize: 14,
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

export default UseImperativeHandleExample;
