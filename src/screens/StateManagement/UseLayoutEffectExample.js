import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Switch,
} from "react-native";

const UseLayoutEffectExample = () => {
  // Example 1: Comparing useEffect vs useLayoutEffect
  const [showEffect, setShowEffect] = useState(false);
  const [showLayoutEffect, setShowLayoutEffect] = useState(false);

  // Example 2: Measuring and positioning
  const [boxWidth, setBoxWidth] = useState(100);
  const boxRef = useRef(null);
  const [boxMeasurements, setBoxMeasurements] = useState(null);

  useLayoutEffect(() => {
    if (boxRef.current) {
      boxRef.current.measure((x, y, width, height, pageX, pageY) => {
        setBoxMeasurements({ x, y, width, height, pageX, pageY });
      });
    }
  }, [boxWidth]);

  // Example 3: Animation with useLayoutEffect vs useEffect
  const [useLayoutForAnimation, setUseLayoutForAnimation] = useState(true);
  const animatedValueLayout = useRef(new Animated.Value(0)).current;
  const animatedValueEffect = useRef(new Animated.Value(0)).current;
  const [triggerAnimation, setTriggerAnimation] = useState(false);

  // Reset animations when toggling
  useEffect(() => {
    animatedValueLayout.setValue(0);
    animatedValueEffect.setValue(0);
  }, [triggerAnimation]);

  // Animation with useLayoutEffect (synchronous, before browser paint)
  useLayoutEffect(() => {
    if (useLayoutForAnimation) {
      Animated.timing(animatedValueLayout, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [triggerAnimation, useLayoutForAnimation]);

  // Animation with useEffect (asynchronous, after browser paint)
  useEffect(() => {
    if (!useLayoutForAnimation) {
      Animated.timing(animatedValueEffect, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [triggerAnimation, useLayoutForAnimation]);

  // Example 4: DOM manipulation before paint
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (showTooltip && buttonRef.current && tooltipRef.current) {
      buttonRef.current.measure((x, y, width, height, pageX, pageY) => {
        // Position tooltip above the button
        setTooltipPosition({
          top: pageY - 40,
          left: pageX + width / 2 - 75, // Center tooltip
        });
      });
    }
  }, [showTooltip]);

  // Example 5: Preventing Flash of Incorrect Content
  const [content, setContent] = useState("Initial Content");
  const [showUpdatedContent, setShowUpdatedContent] = useState(false);
  const [useLayoutForContent, setUseLayoutForContent] = useState(true);

  // Toggle between useLayoutEffect and useEffect for content update
  useLayoutEffect(() => {
    if (showUpdatedContent && useLayoutForContent) {
      setContent("Updated with useLayoutEffect");
    }
  }, [showUpdatedContent, useLayoutForContent]);

  useEffect(() => {
    if (showUpdatedContent && !useLayoutForContent) {
      // Simulate a delay to make the flash more noticeable
      const timer = setTimeout(() => {
        setContent("Updated with useEffect");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showUpdatedContent, useLayoutForContent]);

  // Reset content when toggling
  useEffect(() => {
    if (!showUpdatedContent) {
      setContent("Initial Content");
    }
  }, [showUpdatedContent]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>useLayoutEffect Hook</Text>
      <Text style={styles.description}>
        The useLayoutEffect hook is similar to useEffect, but it fires
        synchronously after all DOM mutations and before the browser paints.
        This makes it useful for reading layout and synchronously re-rendering.
      </Text>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>1. useEffect vs useLayoutEffect</Text>
        <Text style={styles.subDescription}>
          Compare the timing differences between useEffect and useLayoutEffect.
        </Text>

        <View style={styles.comparisonContainer}>
          <View style={styles.effectColumn}>
            <Text style={styles.columnTitle}>useEffect</Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowEffect(!showEffect)}
            >
              <Text style={styles.buttonText}>
                {showEffect ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>

            <View style={styles.effectBox}>
              {showEffect && <EffectComponent />}
            </View>
          </View>

          <View style={styles.effectColumn}>
            <Text style={styles.columnTitle}>useLayoutEffect</Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowLayoutEffect(!showLayoutEffect)}
            >
              <Text style={styles.buttonText}>
                {showLayoutEffect ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>

            <View style={styles.effectBox}>
              {showLayoutEffect && <LayoutEffectComponent />}
            </View>
          </View>
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>Key Differences</Text>
          <Text style={styles.explanationText}>
            • useEffect runs asynchronously after the browser has painted.{"\n"}
            • useLayoutEffect runs synchronously before the browser paints.
            {"\n"}• useLayoutEffect can block visual updates if your code takes
            a long time to run.{"\n"}• useEffect is preferred for most side
            effects to avoid blocking rendering.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>2. Measuring and Positioning</Text>
        <Text style={styles.subDescription}>
          useLayoutEffect is ideal for measuring DOM elements and positioning UI
          elements based on layout.
        </Text>

        <View style={styles.measurementContainer}>
          <View ref={boxRef} style={[styles.measuredBox, { width: boxWidth }]}>
            <Text style={styles.boxText}>Resize Me</Text>
          </View>

          <View style={styles.sliderContainer}>
            <TouchableOpacity
              style={styles.sizeButton}
              onPress={() => setBoxWidth(Math.max(50, boxWidth - 50))}
            >
              <Text style={styles.buttonText}>-</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sizeButton}
              onPress={() => setBoxWidth(Math.min(300, boxWidth + 50))}
            >
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>

          {boxMeasurements && (
            <View style={styles.measurementResults}>
              <Text style={styles.measurementText}>
                Width: {boxMeasurements.width.toFixed(0)}px
              </Text>
              <Text style={styles.measurementText}>
                Height: {boxMeasurements.height.toFixed(0)}px
              </Text>
              <Text style={styles.measurementText}>
                Position X: {boxMeasurements.pageX.toFixed(0)}px
              </Text>
              <Text style={styles.measurementText}>
                Position Y: {boxMeasurements.pageY.toFixed(0)}px
              </Text>
            </View>
          )}
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>Why useLayoutEffect?</Text>
          <Text style={styles.explanationText}>
            useLayoutEffect ensures we get measurements after DOM mutations but
            before the browser paints. This prevents any visual flicker that
            might occur if we were to measure and then update the UI in
            useEffect.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>3. Animation Timing</Text>
        <Text style={styles.subDescription}>
          Compare animations started with useLayoutEffect vs useEffect.
        </Text>

        <View style={styles.animationContainer}>
          <View style={styles.animationToggle}>
            <Text style={styles.toggleLabel}>
              Use {useLayoutForAnimation ? "useLayoutEffect" : "useEffect"}
            </Text>
            <Switch
              value={useLayoutForAnimation}
              onValueChange={setUseLayoutForAnimation}
              trackColor={{ false: "#444", true: "#2196f3" }}
              thumbColor={useLayoutForAnimation ? "#fff" : "#f4f3f4"}
            />
          </View>

          <TouchableOpacity
            style={styles.animateButton}
            onPress={() => setTriggerAnimation(!triggerAnimation)}
          >
            <Text style={styles.buttonText}>Trigger Animation</Text>
          </TouchableOpacity>

          <View style={styles.animationTrack}>
            <Animated.View
              style={[
                styles.animationDot,
                {
                  transform: [
                    {
                      translateX: useLayoutForAnimation
                        ? animatedValueLayout.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 250],
                          })
                        : animatedValueEffect.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 250],
                          }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>Animation Timing</Text>
          <Text style={styles.explanationText}>
            With useLayoutEffect, the animation starts synchronously before the
            browser paints, which can prevent a flash of the initial state. With
            useEffect, there might be a brief moment where you see the initial
            state before the animation begins.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>4. Tooltip Positioning</Text>
        <Text style={styles.subDescription}>
          useLayoutEffect ensures tooltips are positioned correctly before
          they're displayed.
        </Text>

        <View style={styles.tooltipContainer}>
          <TouchableOpacity
            ref={buttonRef}
            style={styles.tooltipButton}
            onPress={() => setShowTooltip(!showTooltip)}
          >
            <Text style={styles.buttonText}>
              {showTooltip ? "Hide Tooltip" : "Show Tooltip"}
            </Text>
          </TouchableOpacity>

          {showTooltip && (
            <View
              ref={tooltipRef}
              style={[
                styles.tooltip,
                { top: tooltipPosition.top, left: tooltipPosition.left },
              ]}
            >
              <Text style={styles.tooltipText}>This is a tooltip!</Text>
              <View style={styles.tooltipArrow} />
            </View>
          )}
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>Proper Positioning</Text>
          <Text style={styles.explanationText}>
            useLayoutEffect ensures the tooltip is positioned correctly before
            it becomes visible. If we used useEffect, the tooltip might briefly
            appear in the wrong position before being moved to the correct
            position.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>
          5. Preventing Flash of Incorrect Content
        </Text>
        <Text style={styles.subDescription}>
          useLayoutEffect can prevent the user from seeing intermediate states.
        </Text>

        <View style={styles.contentContainer}>
          <View style={styles.contentToggle}>
            <Text style={styles.toggleLabel}>
              Use {useLayoutForContent ? "useLayoutEffect" : "useEffect"}
            </Text>
            <Switch
              value={useLayoutForContent}
              onValueChange={setUseLayoutForContent}
              trackColor={{ false: "#444", true: "#2196f3" }}
              thumbColor={useLayoutForContent ? "#fff" : "#f4f3f4"}
            />
          </View>

          <TouchableOpacity
            style={styles.contentButton}
            onPress={() => setShowUpdatedContent(!showUpdatedContent)}
          >
            <Text style={styles.buttonText}>
              {showUpdatedContent ? "Reset Content" : "Update Content"}
            </Text>
          </TouchableOpacity>

          <View style={styles.contentDisplay}>
            <Text style={styles.contentText}>{content}</Text>
          </View>
        </View>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>Preventing Flicker</Text>
          <Text style={styles.explanationText}>
            With useLayoutEffect, content updates happen synchronously before
            the browser paints, preventing users from seeing the initial state.
            With useEffect, users might briefly see the initial state before the
            update, causing a "flash" of incorrect content.
          </Text>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>When to Use useLayoutEffect</Text>
        <Text style={styles.subDescription}>
          Best practices and use cases for useLayoutEffect:
        </Text>

        <View style={styles.guidelinesList}>
          <Text style={styles.guidelineItem}>
            • When you need to measure DOM elements and use those measurements
            for layout
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to position elements based on other elements'
            dimensions or positions
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to prevent a flash of incorrect content
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to start animations synchronously before the browser
            paints
          </Text>
          <Text style={styles.guidelineItem}>
            • When you need to make DOM changes that should be visible
            immediately
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Performance Warning</Text>
          <Text style={styles.warningText}>
            Since useLayoutEffect runs synchronously before the browser paints,
            long-running code inside it can delay visual updates and make your
            app feel sluggish. Use useEffect for most side effects unless you
            specifically need the synchronous behavior of useLayoutEffect.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

// Component that uses useEffect
const EffectComponent = () => {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    setPosition(100);
    return () => setPosition(0);
  }, []);

  return (
    <View style={[styles.movingBox, { marginLeft: position }]}>
      <Text style={styles.boxText}>useEffect</Text>
    </View>
  );
};

// Component that uses useLayoutEffect
const LayoutEffectComponent = () => {
  const [position, setPosition] = useState(0);

  useLayoutEffect(() => {
    setPosition(100);
    return () => setPosition(0);
  }, []);

  return (
    <View style={[styles.movingBox, { marginLeft: position }]}>
      <Text style={styles.boxText}>useLayoutEffect</Text>
    </View>
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
  comparisonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  effectColumn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#eee",
    marginBottom: 12,
  },
  toggleButton: {
    backgroundColor: "#2196f3",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    width: "80%",
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  effectBox: {
    height: 100,
    width: "100%",
    backgroundColor: "#242423",
    borderRadius: 4,
    overflow: "hidden",
  },
  movingBox: {
    width: 80,
    height: 40,
    backgroundColor: "#2196f3",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  boxText: {
    color: "#fff",
    fontSize: 12,
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
  measurementContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  measuredBox: {
    height: 100,
    backgroundColor: "#2196f3",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  sizeButton: {
    backgroundColor: "#2196f3",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 16,
  },
  measurementResults: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    width: "100%",
  },
  measurementText: {
    color: "#eee",
    fontSize: 14,
    marginBottom: 4,
  },
  animationContainer: {
    marginBottom: 16,
  },
  animationToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  toggleLabel: {
    color: "#eee",
    fontSize: 14,
  },
  animateButton: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 16,
  },
  animationTrack: {
    height: 4,
    backgroundColor: "#444",
    borderRadius: 2,
    marginVertical: 16,
  },
  animationDot: {
    width: 20,
    height: 20,
    backgroundColor: "#2196f3",
    borderRadius: 10,
    position: "absolute",
    top: -8,
  },
  tooltipContainer: {
    alignItems: "center",
    marginBottom: 16,
    height: 100,
  },
  tooltipButton: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    width: 150,
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 4,
    width: 150,
    alignItems: "center",
  },
  tooltipText: {
    color: "#eee",
    fontSize: 14,
  },
  tooltipArrow: {
    position: "absolute",
    bottom: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderStyle: "solid",
    backgroundColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#333",
  },
  contentContainer: {
    marginBottom: 16,
  },
  contentToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  contentButton: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 16,
  },
  contentDisplay: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
    minHeight: 60,
    justifyContent: "center",
  },
  contentText: {
    color: "#eee",
    fontSize: 16,
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

export default UseLayoutEffectExample;
