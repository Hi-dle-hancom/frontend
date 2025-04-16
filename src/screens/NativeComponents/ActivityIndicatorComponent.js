import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Keyboard,
} from "react-native";

// code snippet (코드 미리보기)
const CodeSnippet = ({ code, visible, onToggle }) => {
  return (
    <View style={styles.codeSnippetContainer}>
      <TouchableOpacity style={styles.codeToggleButton} onPress={onToggle}>
        <Text style={styles.codeToggleText}>
          {visible ? "Hide Code" : "Show Code"}
        </Text>
      </TouchableOpacity>
      {visible && (
        <ScrollView
          horizontal
          style={styles.codeScrollView}
          contentContainerStyle={styles.codeContentContainer}
        >
          <Text style={styles.codeText}>{code}</Text>
        </ScrollView>
      )}
    </View>
  );
};

const ActivityIndicatorComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWithTimeout, setIsLoadingWithTimeout] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCustomLoading, setIsCustomLoading] = useState(false);

  // code snippet (코드 미리보기)
  const [codeVisible1, setCodeVisible1] = useState(false);
  const [codeVisible2, setCodeVisible2] = useState(false);
  const [codeVisible3, setCodeVisible3] = useState(false);
  const [codeVisible4, setCodeVisible4] = useState(false);
  const [codeVisible5, setCodeVisible5] = useState(false);

  // 사용자 설정
  const [sizeOption, setSizeOption] = useState("small"); // "small", "large", "custom"
  const [indicatorColor, setIndicatorColor] = useState("#2196f3");
  const [customSize, setCustomSize] = useState("36");
  const [isAnimating, setIsAnimating] = useState(true);

  // 실제 ActivityIndicator에 전달할 size 값을 계산
  const getIndicatorSize = () => {
    // size값 전달 오류로 변수명 변경
    if (sizeOption === "custom") {
      // 숫자로 변환하여 반환
      return parseInt(customSize, 10) || 36; // 유효하지 않은 입력의 경우 기본값 36 사용
    }
    return sizeOption;
  };

  // 숫자만 입력받는 handle (정규식으로 filter)
  const handleCustomSizeChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setCustomSize(numericValue);
  };

  // loading with progress
  useEffect(() => {
    let interval;
    if (isLoadingWithTimeout) {
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 0.1;
          if (newProgress >= 1) {
            clearInterval(interval);
            setIsLoadingWithTimeout(false);
            return 0;
          }
          return newProgress;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isLoadingWithTimeout]);

  const startLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  const startLoadingWithProgress = () => {
    setProgress(0);
    setIsLoadingWithTimeout(true);
  };

  const startCustomLoading = () => {
    setIsCustomLoading(true);
    setTimeout(() => {
      setIsCustomLoading(false);
    }, 3000);
  };

  // code snippet (코드 미리보기)
  const basicCode = `import React from 'react';
import { View, ActivityIndicator } from 'react-native';

const MyComponent = () => {
  return (
    <View>
      <ActivityIndicator 
        size={${
          sizeOption === "custom"
            ? parseInt(customSize, 10) || 36
            : `"${sizeOption}"`
        }} 
        color="${indicatorColor}" 
        animating={${isAnimating}}
      />
    </View>
  );
};`;

  const colorCode = `import React from 'react';
import { View, ActivityIndicator } from 'react-native';

const MyComponent = () => {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
      <ActivityIndicator size="small" color="#2196f3" />
      <ActivityIndicator size="small" color="#4caf50" />
      <ActivityIndicator size="small" color="#f44336" />
      <ActivityIndicator size="small" color="#ff9800" />
    </View>
  );
};`;

  const loadingButtonCode = `import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';

const LoadingButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: "#2196f3",
        padding: 15,
        borderRadius: 4,
        alignItems: "center",
      }}
      onPress={startLoading}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={{ color: "#fff" }}>Start Loading</Text>
      )}
    </TouchableOpacity>
  );
};`;

  const progressCode = `import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

const ProgressLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 0.1;
          if (newProgress >= 1) {
            clearInterval(interval);
            setIsLoading(false);
            return 0;
          }
          return newProgress;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const startLoading = () => {
    setProgress(0);
    setIsLoading(true);
  };

  return (
    <View>
      <TouchableOpacity onPress={startLoading} disabled={isLoading}>
        <Text>{isLoading ? "Loading..." : "Start Progress Loading"}</Text>
      </TouchableOpacity>
      
      {isLoading && (
        <View style={{ height: 20, backgroundColor: "#333", borderRadius: 10, overflow: "hidden" }}>
          <View 
            style={{ 
              height: "100%", 
              width: \`\${progress * 100}%\`, 
              backgroundColor: "#2196f3" 
            }} 
          />
          <Text style={{ position: "absolute", alignSelf: "center" }}>
            {\`\${Math.round(progress * 100)}%\`}
          </Text>
        </View>
      )}
    </View>
  );
};`;

  // loading overlay
  const overlayCode = `import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

const LoadingOverlay = () => {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  return (
    <View>
      <TouchableOpacity onPress={startLoading} disabled={isLoading}>
        <Text>Show Loading Overlay</Text>
      </TouchableOpacity>

      {isLoading && (
        <View style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <View style={{
            backgroundColor: "#242423",
            padding: 20,
            borderRadius: 8,
            alignItems: "center",
          }}>
            <ActivityIndicator size="large" color="#2196f3" />
            <Text style={{ color: "#eee", marginTop: 10 }}>Loading...</Text>
          </View>
        </View>
      )}
    </View>
  );
};`;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>ActivityIndicator Customize</Text>
        <Text style={styles.subDescription}>
          Customize the ActivityIndicator with these settings:
        </Text>

        {/* 사용자 설정 컨트롤 패널 */}
        <View style={styles.controlPanel}>
          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Size</Text>
            <View style={styles.controlValue}>
              <TouchableOpacity
                style={[
                  styles.sizeButton,
                  sizeOption === "small" && styles.selectedSizeButton,
                ]}
                onPress={() => {
                  setSizeOption("small");
                  Keyboard.dismiss();
                }}
              >
                <Text style={styles.sizeButtonText}>Small</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sizeButton,
                  sizeOption === "large" && styles.selectedSizeButton,
                ]}
                onPress={() => {
                  setSizeOption("large");
                  Keyboard.dismiss();
                }}
              >
                <Text style={styles.sizeButtonText}>Large</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sizeButton,
                  sizeOption === "custom" && styles.selectedSizeButton,
                ]}
                onPress={() => setSizeOption("custom")}
              >
                <Text style={styles.sizeButtonText}>Custom</Text>
              </TouchableOpacity>
            </View>
          </View>

          {sizeOption === "custom" && (
            <View style={styles.controlItem}>
              <TextInput
                style={styles.sizeInput}
                value={customSize}
                onChangeText={handleCustomSizeChange}
                keyboardType="numeric"
                placeholder="Enter a Number..."
                placeholderTextColor="#999"
                maxLength={3}
              />
              <Text style={styles.helpText}>Recommended Range: 10-100</Text>
            </View>
          )}

          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Color</Text>
            <View style={styles.colorSelector}>
              <TouchableOpacity
                style={[styles.colorButton, { backgroundColor: "#2196f3" }]}
                onPress={() => setIndicatorColor("#2196f3")}
              />
              <TouchableOpacity
                style={[styles.colorButton, { backgroundColor: "#4caf50" }]}
                onPress={() => setIndicatorColor("#4caf50")}
              />
              <TouchableOpacity
                style={[styles.colorButton, { backgroundColor: "#f44336" }]}
                onPress={() => setIndicatorColor("#f44336")}
              />
              <TouchableOpacity
                style={[styles.colorButton, { backgroundColor: "#ff9800" }]}
                onPress={() => setIndicatorColor("#ff9800")}
              />
            </View>
          </View>

          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Animating</Text>
            <Switch
              value={isAnimating}
              onValueChange={setIsAnimating}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isAnimating ? "#2196f3" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.indicatorPreview}>
            <ActivityIndicator
              size={getIndicatorSize()}
              color={indicatorColor}
              animating={isAnimating}
            />
          </View>
        </View>

        {/* code snippet */}
        <CodeSnippet
          code={basicCode}
          visible={codeVisible1}
          onToggle={() => setCodeVisible1(!codeVisible1)}
        />
      </View>

      {/* 상단 custom으로 기능 추가로 주석 처리
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Different Colors</Text>
        <Text style={styles.subDescription}>
          ActivityIndicator with different colors.
        </Text>
        <View style={styles.indicatorRow}>
          <View style={styles.indicatorItem}>
            <ActivityIndicator size="small" color="#2196f3" />
            <Text style={styles.indicatorLabel}>Blue</Text>
          </View>
          <View style={styles.indicatorItem}>
            <ActivityIndicator size="small" color="#4caf50" />
            <Text style={styles.indicatorLabel}>Green</Text>
          </View>
          <View style={styles.indicatorItem}>
            <ActivityIndicator size="small" color="#f44336" />
            <Text style={styles.indicatorLabel}>Red</Text>
          </View>
          <View style={styles.indicatorItem}>
            <ActivityIndicator size="small" color="#ff9800" />
            <Text style={styles.indicatorLabel}>Orange</Text>
          </View>
        </View>

        <CodeSnippet
          code={colorCode}
          visible={codeVisible2}
          onToggle={() => setCodeVisible2(!codeVisible2)}
        />
      </View>
      */}

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Loading Button</Text>
        <Text style={styles.subDescription}>
          A button that shows a loading indicator when pressed.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={startLoading}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Start Loading</Text>
          )}
        </TouchableOpacity>

        <CodeSnippet
          code={loadingButtonCode}
          visible={codeVisible3}
          onToggle={() => setCodeVisible3(!codeVisible3)}
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Loading with Progress</Text>
        <Text style={styles.subDescription}>
          A loading indicator with a progress bar.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={startLoadingWithProgress}
          disabled={isLoadingWithTimeout}
        >
          <Text style={styles.buttonText}>
            {isLoadingWithTimeout ? "Loading..." : "Start Progress Loading"}
          </Text>
        </TouchableOpacity>
        {isLoadingWithTimeout && (
          <View style={styles.progressContainer}>
            <View
              style={[styles.progressBar, { width: `${progress * 100}%` }]}
            />
            <Text style={styles.progressText}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        )}

        <CodeSnippet
          code={progressCode}
          visible={codeVisible4}
          onToggle={() => setCodeVisible4(!codeVisible4)}
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Custom Loading Overlay</Text>
        <Text style={styles.subDescription}>
          A full-screen loading overlay with ActivityIndicator.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={startCustomLoading}
          disabled={isCustomLoading}
        >
          <Text style={styles.buttonText}>Show Loading Overlay</Text>
        </TouchableOpacity>

        {isCustomLoading && (
          <View style={styles.overlayContainer}>
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#2196f3" />
              <Text style={styles.overlayText}>Loading...</Text>
            </View>
          </View>
        )}

        <CodeSnippet
          code={overlayCode}
          visible={codeVisible5}
          onToggle={() => setCodeVisible5(!codeVisible5)}
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>ActivityIndicator Properties</Text>
        <Text style={styles.subDescription}>
          Common ActivityIndicator properties include:
        </Text>
        <View style={styles.propertiesList}>
          <Text style={styles.propertyItem}>
            • size - Size of the indicator ("small", "large", or number)
          </Text>
          <Text style={styles.propertyItem}>
            • color - Color of the spinner
          </Text>
          <Text style={styles.propertyItem}>
            • animating - Whether to show the indicator or hide it
          </Text>
          <Text style={styles.propertyItem}>
            • hidesWhenStopped - Whether the indicator should hide when not
            animating
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
  indicatorRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#333",
    padding: 20,
    borderRadius: 4,
  },
  indicatorItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorLabel: {
    color: "#aaa",
    marginTop: 8,
    fontSize: 12,
  },
  button: {
    backgroundColor: "#2196f3",
    padding: 15,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  progressContainer: {
    height: 20,
    backgroundColor: "#333",
    borderRadius: 10,
    marginTop: 16,
    overflow: "hidden",
    position: "relative",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2196f3",
    borderRadius: 10,
  },
  progressText: {
    position: "absolute",
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    alignSelf: "center",
    top: 2,
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  overlay: {
    backgroundColor: "#242423",
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 150,
  },
  overlayText: {
    color: "#eee",
    marginTop: 10,
    fontSize: 16,
  },
  propertiesList: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 4,
  },
  propertyItem: {
    color: "#eee",
    fontSize: 14,
    marginBottom: 8,
  },
  // 새로운 스타일
  controlPanel: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 4,
    marginBottom: 15,
  },
  controlItem: {
    marginBottom: 12,
  },
  controlLabel: {
    color: "#eee",
    fontSize: 14,
    marginBottom: 8,
  },
  controlValue: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sizeButton: {
    backgroundColor: "#444",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 2,
    alignItems: "center",
  },
  selectedSizeButton: {
    backgroundColor: "#2196f3",
  },
  sizeButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  colorSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: "#444",
  },
  sizeInput: {
    backgroundColor: "#444",
    borderRadius: 4,
    padding: 10,
    color: "#fff",
    fontSize: 16,
    width: "100%",
    marginBottom: 5,
  },
  helpText: {
    color: "#aaa",
    fontSize: 12,
    fontStyle: "italic",
  },
  previewContainer: {
    backgroundColor: "#333",
    padding: 20,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 15,
  },
  previewTitle: {
    color: "#eee",
    fontSize: 14,
    marginBottom: 15,
  },
  indicatorPreview: {
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  codeSnippetContainer: {
    marginTop: 15,
  },
  codeToggleButton: {
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  codeToggleText: {
    color: "#2196f3",
    fontSize: 14,
  },
  codeScrollView: {
    backgroundColor: "#1c1c1c",
    marginTop: 10,
    borderRadius: 4,
    maxHeight: 200,
  },
  codeContentContainer: {
    padding: 10,
  },
  codeText: {
    color: "#eee",
    fontFamily: "monospace",
    fontSize: 12,
  },
});

export default ActivityIndicatorComponent;
