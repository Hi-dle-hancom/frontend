import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from "react-native";

const FlatListComponent = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [data, setData] = useState(generateData(20));

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate network request
    setTimeout(() => {
      setData(generateData(20));
      setRefreshing(false);
    }, 2000);
  };

  const loadMoreData = () => {
    if (loadingMore) return;

    setLoadingMore(true);
    // Simulate network request
    setTimeout(() => {
      const newData = [...data, ...generateData(10, data.length)];
      setData(newData);
      setLoadingMore(false);
    }, 1500);
  };

  const renderBasicItem = ({ item }) => (
    <View style={styles.basicItem}>
      <Text style={styles.itemTitle}>Item {item.id}</Text>
      <Text style={styles.itemDescription}>{item.description}</Text>
    </View>
  );

  const renderComplexItem = ({ item }) => (
    <TouchableOpacity style={styles.complexItem}>
      <Image
        source={{
          uri: `https://randomuser.me/api/portraits/men/${
            parseInt(item.id) % 100
          }.jpg`,
        }}
        style={styles.avatar}
      />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#2196f3" />
        <Text style={styles.loadingText}>Loading more items...</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic FlatList</Text>
        <Text style={styles.subDescription}>
          A simple implementation of FlatList with minimal configuration.
        </Text>
        <FlatList
          data={data.slice(0, 5)}
          renderItem={renderBasicItem}
          keyExtractor={(item) => item.id}
          style={styles.listContainer}
          nestedScrollEnabled={true}
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>FlatList with Pull to Refresh</Text>
        <Text style={styles.subDescription}>
          FlatList with pull-to-refresh functionality using RefreshControl.
        </Text>
        <FlatList
          data={data.slice(0, 5)}
          renderItem={renderBasicItem}
          keyExtractor={(item) => item.id}
          style={styles.listContainer}
          nestedScrollEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2196f3"]}
              tintColor="#2196f3"
              title="Pull to refresh"
              titleColor="#eee"
            />
          }
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>FlatList with Complex Items</Text>
        <Text style={styles.subDescription}>
          FlatList with more complex item rendering and infinite scrolling.
        </Text>
        <FlatList
          data={data}
          renderItem={renderComplexItem}
          keyExtractor={(item) => item.id}
          style={styles.listContainer}
          nestedScrollEnabled={true}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          initialNumToRender={10}
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>FlatList Properties</Text>
        <Text style={styles.subDescription}>
          Common FlatList properties include:
        </Text>
        <View style={styles.propertiesList}>
          <Text style={styles.propertyItem}>
            • data - Array of data for the list
          </Text>
          <Text style={styles.propertyItem}>
            • renderItem - Function to render each item
          </Text>
          <Text style={styles.propertyItem}>
            • keyExtractor - Function to extract a unique key
          </Text>
          <Text style={styles.propertyItem}>
            • horizontal - Render items horizontally
          </Text>
          <Text style={styles.propertyItem}>
            • numColumns - Multiple columns support
          </Text>
          <Text style={styles.propertyItem}>
            • onEndReached - Called when end of list is reached
          </Text>
          <Text style={styles.propertyItem}>
            • ListHeaderComponent - Component at the top
          </Text>
          <Text style={styles.propertyItem}>
            • ListFooterComponent - Component at the bottom
          </Text>
          <Text style={styles.propertyItem}>
            • ItemSeparatorComponent - Component between items
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

// Helper function to generate mock data
const generateData = (count, startIndex = 0) => {
  return Array(count)
    .fill()
    .map((_, index) => ({
      id: `${startIndex + index + 1}`,
      title: `Item ${startIndex + index + 1}`,
      description: `This is a description for item ${startIndex + index + 1}`,
    }));
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
  basicItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  complexItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#eee",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: "#aaa",
  },
  loadingFooter: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#aaa",
    marginLeft: 8,
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

export default FlatListComponent;
