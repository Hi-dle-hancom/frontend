import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const TextComponent = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic Text</Text>
        <Text style={styles.normalText}>This is basic text.</Text>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Styled Text</Text>
        <Text style={styles.styledText}>
          This text has styles applied to it, such as color, size, and font
          weight.
        </Text>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Nested Text</Text>
        <Text style={styles.normalText}>
          This text contains <Text style={styles.nestedText}>nested text</Text>{" "}
          within it.
        </Text>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Text Alignment</Text>
        <Text style={styles.alignLeft}>Left aligned</Text>
        <Text style={styles.alignCenter}>Center aligned</Text>
        <Text style={styles.alignRight}>Right aligned</Text>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Limited Lines</Text>
        <Text numberOfLines={2} style={styles.limitedLines}>
          This text is limited to a maximum of 2 lines. If the text exceeds 2
          lines, it will be truncated with an ellipsis (...). This is useful for
          displaying long text in a limited space.
        </Text>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Text Decoration</Text>
        <Text style={styles.underlineText}>Underlined text</Text>
        <Text style={styles.lineThrough}>Strikethrough text</Text>
        <Text style={styles.underlineLineThrough}>
          Text with both underline and strikethrough
        </Text>
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
  normalText: {
    color: "#eee",
  },
  styledText: {
    color: "#e91e63",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  nestedText: {
    color: "#2196f3",
    fontWeight: "bold",
    fontSize: 16,
  },
  alignLeft: {
    textAlign: "left",
    marginBottom: 8,
    color: "#eee",
  },
  alignCenter: {
    textAlign: "center",
    marginBottom: 8,
    color: "#eee",
  },
  alignRight: {
    textAlign: "right",
    marginBottom: 8,
    color: "#eee",
  },
  limitedLines: {
    lineHeight: 20,
    color: "#eee",
  },
  underlineText: {
    textDecorationLine: "underline",
    marginBottom: 8,
    color: "#eee",
  },
  lineThrough: {
    textDecorationLine: "line-through",
    marginBottom: 8,
    color: "#eee",
  },
  underlineLineThrough: {
    textDecorationLine: "underline line-through",
    color: "#eee",
  },
});

export default TextComponent;
