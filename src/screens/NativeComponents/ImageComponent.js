import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";

const { width } = Dimensions.get("window");
const imageWidth = width - 32; // Accounting for padding

const ImageComponent = () => {
  const [imageError, setImageError] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Local Images</Text>
        <Text style={styles.subDescription}>
          Local images are loaded using require().
        </Text>
        <Image
          source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }}
          style={styles.localImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Network Images</Text>
        <Text style={styles.subDescription}>
          Network images are loaded by specifying a URI.
        </Text>
        <Image
          source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }}
          style={styles.networkImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Image Resize Modes</Text>
        <View style={styles.resizeModeContainer}>
          <View style={styles.resizeModeItem}>
            <Text style={styles.resizeModeTitle}>cover</Text>
            <Image
              source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }}
              style={styles.resizeModeImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.resizeModeItem}>
            <Text style={styles.resizeModeTitle}>contain</Text>
            <Image
              source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }}
              style={styles.resizeModeImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.resizeModeItem}>
            <Text style={styles.resizeModeTitle}>stretch</Text>
            <Image
              source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }}
              style={styles.resizeModeImage}
              resizeMode="stretch"
            />
          </View>
          <View style={styles.resizeModeItem}>
            <Text style={styles.resizeModeTitle}>center</Text>
            <Image
              source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }}
              style={styles.resizeModeImage}
              resizeMode="center"
            />
          </View>
        </View>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Image Styling</Text>
        <Image
          source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }}
          style={styles.styledImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>
          Image Loading and Error Handling
        </Text>
        <Image
          source={{
            uri: imageError
              ? "https://invalid-url.com/image.png"
              : "https://reactnative.dev/img/tiny_logo.png",
          }}
          style={styles.networkImage}
          onLoadStart={() => console.log("Image loading started")}
          onLoad={() => console.log("Image loading completed")}
          onLoadEnd={() => console.log("Image loading ended")}
          onError={() => console.log("Image loading error")}
          defaultSource={{ uri: "https://reactnative.dev/img/tiny_logo.png" }}
        />
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => setImageError(!imageError)}
        >
          <Text style={styles.errorButtonText}>
            {imageError ? "Load Valid Image" : "Simulate Invalid Image URL"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Background Image</Text>
        <View style={styles.backgroundImageContainer}>
          <Image
            source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Text Displayed Over Image</Text>
          </View>
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
  localImage: {
    width: imageWidth,
    height: 150,
    backgroundColor: "#333",
  },
  networkImage: {
    width: imageWidth,
    height: 150,
    backgroundColor: "#333",
  },
  resizeModeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  resizeModeItem: {
    width: "48%",
    marginBottom: 16,
  },
  resizeModeTitle: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#eee",
  },
  resizeModeImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#444",
  },
  styledImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: "#2196f3",
    alignSelf: "center",
  },
  errorButton: {
    marginTop: 12,
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  errorButtonText: {
    color: "#2196f3",
    fontWeight: "500",
  },
  backgroundImageContainer: {
    height: 200,
    width: "100%",
    position: "relative",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default ImageComponent;
