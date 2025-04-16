import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";

const UseRefExample = () => {
  // Example 1: DOM Reference
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");

  const focusInput = () => {
    inputRef.current.focus();
  };

  // Example 2: Storing Previous Values
  const [count, setCount] = useState(0);
  const prevCountRef = useRef(0);

  useEffect(() => {
    prevCountRef.current = count;
  }, [count]);

  // Example 3: Persisting Values Without Re-renders
  const renderCountRef = useRef(0);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    renderCountRef.current += 1;
  });

  // Example 4: Timer Reference
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const pauseTimer = () => {
    if (isRunning) {
      clearInterval(timerRef.current);
      setIsRunning(false);
    }
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setSeconds(0);
  };

  // Example 5: Animation with useRef
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;

  const startAnimation = () => {
    // Reset animations
    fadeAnim.setValue(0);
    translateYAnim.setValue(50);

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Example 6: Tracking State Changes Without Re-renders
  const [inputText, setInputText] = useState("");
  const inputChangesRef = useRef(0);

  useEffect(() => {
    inputChangesRef.current += 1;
  }, [inputText]);

  // Example 7: Scroll Position
  const scrollViewRef = useRef(null);
  const scrollPositionRef = useRef(0);

  const handleScroll = (event) => {
    scrollPositionRef.current = event.nativeEvent.contentOffset.y;
  };

  const scrollToTop = () => {
    scrollViewRef.current.scrollTo({ y: 0, animated: true });
  };

  const scrollToBottom = () => {
    scrollViewRef.current.scrollToEnd({ animated: true });
  };

  return (
    <ScrollView
      style={styles.container}
      ref={scrollViewRef}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <Text style={styles.title}>useRef Hook</Text>
      <Text style={styles.description}>
        The useRef hook creates a mutable reference that persists across
        renders. It's useful for accessing DOM elements, storing previous
        values, and keeping track of values without triggering re-renders.
      </Text>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>1. DOM References</Text>
        <Text style={styles.subDescription}>
          useRef can be used to directly access and manipulate DOM elements.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Type something..."
            placeholderTextColor="#777"
          />
          <TouchableOpacity style={styles.button} onPress={focusInput}>
            <Text style={styles.buttonText}>Focus Input</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>How it works</Text>
          <Text style={styles.explanationText}>
            By attaching a ref to a component with the ref attribute, we can
            access the underlying DOM node or React component instance. In this
            example, we use it to focus the input field when the button is
            pressed.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>2. Storing Previous Values</Text>
        <Text style={styles.subDescription}>
          useRef can remember values from previous renders.
        </Text>

        <View style={styles.counterContainer}>
          <Text style={styles.counterValue}>Current: {count}</Text>
          <Text style={styles.counterValue}>
            Previous: {prevCountRef.current}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setCount(count - 1)}
            >
              <Text style={styles.buttonText}>-</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setCount(count + 1)}
            >
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>How it works</Text>
          <Text style={styles.explanationText}>
            We store the previous count value in a ref and update it in a
            useEffect hook that runs after each render. This allows us to
            compare the current value with the previous one.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>
          3. Persisting Values Without Re-renders
        </Text>
        <Text style={styles.subDescription}>
          useRef can store values that don't trigger re-renders when changed.
        </Text>

        <View style={styles.renderCountContainer}>
          <Text style={styles.renderCountText}>
            This component has rendered {renderCountRef.current} times
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => forceUpdate({})}
          >
            <Text style={styles.buttonText}>Force Re-render</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>How it works</Text>
          <Text style={styles.explanationText}>
            Unlike state, changing a ref value doesn't cause a re-render. We
            increment the render count in useEffect, which runs after each
            render. The "Force Re-render" button updates state to trigger a
            re-render.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>4. Timer References</Text>
        <Text style={styles.subDescription}>
          useRef is perfect for storing timer IDs to clean them up later.
        </Text>

        <View style={styles.timerContainer}>
          <Text style={styles.timerValue}>{seconds} seconds</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.timerButton, isRunning && styles.disabledButton]}
              onPress={startTimer}
              disabled={isRunning}
            >
              <Text style={styles.buttonText}>Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timerButton, !isRunning && styles.disabledButton]}
              onPress={pauseTimer}
              disabled={!isRunning}
            >
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.timerButton} onPress={resetTimer}>
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>How it works</Text>
          <Text style={styles.explanationText}>
            We store the timer ID in a ref so we can access it later to clear
            the interval. This is important for cleanup to prevent memory leaks.
            The ref persists between renders, so we always have access to the
            current timer ID.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>5. Animation with useRef</Text>
        <Text style={styles.subDescription}>
          useRef can store Animated values for animations.
        </Text>

        <View style={styles.animationContainer}>
          <Animated.View
            style={[
              styles.animatedBox,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateYAnim }],
              },
            ]}
          >
            <Text style={styles.animatedText}>Animated Box</Text>
          </Animated.View>

          <TouchableOpacity style={styles.button} onPress={startAnimation}>
            <Text style={styles.buttonText}>Start Animation</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>How it works</Text>
          <Text style={styles.explanationText}>
            We use useRef to create and store Animated.Value instances. These
            values control the opacity and position of the animated box. The
            animation is triggered by the button press.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>
          6. Tracking Changes Without Re-renders
        </Text>
        <Text style={styles.subDescription}>
          useRef can track changes without causing re-renders.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type to track changes..."
            placeholderTextColor="#777"
          />
          <Text style={styles.changeCountText}>
            Input has changed {inputChangesRef.current} times
          </Text>
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>How it works</Text>
          <Text style={styles.explanationText}>
            We increment a ref counter in a useEffect hook that runs when the
            input text changes. This allows us to track how many times the input
            has changed without causing additional re-renders.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>7. Scroll Position</Text>
        <Text style={styles.subDescription}>
          useRef can track scroll position and control scrolling.
        </Text>

        <View style={styles.scrollButtonContainer}>
          <TouchableOpacity style={styles.scrollButton} onPress={scrollToTop}>
            <Text style={styles.buttonText}>Scroll to Top</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scrollButton}
            onPress={scrollToBottom}
          >
            <Text style={styles.buttonText}>Scroll to Bottom</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>How it works</Text>
          <Text style={styles.explanationText}>
            We use a ref to access the ScrollView methods like scrollTo and
            scrollToEnd. We also track the current scroll position in a ref
            that's updated in the onScroll event handler.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>When to Use useRef</Text>
        <Text style={styles.subDescription}>
          Best practices and use cases for useRef:
        </Text>

        <View style={styles.guidelinesList}>
          <Text style={styles.guidelineItem}>
            • When you need to access DOM elements directly
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to store a value that persists between renders
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to store a value that shouldn't trigger re-renders
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to keep track of previous state values
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to store mutable values like timer IDs
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to store animation values
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Important Note</Text>
          <Text style={styles.warningText}>
            Changing a ref value does not trigger a re-render. If you need the
            UI to update when a value changes, use useState instead. useRef is
            for values that need to persist between renders without causing
            re-renders.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const { width } = Dimensions.get("window");

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
  input: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    color: "#eee",
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
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
  counterContainer: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: "center",
  },
  counterValue: {
    fontSize: 18,
    color: "#eee",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  counterButton: {
    backgroundColor: "#2196f3",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    margin: 8,
  },
  renderCountContainer: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: "center",
  },
  renderCountText: {
    fontSize: 16,
    color: "#eee",
    marginBottom: 12,
  },
  timerContainer: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: "center",
  },
  timerValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#eee",
    marginBottom: 16,
  },
  timerButton: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    margin: 4,
    minWidth: 80,
  },
  disabledButton: {
    backgroundColor: "#666",
  },
  animationContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  animatedBox: {
    width: width * 0.7,
    height: 100,
    backgroundColor: "#2196f3",
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  animatedText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  changeCountText: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
  },
  scrollButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  scrollButton: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    flex: 1,
    margin: 4,
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

export default UseRefExample;
