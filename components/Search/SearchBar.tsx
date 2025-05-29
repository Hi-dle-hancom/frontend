import React, { useState } from "react";
import { StyleSheet, TextInput, View, TouchableOpacity } from "react-native";
import { IconSymbol } from "../ui/IconSymbol";
import { ThemedText } from "../ThemedText";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

type SearchBarProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
};

export function SearchBar({
  onSearch,
  placeholder = "목적지를 입력하세요",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const colorScheme = useColorScheme();

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchBar,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ]}
      >
        <IconSymbol
          name="magnifyingglass"
          size={20}
          color={Colors[colorScheme ?? "light"].text}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.input, { color: Colors[colorScheme ?? "light"].text }]}
          placeholder={placeholder}
          placeholderTextColor={Colors[colorScheme ?? "light"].tabIconDefault}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery("")}
            style={styles.clearButton}
          >
            <IconSymbol
              name="xmark.circle.fill"
              size={16}
              color={Colors[colorScheme ?? "light"].tabIconDefault}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    width: "100%",
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
});
