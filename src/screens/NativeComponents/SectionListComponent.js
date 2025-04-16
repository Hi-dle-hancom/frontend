import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ScrollView,
} from "react-native";

const SectionListComponent = () => {
  // Sample data for SectionList
  const DATA = [
    {
      title: "Fruits",
      data: ["Apple", "Banana", "Orange", "Strawberry", "Grapes"],
    },
    {
      title: "Vegetables",
      data: ["Carrot", "Broccoli", "Spinach", "Tomato", "Cucumber"],
    },
    {
      title: "Dairy",
      data: ["Milk", "Cheese", "Yogurt", "Butter", "Cream"],
    },
    {
      title: "Grains",
      data: ["Rice", "Wheat", "Oats", "Barley", "Corn"],
    },
  ];

  // Sample data for sticky headers example
  const CONTACTS = [
    {
      title: "A",
      data: ["Alice", "Adam", "Aaron", "Amy"],
    },
    {
      title: "B",
      data: ["Bob", "Ben", "Barbara", "Bella"],
    },
    {
      title: "C",
      data: ["Charlie", "Cathy", "Chris", "Chloe"],
    },
    {
      title: "D",
      data: ["David", "Diana", "Daniel", "Donna"],
    },
    {
      title: "E",
      data: ["Edward", "Emma", "Ethan", "Emily"],
    },
  ];

  const renderBasicItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item}</Text>
    </View>
  );

  const renderBasicHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderContactItem = ({ item }) => (
    <TouchableOpacity style={styles.contactItem}>
      <View style={styles.contactAvatar}>
        <Text style={styles.contactInitial}>{item.charAt(0)}</Text>
      </View>
      <Text style={styles.contactName}>{item}</Text>
    </TouchableOpacity>
  );

  const renderContactHeader = ({ section: { title } }) => (
    <View style={styles.contactSectionHeader}>
      <Text style={styles.contactSectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic SectionList</Text>
        <Text style={styles.subDescription}>
          A simple implementation of SectionList with sections and items.
        </Text>
        <SectionList
          sections={DATA}
          keyExtractor={(item, index) => item + index}
          renderItem={renderBasicItem}
          renderSectionHeader={renderBasicHeader}
          style={styles.listContainer}
          nestedScrollEnabled={true}
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>SectionList with Sticky Headers</Text>
        <Text style={styles.subDescription}>
          SectionList with sticky headers that remain at the top during
          scrolling.
        </Text>
        <SectionList
          sections={CONTACTS}
          keyExtractor={(item, index) => item + index}
          renderItem={renderContactItem}
          renderSectionHeader={renderContactHeader}
          stickySectionHeadersEnabled={true}
          style={styles.listContainer}
          nestedScrollEnabled={true}
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>SectionList Properties</Text>
        <Text style={styles.subDescription}>
          Common SectionList properties include:
        </Text>
        <View style={styles.propertiesList}>
          <Text style={styles.propertyItem}>
            • sections - Array of section objects
          </Text>
          <Text style={styles.propertyItem}>
            • renderItem - Function to render each item
          </Text>
          <Text style={styles.propertyItem}>
            • renderSectionHeader - Function to render section headers
          </Text>
          <Text style={styles.propertyItem}>
            • renderSectionFooter - Function to render section footers
          </Text>
          <Text style={styles.propertyItem}>
            • stickySectionHeadersEnabled - Makes headers stick to the top
          </Text>
          <Text style={styles.propertyItem}>
            • ItemSeparatorComponent - Component between items
          </Text>
          <Text style={styles.propertyItem}>
            • SectionSeparatorComponent - Component between sections
          </Text>
          <Text style={styles.propertyItem}>
            • ListHeaderComponent - Component at the top of the list
          </Text>
          <Text style={styles.propertyItem}>
            • ListFooterComponent - Component at the bottom of the list
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
  listContainer: {
    backgroundColor: "#333",
    borderRadius: 4,
    maxHeight: 300,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  itemText: {
    fontSize: 16,
    color: "#eee",
  },
  sectionHeader: {
    padding: 10,
    backgroundColor: "#444",
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#eee",
  },
  contactItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    flexDirection: "row",
    alignItems: "center",
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2196f3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  contactInitial: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  contactName: {
    fontSize: 16,
    color: "#eee",
  },
  contactSectionHeader: {
    padding: 10,
    backgroundColor: "#3a3a3a",
  },
  contactSectionHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#eee",
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

export default SectionListComponent;
