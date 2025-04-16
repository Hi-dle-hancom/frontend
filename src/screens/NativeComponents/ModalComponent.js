import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";

// 코드 스니펫 컴포넌트 추가
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

// 편집 가능한 코드 스니펫 컴포넌트 추가
const EditableCodeSnippet = ({ code, onCodeChange, visible, onToggle }) => {
  return (
    <View style={styles.codeSnippetContainer}>
      <TouchableOpacity style={styles.codeToggleButton} onPress={onToggle}>
        <Text style={styles.codeToggleText}>
          {visible ? "Edit Code Close" : "Edit Code Directly"}
        </Text>
      </TouchableOpacity>
      {visible && (
        <View style={styles.editableCodeContainer}>
          <TextInput
            style={styles.editableCodeText}
            value={code}
            onChangeText={onCodeChange}
            multiline
            numberOfLines={15}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}
    </View>
  );
};

const ModalComponent = () => {
  const [basicModalVisible, setBasicModalVisible] = useState(false);
  const [animatedModalVisible, setAnimatedModalVisible] = useState(false);
  const [transparentModalVisible, setTransparentModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // 코드 스니펫 토글 상태
  const [codeVisible1, setCodeVisible1] = useState(false);
  const [codeVisible2, setCodeVisible2] = useState(false);
  const [codeVisible3, setCodeVisible3] = useState(false);
  const [codeVisible4, setCodeVisible4] = useState(false);
  const [editableCodeVisible, setEditableCodeVisible] = useState(false);

  // 사용자 설정
  const [animationType, setAnimationType] = useState("slide");
  const [isTransparent, setIsTransparent] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);

  // 사용자 수정 가능한 코드
  const [editableCode, setEditableCode] = useState("");
  const [parsedAnimationType, setParsedAnimationType] = useState("slide");
  const [parsedTransparent, setParsedTransparent] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [parseError, setParseError] = useState(null);

  // 기본 코드 템플릿 설정
  useEffect(() => {
    const codeTemplate = `import React, { useState } from 'react';
import { View, Modal, Text, TouchableOpacity } from 'react-native';

const MyModal = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text>Open Modal</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="${animationType}"
        transparent={${isTransparent}}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ 
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: ${
            isTransparent ? "'rgba(0, 0, 0, 0.5)'" : "'#101010'"
          }
        }}>
          <View style={{ 
            backgroundColor: '#242423',
            padding: 20,
            borderRadius: 8,
            width: ${isTransparent ? "'80%'" : "'100%'"}
          }}>
            <Text style={{ color: '#eee', fontSize: 18, marginBottom: 10 }}>Custom Modal</Text>
            <Text style={{ color: '#aaa', marginBottom: 20 }}>This is a custom modal with user settings.</Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#2196f3',
                padding: 12,
                borderRadius: 4,
                alignItems: 'center'
              }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};`;
    setEditableCode(codeTemplate);
  }, [animationType, isTransparent]);

  // 사용자 코드 파싱
  const parseUserCode = (code) => {
    setParseError(null);

    try {
      // animationType 파싱
      const animationTypeMatch = code.match(/animationType="([^"]+)"/);
      if (animationTypeMatch && animationTypeMatch[1]) {
        const value = animationTypeMatch[1];
        if (["none", "slide", "fade"].includes(value)) {
          setParsedAnimationType(value);
        } else {
          setParseError(
            `Animation type must be one of "none", "slide", "fade". (Current: ${value})`
          );
        }
      }

      // transparent 파싱
      const transparentMatch = code.match(/transparent=\{([^}]+)\}/);
      if (transparentMatch && transparentMatch[1]) {
        const value = transparentMatch[1].trim();
        if (value === "true" || value === "false") {
          setParsedTransparent(value === "true");
        } else {
          setParseError(
            `Transparency value must be {true} or {false}. (Current: {${value}})`
          );
        }
      }
    } catch (error) {
      setParseError(
        "An error occurred while parsing the code: " + error.message
      );
    }
  };

  // 코드 변경시 파싱 실행
  useEffect(() => {
    if (editableCode) {
      parseUserCode(editableCode);
    }
  }, [editableCode]);

  const handleFormSubmit = () => {
    if (name.trim() === "" || email.trim() === "") {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    Alert.alert("Form Submitted", `Name: ${name}\nEmail: ${email}`);
    setFormModalVisible(false);
    setName("");
    setEmail("");
  };

  // 사용자 설정에 따른 코드 스니펫
  const customModalCode = `import React, { useState } from 'react';
import { View, Modal, Text, TouchableOpacity } from 'react-native';

const MyModal = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text>Open Modal</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="${animationType}"
        transparent={${isTransparent}}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ 
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: ${
            isTransparent ? "'rgba(0, 0, 0, 0.5)'" : "'#101010'"
          }
        }}>
          <View style={{ 
            backgroundColor: '#242423',
            padding: 20,
            borderRadius: 8,
            width: ${isTransparent ? "'80%'" : "'100%'"}
          }}>
            <Text style={{ color: '#eee', fontSize: 18, marginBottom: 10 }}>Custom Modal</Text>
            <Text style={{ color: '#aaa', marginBottom: 20 }}>This is a custom modal with user settings.</Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#2196f3',
                padding: 12,
                borderRadius: 4,
                alignItems: 'center'
              }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};`;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* 사용자 설정 컨트롤 패널 추가 */}
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Modal Component Customize</Text>
        <Text style={styles.subDescription}>
          You can customize the modal component with the following settings:
        </Text>

        <View style={styles.controlPanel}>
          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Animation Type</Text>
            <View style={styles.controlValue}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  animationType === "none" && styles.selectedOptionButton,
                ]}
                onPress={() => setAnimationType("none")}
              >
                <Text style={styles.optionButtonText}>None</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  animationType === "slide" && styles.selectedOptionButton,
                ]}
                onPress={() => setAnimationType("slide")}
              >
                <Text style={styles.optionButtonText}>Slide</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  animationType === "fade" && styles.selectedOptionButton,
                ]}
                onPress={() => setAnimationType("fade")}
              >
                <Text style={styles.optionButtonText}>Fade</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Transparent Background</Text>
            <TouchableOpacity
              style={[
                styles.switchButton,
                isTransparent ? styles.switchButtonOn : styles.switchButtonOff,
              ]}
              onPress={() => setIsTransparent(!isTransparent)}
            >
              <Text style={styles.switchButtonText}>
                {isTransparent ? "On" : "Off"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => setCustomModalVisible(true)}
          >
            <Text style={styles.buttonText}>Preview</Text>
          </TouchableOpacity>
        </View>

        {/* 커스텀 모달 */}
        <Modal
          visible={customModalVisible}
          animationType={animationType}
          transparent={isTransparent}
          onRequestClose={() => setCustomModalVisible(false)}
        >
          <View
            style={[
              styles.customModalContainer,
              isTransparent && styles.transparentBackground,
            ]}
          >
            <View
              style={[
                styles.customModalContent,
                isTransparent && styles.transparentModalContent,
              ]}
            >
              <Text style={styles.modalTitle}>Custom Modal</Text>
              <Text style={styles.modalText}>
                Animation Type: {animationType}
                {"\n"}
                Transparent Background: {isTransparent ? "On" : "Off"}
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setCustomModalVisible(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <CodeSnippet
          code={customModalCode}
          visible={codeVisible1}
          onToggle={() => setCodeVisible1(!codeVisible1)}
        />
      </View>

      {/* 사용자 직접 코드 편집 영역 */}
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Edit Code Directly</Text>
        <Text style={styles.subDescription}>
          You can edit the code directly and preview the result. Modify the
          animationType and transparent values.
        </Text>

        <EditableCodeSnippet
          code={editableCode}
          onCodeChange={setEditableCode}
          visible={editableCodeVisible}
          onToggle={() => setEditableCodeVisible(!editableCodeVisible)}
        />

        {parseError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{parseError}</Text>
          </View>
        )}

        <View style={styles.parsedValuesContainer}>
          <Text style={styles.parsedValuesTitle}>Detected Values:</Text>
          <View style={styles.parsedValue}>
            <Text style={styles.parsedLabel}>animationType:</Text>
            <Text style={styles.parsedValueText}>{parsedAnimationType}</Text>
          </View>
          <View style={styles.parsedValue}>
            <Text style={styles.parsedLabel}>transparent:</Text>
            <Text style={styles.parsedValueText}>
              {parsedTransparent ? "true" : "false"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => setUserModalVisible(true)}
        >
          <Text style={styles.buttonText}>Preview</Text>
        </TouchableOpacity>

        {/* 사용자 코드로 생성된 모달 */}
        <Modal
          visible={userModalVisible}
          animationType={parsedAnimationType}
          transparent={parsedTransparent}
          onRequestClose={() => setUserModalVisible(false)}
        >
          <View
            style={[
              styles.customModalContainer,
              parsedTransparent && styles.transparentBackground,
            ]}
          >
            <View
              style={[
                styles.customModalContent,
                parsedTransparent && styles.transparentModalContent,
              ]}
            >
              <Text style={styles.modalTitle}>User-Defined Modal</Text>
              <Text style={styles.modalText}>
                Animation Type: {parsedAnimationType}
                {"\n"}
                Transparent Background: {parsedTransparent ? "On" : "Off"}
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setUserModalVisible(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Basic Modal</Text>
        <Text style={styles.subDescription}>
          A simple modal that appears over the current screen.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setBasicModalVisible(true)}
        >
          <Text style={styles.buttonText}>Show Basic Modal</Text>
        </TouchableOpacity>

        <Modal
          visible={basicModalVisible}
          onRequestClose={() => setBasicModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Basic Modal</Text>
              <Text style={styles.modalText}>
                This is a basic modal that covers the entire screen. Press the
                button below to close it.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setBasicModalVisible(false)}
              >
                <Text style={styles.buttonText}>Close Modal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <CodeSnippet
          code={`import React, { useState } from 'react';
import { View, Modal, Text, TouchableOpacity } from 'react-native';

const BasicModalExample = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text>Show Basic Modal</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, padding: 16, backgroundColor: '#101010', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#242423', padding: 20, borderRadius: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#eee', marginBottom: 16 }}>
              Basic Modal
            </Text>
            <Text style={{ fontSize: 16, color: '#aaa', marginBottom: 20 }}>
              This is a basic modal that covers the entire screen.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#2196f3', padding: 12, borderRadius: 4, alignItems: 'center' }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#fff', fontSize: 16 }}>Close Modal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};`}
          visible={codeVisible2}
          onToggle={() => setCodeVisible2(!codeVisible2)}
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Animated Modal</Text>
        <Text style={styles.subDescription}>
          A modal with animation when it appears and disappears.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setAnimatedModalVisible(true)}
        >
          <Text style={styles.buttonText}>Show Animated Modal</Text>
        </TouchableOpacity>

        <Modal
          visible={animatedModalVisible}
          animationType="slide"
          onRequestClose={() => setAnimatedModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Animated Modal</Text>
              <Text style={styles.modalText}>
                This modal slides up from the bottom of the screen. It uses the
                animationType prop set to "slide".
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setAnimatedModalVisible(false)}
              >
                <Text style={styles.buttonText}>Close Modal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <CodeSnippet
          code={`import React, { useState } from 'react';
import { View, Modal, Text, TouchableOpacity } from 'react-native';

const AnimatedModalExample = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text>Show Animated Modal</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, padding: 16, backgroundColor: '#101010', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#242423', padding: 20, borderRadius: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#eee', marginBottom: 16 }}>
              Animated Modal
            </Text>
            <Text style={{ fontSize: 16, color: '#aaa', marginBottom: 20 }}>
              This modal slides up from the bottom of the screen.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#2196f3', padding: 12, borderRadius: 4, alignItems: 'center' }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#fff', fontSize: 16 }}>Close Modal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};`}
          visible={codeVisible3}
          onToggle={() => setCodeVisible3(!codeVisible3)}
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Transparent Modal</Text>
        <Text style={styles.subDescription}>
          A modal with a transparent background that shows content as a popup.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setTransparentModalVisible(true)}
        >
          <Text style={styles.buttonText}>Show Transparent Modal</Text>
        </TouchableOpacity>

        <Modal
          visible={transparentModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setTransparentModalVisible(false)}
        >
          <View style={styles.transparentModalContainer}>
            <View style={styles.transparentModalContent}>
              <Text style={styles.modalTitle}>Transparent Modal</Text>
              <Text style={styles.modalText}>
                This modal has a transparent background with a semi-transparent
                overlay. It appears as a popup in the center of the screen.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setTransparentModalVisible(false)}
              >
                <Text style={styles.buttonText}>Close Modal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <CodeSnippet
          code={`import React, { useState } from 'react';
import { View, Modal, Text, TouchableOpacity } from 'react-native';

const TransparentModalExample = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text>Show Transparent Modal</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: 'rgba(0, 0, 0, 0.5)' 
        }}>
          <View style={{ 
            backgroundColor: '#242423', 
            padding: 20, 
            borderRadius: 8, 
            width: '80%' 
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#eee', marginBottom: 16 }}>
              Transparent Modal
            </Text>
            <Text style={{ fontSize: 16, color: '#aaa', marginBottom: 20 }}>
              This modal has a transparent background with a semi-transparent overlay.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#2196f3', padding: 12, borderRadius: 4, alignItems: 'center' }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#fff', fontSize: 16 }}>Close Modal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};`}
          visible={codeVisible4}
          onToggle={() => setCodeVisible4(!codeVisible4)}
        />
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Form Modal</Text>
        <Text style={styles.subDescription}>
          A modal containing a form for user input.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setFormModalVisible(true)}
        >
          <Text style={styles.buttonText}>Show Form Modal</Text>
        </TouchableOpacity>

        <Modal
          visible={formModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setFormModalVisible(false)}
        >
          <View style={styles.transparentModalContainer}>
            <View style={styles.formModalContent}>
              <Text style={styles.modalTitle}>Contact Form</Text>

              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#777"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#777"
                keyboardType="email-address"
              />

              <View style={styles.formButtonsContainer}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => setFormModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.submitButton]}
                  onPress={handleFormSubmit}
                >
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Modal Properties</Text>
        <Text style={styles.subDescription}>
          Common Modal properties include:
        </Text>
        <View style={styles.propertiesList}>
          <Text style={styles.propertyItem}>
            • visible - Controls whether the modal is visible
          </Text>
          <Text style={styles.propertyItem}>
            • animationType - Type of animation ("none", "slide", "fade")
          </Text>
          <Text style={styles.propertyItem}>
            • transparent - Whether the modal fills the entire view
          </Text>
          <Text style={styles.propertyItem}>
            • onRequestClose - Called when back button is pressed
          </Text>
          <Text style={styles.propertyItem}>
            • onShow - Called when the modal has been shown
          </Text>
          <Text style={styles.propertyItem}>
            • hardwareAccelerated - Uses hardware acceleration
          </Text>
          <Text style={styles.propertyItem}>
            • statusBarTranslucent - Content renders under the status bar
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
  button: {
    backgroundColor: "#2196f3",
    padding: 15,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#101010",
    padding: 16,
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#242423",
    padding: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#eee",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    color: "#aaa",
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  transparentModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  transparentModalContent: {
    backgroundColor: "#242423",
    padding: 20,
    borderRadius: 8,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formModalContent: {
    backgroundColor: "#242423",
    padding: 20,
    borderRadius: 8,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: "#eee",
  },
  textInput: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 4,
    color: "#eee",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#444",
  },
  formButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  formButton: {
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#aaa",
  },
  submitButton: {
    backgroundColor: "#2196f3",
  },
  cancelButtonText: {
    color: "#aaa",
    fontSize: 16,
    fontWeight: "500",
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

  // 코드 스니펫 스타일
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

  // 사용자 설정 패널 스타일
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
  optionButton: {
    backgroundColor: "#444",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 2,
    alignItems: "center",
  },
  selectedOptionButton: {
    backgroundColor: "#2196f3",
  },
  optionButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  switchButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
    width: 80,
  },
  switchButtonOn: {
    backgroundColor: "#2196f3",
  },
  switchButtonOff: {
    backgroundColor: "#444",
  },
  switchButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  previewButton: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 10,
  },

  // 커스텀 모달 스타일
  customModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#101010",
  },
  transparentBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  customModalContent: {
    backgroundColor: "#242423",
    padding: 20,
    borderRadius: 8,
    width: "100%",
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transparentModalContent: {
    width: "80%",
  },

  // 사용자 직접 코드 편집 영역 스타일
  editableCodeContainer: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 4,
  },
  editableCodeText: {
    color: "#eee",
    fontSize: 12,
  },

  // 사용자 직접 코드 편집 영역 스타일
  errorContainer: {
    backgroundColor: "#ff3333",
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  errorText: {
    color: "#fff",
    fontSize: 12,
  },

  // 사용자 직접 코드 편집 영역 스타일
  parsedValuesContainer: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  parsedValuesTitle: {
    color: "#eee",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  parsedValue: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  parsedLabel: {
    color: "#aaa",
    fontSize: 12,
  },
  parsedValueText: {
    color: "#eee",
    fontSize: 12,
  },
});

export default ModalComponent;
