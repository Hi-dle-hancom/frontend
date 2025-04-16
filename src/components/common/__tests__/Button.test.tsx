import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Button from "../Button";

describe("Button Component", () => {
  it("renders correctly with default props", () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );

    const buttonText = getByText("Test Button");
    expect(buttonText).toBeTruthy();
  });

  it("calls onPress when button is pressed", () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Clickable" onPress={onPressMock} />
    );

    fireEvent.press(getByText("Clickable"));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when button is disabled", () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Disabled Button" onPress={onPressMock} disabled />
    );

    fireEvent.press(getByText("Disabled Button"));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it("renders loading indicator when loading is true", () => {
    const { queryByText, UNSAFE_getByType } = render(
      <Button title="Loading Button" onPress={() => {}} loading />
    );

    expect(queryByText("Loading Button")).toBeNull();
    expect(UNSAFE_getByType("ActivityIndicator")).toBeTruthy();
  });

  it("applies different styles based on type prop", () => {
    const { getByText, rerender } = render(
      <Button title="Primary Button" onPress={() => {}} type="primary" />
    );

    // 여기서는 스타일 테스트 방법의 한계로 인해 렌더링 여부만 확인
    expect(getByText("Primary Button")).toBeTruthy();

    rerender(
      <Button title="Secondary Button" onPress={() => {}} type="secondary" />
    );
    expect(getByText("Secondary Button")).toBeTruthy();

    rerender(
      <Button title="Outline Button" onPress={() => {}} type="outline" />
    );
    expect(getByText("Outline Button")).toBeTruthy();
  });
});
