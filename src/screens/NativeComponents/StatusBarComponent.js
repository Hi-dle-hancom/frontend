import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
} from "react-native";

const StatusBarComponent = () => {
  const [statusBarStyle, setStatusBarStyle] = useState("light-content");
  const [statusBarHidden, setStatusBarHidden] = useState(false);
  const [statusBarTranslucent, setStatusBarTranslucent] = useState(false);
  const [statusBarBackgroundColor, setStatusBarBackgroundColor] =
    useState("#101010");

  const toggleStatusBarStyle = () => {
    setStatusBarStyle(
      statusBarStyle === "light-content" ? "dark-content" : "light-content"
    );
  };

  const toggleStatusBarHidden = () => {
    setStatusBarHidden(!statusBarHidden);
  };

  const toggleStatusBarTranslucent = () => {
    setStatusBarTranslucent(!statusBarTranslucent);
  };

  const changeStatusBarBackgroundColor = (color) => {
    setStatusBarBackgroundColor(color);
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar
        barStyle={statusBarStyle}
        hidden={statusBarHidden}
        backgroundColor={statusBarBackgroundColor}
        translucent={statusBarTranslucent}
      />

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>StatusBar Styles</Text>
        <Text style={styles.subDescription}>
          Change the appearance of the status bar text and icons.
        </Text>
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>
            Current Style: {statusBarStyle}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={toggleStatusBarStyle}
          >
            <Text style={styles.buttonText}>Toggle Style</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.previewContainer}>
          <View
            style={[
              styles.statusBarPreview,
              {
                backgroundColor:
                  statusBarStyle === "light-content" ? "#000" : "#fff",
              },
            ]}
          >
            <Text
              style={[
                styles.statusBarPreviewText,
                {
                  color: statusBarStyle === "light-content" ? "#fff" : "#000",
                },
              ]}
            >
              Status Bar Preview
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Hide StatusBar</Text>
        <Text style={styles.subDescription}>
          Toggle the visibility of the status bar.
        </Text>
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>
            Status Bar Hidden: {statusBarHidden ? "Yes" : "No"}
          </Text>
          <Switch
            value={statusBarHidden}
            onValueChange={toggleStatusBarHidden}
            trackColor={{ false: "#444", true: "#2196f3" }}
            thumbColor={statusBarHidden ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

      {Platform.OS === "android" && (
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleTitle}>
            StatusBar Background Color (Android)
          </Text>
          <Text style={styles.subDescription}>
            Change the background color of the status bar on Android.
          </Text>
          <View style={styles.colorButtonsContainer}>
            <TouchableOpacity
              style={[styles.colorButton, { backgroundColor: "#101010" }]}
              onPress={() => changeStatusBarBackgroundColor("#101010")}
            >
              <Text style={styles.colorButtonText}>Dark</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.colorButton, { backgroundColor: "#2196f3" }]}
              onPress={() => changeStatusBarBackgroundColor("#2196f3")}
            >
              <Text style={styles.colorButtonText}>Blue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.colorButton, { backgroundColor: "#4caf50" }]}
              onPress={() => changeStatusBarBackgroundColor("#4caf50")}
            >
              <Text style={styles.colorButtonText}>Green</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.colorButton, { backgroundColor: "#f44336" }]}
              onPress={() => changeStatusBarBackgroundColor("#f44336")}
            >
              <Text style={styles.colorButtonText}>Red</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.currentColorText}>
            Current Color: {statusBarBackgroundColor}
          </Text>
        </View>
      )}

      {Platform.OS === "android" && (
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleTitle}>
            Translucent StatusBar (Android)
          </Text>
          <Text style={styles.subDescription}>
            Make the status bar translucent on Android, allowing content to
            render behind it.
          </Text>
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>
              Translucent: {statusBarTranslucent ? "Yes" : "No"}
            </Text>
            <Switch
              value={statusBarTranslucent}
              onValueChange={toggleStatusBarTranslucent}
              trackColor={{ false: "#444", true: "#2196f3" }}
              thumbColor={statusBarTranslucent ? "#fff" : "#f4f3f4"}
            />
          </View>
          <Text style={styles.noteText}>
            Note: When translucent is true, you may need to add padding to your
            content to prevent it from being hidden behind the status bar.
          </Text>
        </View>
      )}

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>StatusBar Properties</Text>
        <Text style={styles.subDescription}>
          Common StatusBar properties include:
        </Text>
        <View style={styles.propertiesList}>
          <Text style={styles.propertyItem}>
            • barStyle - Appearance of status bar text ("default",
            "light-content", "dark-content")
          </Text>
          <Text style={styles.propertyItem}>
            • hidden - Whether the status bar is hidden
          </Text>
          <Text style={styles.propertyItem}>
            • backgroundColor - Background color of the status bar (Android
            only)
          </Text>
          <Text style={styles.propertyItem}>
            • translucent - Whether the app can draw under the status bar
            (Android only)
          </Text>
          <Text style={styles.propertyItem}>
            • networkActivityIndicatorVisible - Show network activity indicator
            (iOS only)
          </Text>
          <Text style={styles.propertyItem}>
            • showHideTransition - Transition effect when showing/hiding
            ("fade", "slide", "none") (iOS only)
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
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 4,
  },
  controlLabel: {
    color: "#eee",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#2196f3",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  previewContainer: {
    marginTop: 12,
  },
  statusBarPreview: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  statusBarPreviewText: {
    fontSize: 14,
    fontWeight: "500",
  },
  colorButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 4,
  },
  colorButton: {
    width: 60,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  colorButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  currentColorText: {
    color: "#eee",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
  noteText: {
    color: "#aaa",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 10,
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
});

export default StatusBarComponent;
