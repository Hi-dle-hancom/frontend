import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const boxSize = (width - 48) / 2;

const ScrollViewComponent = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic ScrollView</Text>
        <Text style={styles.subDescription}>
          ScrollView allows scrolling when content is larger than the screen.
        </Text>
        <ScrollView
          style={styles.scrollViewExample}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* 배열 item 10개 생성 */}
          {[...Array(10)].map((_, index) => (
            <View key={index} style={styles.scrollItem}>
              <Text style={styles.scrollItemText}>Item {index + 1}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Horizontal ScrollView</Text>
        <Text style={styles.subDescription}>
          ScrollView can also scroll horizontally with the horizontal prop.
        </Text>
        <ScrollView
          horizontal
          style={styles.horizontalScrollView}
          contentContainerStyle={styles.horizontalScrollContent}
          showsHorizontalScrollIndicator={false}
        >
          {[...Array(10)].map((_, index) => (
            <View key={index} style={styles.horizontalScrollItem}>
              <Text style={styles.scrollItemText}>Item {index + 1}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>ScrollView with Paging</Text>
        <Text style={styles.subDescription}>
          ScrollView can implement paging with pagingEnabled prop.
        </Text>
        <ScrollView
          horizontal
          pagingEnabled
          style={styles.pagingScrollView}
          contentContainerStyle={styles.pagingScrollContent}
          showsHorizontalScrollIndicator={false}
        >
          {[...Array(5)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.pagingItem,
                { backgroundColor: getRandomColor(index) },
              ]}
            >
              <Text style={styles.pagingItemText}>Page {index + 1}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>ScrollView Properties</Text>
        <Text style={styles.subDescription}>
          Common ScrollView properties include:
        </Text>
        <View style={styles.propertiesList}>
          <Text style={styles.propertyItem}>
            • showsVerticalScrollIndicator
          </Text>
          <Text style={styles.propertyItem}>
            • showsHorizontalScrollIndicator
          </Text>
          <Text style={styles.propertyItem}>• scrollEnabled</Text>
          <Text style={styles.propertyItem}>• pagingEnabled</Text>
          <Text style={styles.propertyItem}>• contentContainerStyle</Text>
          <Text style={styles.propertyItem}>• keyboardDismissMode</Text>
          <Text style={styles.propertyItem}>• keyboardShouldPersistTaps</Text>
        </View>
      </View>
    </ScrollView>
  );
};

// Helper function to generate random colors for paging example
const getRandomColor = (index) => {
  const colors = [
    "#3498db",
    "#2ecc71",
    "#e74c3c",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
    "#d35400",
    "#c0392b",
    "#16a085",
    "#8e44ad",
  ];
  return colors[index % colors.length];
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
  scrollViewExample: {
    height: 200,
    backgroundColor: "#333",
    borderRadius: 4,
  },
  scrollViewContent: {
    padding: 10,
  },
  scrollItem: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 4,
    marginBottom: 10,
  },
  scrollItemText: {
    color: "#eee",
    fontSize: 16,
  },
  horizontalScrollView: {
    height: 100,
    backgroundColor: "#333",
    borderRadius: 4,
  },
  horizontalScrollContent: {
    padding: 10,
  },
  horizontalScrollItem: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 4,
    marginRight: 10,
    height: 80,
    justifyContent: "center",
    width: 120,
  },
  pagingScrollView: {
    height: 200,
    backgroundColor: "#333",
    borderRadius: 4,
  },
  pagingItem: {
    width: width - 32,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  pagingItemText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
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

export default ScrollViewComponent;
