document.addEventListener("DOMContentLoaded", () => {
  // DOM 요소 가져오기
  // 네비게이션 요소
  const navHome = document.getElementById("nav-home");
  const navRegister = document.getElementById("nav-register");
  const navLogin = document.getElementById("nav-login");
  const navProfile = document.getElementById("nav-profile");
  const navLogout = document.getElementById("nav-logout");

  // 섹션 요소
  const homeSection = document.getElementById("home-section");
  const registerSection = document.getElementById("register-section");
  const loginSection = document.getElementById("login-section");
  const profileSection = document.getElementById("profile-section");
  const editProfileSection = document.getElementById("edit-profile-section");
  const changePasswordSection = document.getElementById(
    "change-password-section"
  );

  // 폼 요소
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  const editProfileForm = document.getElementById("edit-profile-form");
  const changePasswordForm = document.getElementById("change-password-form");

  // 버튼 요소
  const homeRegisterBtn = document.getElementById("home-register-btn");
  const homeLoginBtn = document.getElementById("home-login-btn");
  const registerToLogin = document.getElementById("register-to-login");
  const loginToRegister = document.getElementById("login-to-register");
  const editProfileBtn = document.getElementById("edit-profile-btn");
  const changePasswordBtn = document.getElementById("change-password-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const cancelPasswordBtn = document.getElementById("cancel-password-btn");

  // 프로필 요소
  const profileUsername = document.getElementById("profile-username");
  const profileEmail = document.getElementById("profile-email");
  const profileFullname = document.getElementById("profile-fullname");
  const profileCreated = document.getElementById("profile-created");

  // 메시지 요소
  const messageContainer = document.getElementById("message-container");
  const messageContent = document.getElementById("message-content");

  // 기본 API URL
  const API_URL = "/api";

  // 인증 상태 확인 및 UI 업데이트
  function checkAuthState() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (token && user) {
      // 로그인 상태
      navHome.classList.remove("active");
      navRegister.classList.add("hidden");
      navLogin.classList.add("hidden");
      navProfile.classList.remove("hidden");
      navLogout.classList.remove("hidden");

      // 프로필 데이터 채우기
      updateProfileData(user);
    } else {
      // 로그아웃 상태
      navRegister.classList.remove("hidden");
      navLogin.classList.remove("hidden");
      navProfile.classList.add("hidden");
      navLogout.classList.add("hidden");

      // 홈으로 이동
      showSection(homeSection);
      navHome.classList.add("active");
    }
  }

  // 프로필 데이터 업데이트
  function updateProfileData(user) {
    // 프로필 데이터 설정
    profileUsername.textContent = user.username;
    profileEmail.textContent = user.email;
    profileFullname.textContent = user.full_name || "-";

    // 날짜 형식 변환
    if (user.created_at) {
      const date = new Date(user.created_at);
      profileCreated.textContent = date.toLocaleDateString();
    } else {
      profileCreated.textContent = "-";
    }

    // 프로필 수정 폼 초기값 설정
    document.getElementById("edit-email").value = user.email;
    document.getElementById("edit-fullname").value = user.full_name || "";
  }

  // 특정 섹션 표시
  function showSection(section) {
    // 모든 섹션 숨기기
    homeSection.classList.add("hidden");
    registerSection.classList.add("hidden");
    loginSection.classList.add("hidden");
    profileSection.classList.add("hidden");
    editProfileSection.classList.add("hidden");
    changePasswordSection.classList.add("hidden");

    // 선택한 섹션 표시
    section.classList.remove("hidden");
  }

  // 네비게이션 활성화
  function setActiveNav(nav) {
    // 모든 네비게이션 비활성화
    navHome.classList.remove("active");
    navRegister.classList.remove("active");
    navLogin.classList.remove("active");
    navProfile.classList.remove("active");

    // 선택한 네비게이션 활성화
    nav.classList.add("active");
  }

  // 메시지 표시
  function showMessage(message, isError = false) {
    messageContent.textContent = message;
    messageContent.className = isError ? "error-message" : "success-message";
    messageContainer.classList.remove("hidden");

    // 3초 후 메시지 숨기기
    setTimeout(() => {
      messageContainer.classList.add("hidden");
    }, 3000);
  }

  // 인증 토큰 가져오기
  function getAuthHeader() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  // 로그아웃 함수
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    checkAuthState();
    showMessage("Logged out successfully.");
  }

  // 이벤트 리스너 설정

  // 네비게이션 이벤트
  navHome.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(homeSection);
    setActiveNav(navHome);
  });

  navRegister.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(registerSection);
    setActiveNav(navRegister);
  });

  navLogin.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(loginSection);
    setActiveNav(navLogin);
  });

  navProfile.addEventListener("click", (e) => {
    e.preventDefault();
    fetchUserProfile();
    showSection(profileSection);
    setActiveNav(navProfile);
  });

  navLogout.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });

  // 홈 버튼 이벤트
  homeRegisterBtn.addEventListener("click", () => {
    showSection(registerSection);
    setActiveNav(navRegister);
  });

  homeLoginBtn.addEventListener("click", () => {
    showSection(loginSection);
    setActiveNav(navLogin);
  });

  // 폼 간 이동 이벤트
  registerToLogin.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(loginSection);
    setActiveNav(navLogin);
  });

  loginToRegister.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(registerSection);
    setActiveNav(navRegister);
  });

  // 프로필 관련 버튼 이벤트
  editProfileBtn.addEventListener("click", () => {
    showSection(editProfileSection);
  });

  changePasswordBtn.addEventListener("click", () => {
    showSection(changePasswordSection);
  });

  cancelEditBtn.addEventListener("click", () => {
    showSection(profileSection);
  });

  cancelPasswordBtn.addEventListener("click", () => {
    showSection(profileSection);
  });

  // 회원가입 폼 제출 이벤트
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("register-username").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const fullName = document.getElementById("register-fullname").value;

    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred during registration.");
      }

      showMessage("Registration successful. Please login.");
      registerForm.reset();
      showSection(loginSection);
      setActiveNav(navLogin);
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  // 로그인 폼 제출 이벤트
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred during login.");
      }

      // 토큰 및 사용자 정보 저장
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showMessage("Login successful!");
      loginForm.reset();
      checkAuthState();
      fetchUserProfile();
      showSection(profileSection);
      setActiveNav(navProfile);
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  // 사용자 프로필 조회
  async function fetchUserProfile() {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: "GET",
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // 인증 실패 - 로그아웃
          logout();
          throw new Error("Authentication failed. Please login again.");
        }
        const data = await response.json();
        throw new Error(
          data.error || "An error occurred while fetching profile."
        );
      }

      const userData = await response.json();
      localStorage.setItem("user", JSON.stringify(userData));
      updateProfileData(userData);
    } catch (error) {
      showMessage(error.message, true);
    }
  }

  // 프로필 수정 폼 제출 이벤트
  editProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("edit-email").value;
    const fullName = document.getElementById("edit-fullname").value;

    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: getAuthHeader(),
        body: JSON.stringify({
          email,
          full_name: fullName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || "An error occurred while updating profile."
        );
      }

      const userData = await response.json();
      localStorage.setItem("user", JSON.stringify(userData.user));
      updateProfileData(userData.user);
      showMessage("Profile updated successfully.");
      showSection(profileSection);
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  // 비밀번호 변경 폼 제출 이벤트
  changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;

    try {
      const response = await fetch(`${API_URL}/users/password`, {
        method: "PUT",
        headers: getAuthHeader(),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || "An error occurred while changing password."
        );
      }

      changePasswordForm.reset();
      showMessage("Password changed successfully.");
      showSection(profileSection);
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  // 페이지 로드 시 인증 상태 확인
  checkAuthState();
});
