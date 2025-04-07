/**
 * 다크모드 관리 스크립트
 *
 * 이 스크립트는 다크모드와 라이트모드 간의 전환 기능을 제공합니다.
 * localStorage를 사용하여 사용자의 테마 선택을 저장합니다.
 */

// DOM 요소
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const html = document.documentElement;

// 시스템 선호 다크모드 감지
const prefersDarkMode = window.matchMedia(
  "(prefers-color-scheme: dark)"
).matches;

// 로컬 스토리지에서 저장된 테마 가져오기 또는 기본값 설정
const savedTheme =
  localStorage.getItem("theme") || (prefersDarkMode ? "dark" : "light");

// 저장된 테마 적용
html.setAttribute("data-theme", savedTheme);
updateThemeIcon(savedTheme);

// 테마 전환 버튼 이벤트 리스너
themeToggle.addEventListener("click", function () {
  // 현재 테마 확인
  const currentTheme = html.getAttribute("data-theme") || "dark";

  // 테마 전환
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  // 새 테마 적용
  html.setAttribute("data-theme", newTheme);

  // 로컬 스토리지에 테마 저장
  localStorage.setItem("theme", newTheme);

  // 아이콘 업데이트
  updateThemeIcon(newTheme);

  // 사용자 경험 향상을 위한 트랜지션 효과
  document.body.style.transition =
    "background-color 0.3s ease, color 0.3s ease";
});

// 테마에 맞게 아이콘 업데이트 함수
function updateThemeIcon(theme) {
  if (theme === "dark") {
    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");
  } else {
    themeIcon.classList.remove("fa-sun");
    themeIcon.classList.add("fa-moon");
  }
}

// 시스템 테마 변경 감지 및 자동 적용 (사용자가 수동으로 설정하지 않은 경우에만)
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      const newTheme = e.matches ? "dark" : "light";
      html.setAttribute("data-theme", newTheme);
      updateThemeIcon(newTheme);
    }
  });
