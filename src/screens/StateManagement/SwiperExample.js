import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import Swiper from "react-native-swiper";
import { ScrollView } from "react-native";
const { width } = Dimensions.get("window");

const SwiperExample = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = [
    {
      title: "Swiper Example 1",
      description: "Swipe left to right to see the next slide.",
      color: "#101010",
      image: "https://picsum.photos/id/1/500/300",
    },
    {
      title: "Swiper Example 2",
      description: "This is a card-style swiper with an image.",
      color: "#101010",
      image: "https://picsum.photos/id/10/500/300",
    },
    {
      title: "Swiper Example 3",
      description: "Check the current position through the indicator.",
      color: "#101010",
      image: "https://picsum.photos/id/100/500/300",
    },
    {
      title: "Swiper Example 4",
      description: "You can show various contents as slides.",
      color: "#101010",
      image: "https://picsum.photos/id/1000/500/300",
    },
  ];

  // Manual Swiping Component
  const [manualIndex, setManualIndex] = useState(0);

  const handlePrev = () => {
    if (manualIndex > 0) {
      setManualIndex(manualIndex - 1);
    }
  };

  const handleNext = () => {
    if (manualIndex < slides.length - 1) {
      setManualIndex(manualIndex + 1);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.swiperContainer}>
          <Swiper //Auto Swiper
            style={styles.swiper}
            showsButtons={false}
            loop={true}
            autoplay={true}
            autoplayTimeout={3}
            removeClippedSubviews={false}
            dot={<View style={styles.dot} />}
            activeDot={<View style={styles.activeDot} />}
            paginationStyle={styles.pagination}
            onIndexChanged={(index) => setActiveIndex(index)}
          >
            {slides.map((slide, index) => (
              <View
                key={index}
                style={[styles.slide, { backgroundColor: slide.color }]}
              >
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <Text style={styles.slideDescription}>{slide.description}</Text>
                <Text style={styles.slideIndex}>
                  Slide {index + 1}/{slides.length}
                </Text>
              </View>
            ))}
          </Swiper>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Image Swiper</Text>

        <View style={styles.swiperContainer}>
          <Swiper
            style={styles.swiper}
            showsButtons={true}
            loop={true}
            autoplay={false}
            dot={<View style={styles.dot} />}
            removeClippedSubviews={false}
            activeDot={<View style={styles.activeDot} />}
            paginationStyle={styles.pagination}
            nextButton={<Text style={styles.buttonText}>›</Text>}
            prevButton={<Text style={styles.buttonText}>‹</Text>}
          >
            {slides.map((slide, index) => (
              <View key={index} style={styles.imageSlide}>
                <Image
                  source={{ uri: slide.image }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageTitle}>{slide.title}</Text>
                  <Text style={styles.imageDescription}>
                    {slide.description}
                  </Text>
                </View>
              </View>
            ))}
          </Swiper>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Manual Implementation Swiper</Text>

        <View style={styles.manualContainer}>
          <View
            style={[
              styles.manualSlide,
              { backgroundColor: slides[manualIndex].color },
            ]}
          >
            <Text style={styles.slideTitle}>{slides[manualIndex].title}</Text>
            <Text style={styles.slideDescription}>
              {slides[manualIndex].description}
            </Text>
            <Text style={styles.slideIndex}>
              Slide {manualIndex + 1}/{slides.length}
            </Text>
          </View>

          {/* ---------- Manual Control Swiper ---------- */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.button,
                manualIndex === 0 && styles.disabledButton,
              ]}
              onPress={handlePrev}
              disabled={manualIndex === 0}
            >
              <Text style={styles.controlText}>Previous</Text>
            </TouchableOpacity>

            <View style={styles.indicators}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === manualIndex && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                manualIndex === slides.length - 1 && styles.disabledButton,
              ]}
              onPress={handleNext}
              disabled={manualIndex === slides.length - 1}
            >
              <Text style={styles.controlText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Code Structure:</Text>
        <Text style={styles.codeDescription}>
          1. Use react-native-swiper package{"\n"}
          2. Basic swiper (auto play, loop){"\n"}
          3. Image swiper (include navigation buttons){"\n"}
          4. Manual control swiper (custom controls){"\n"}
          5. Various styling and indicator implementation
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#E0E0E0",
  },
  description: {
    fontSize: 14,
    color: "#B0B0B0",
    marginBottom: 15,
    lineHeight: 20,
  },
  swiperContainer: {
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
  },
  swiper: {},
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  slideDescription: {
    fontSize: 14,
    color: "#E0E0E0",
    textAlign: "center",
    marginBottom: 10,
  },
  slideIndex: {
    fontSize: 12,
    color: "#B0B0B0",
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  pagination: {
    bottom: 10,
  },
  dot: {
    backgroundColor: "#555555",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
  },
  activeDot: {
    backgroundColor: "#FFFFFF",
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 3,
    marginRight: 3,
  },
  imageSlide: {
    flex: 1,
    borderRadius: 8,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  imageTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  imageDescription: {
    fontSize: 12,
    color: "#E0E0E0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "bold",
  },
  manualContainer: {
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
  },
  manualSlide: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#2C2C2C",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: "#1A1A1A",
    opacity: 0.5,
  },
  controlText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#555555",
    marginHorizontal: 3,
  },
  activeIndicator: {
    backgroundColor: "#FFFFFF",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  codeDescription: {
    fontSize: 14,
    color: "#B0B0B0",
    lineHeight: 22,
  },
});

export default SwiperExample;
