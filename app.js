document.addEventListener("DOMContentLoaded", () => {
  // 상태 관리
  const state = {
    currentSection: "home-section",
    isLoggedIn: false,
    token: localStorage.getItem("token"),
    user: JSON.parse(localStorage.getItem("user") || "null"),
    theme: localStorage.getItem("theme") || "dark",
    usersData: {
      users: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    },
  };

  // UI 요소
  const ui = {
    sections: {
      home: document.getElementById("home-section"),
      register: document.getElementById("register-section"),
      login: document.getElementById("login-section"),
      profile: document.getElementById("profile-section"),
      password: document.getElementById("password-section"),
      users: document.getElementById("users-section"),
    },
    nav: {
      home: document.getElementById("nav-home"),
      register: document.getElementById("nav-register"),
      login: document.getElementById("nav-login"),
      profile: document.getElementById("nav-profile"),
      logout: document.getElementById("nav-logout"),
      users: document.getElementById("nav-users"),
    },
    forms: {
      register: document.getElementById("register-form"),
      login: document.getElementById("login-form"),
      profile: document.getElementById("profile-form"),
      password: document.getElementById("password-form"),
      avatar: document.getElementById("avatar-form"),
    },
    themeToggle: document.getElementById("theme-toggle"),
    passwordStrength: document.getElementById("password-strength"),
    usersList: document.getElementById("users-list"),
    userSearch: document.getElementById("user-search"),
    paginationControls: document.getElementById("pagination-controls"),
    messageContainer: document.getElementById("message-container"),
    avatarPreview: document.getElementById("avatar-preview"),
  };

  // 테마 초기화
  function initTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    if (ui.themeToggle) {
      ui.themeToggle.textContent = state.theme === "dark" ? "☀️" : "🌙";
    }
  }

  // 테마 토글
  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", state.theme);
    initTheme();
  }

  // 섹션 표시 함수
  function showSection(sectionId) {
    // 모든 섹션 숨기기
    Object.values(ui.sections).forEach((section) => {
      if (section) section.style.display = "none";
    });

    // 선택한 섹션 표시
    if (ui.sections[sectionId]) {
      ui.sections[sectionId].style.display = "block";
      state.currentSection = `${sectionId}-section`;
    }

    // 현재 섹션에 따라 추가 작업
    if (sectionId === "profile" && state.user) {
      fillProfileForm();
    } else if (sectionId === "users") {
      loadUsers();
    }
  }

  // 네비게이션 상태 업데이트
  function updateNavigation() {
    // 로그인 상태에 따라 메뉴 표시/숨김
    if (state.isLoggedIn) {
      if (ui.nav.register) ui.nav.register.style.display = "none";
      if (ui.nav.login) ui.nav.login.style.display = "none";
      if (ui.nav.profile) ui.nav.profile.style.display = "block";
      if (ui.nav.logout) ui.nav.logout.style.display = "block";
      if (ui.nav.users) ui.nav.users.style.display = "block";
    } else {
      if (ui.nav.register) ui.nav.register.style.display = "block";
      if (ui.nav.login) ui.nav.login.style.display = "block";
      if (ui.nav.profile) ui.nav.profile.style.display = "none";
      if (ui.nav.logout) ui.nav.logout.style.display = "none";
      if (ui.nav.users) ui.nav.users.style.display = "none";

      // 로그인 되지 않은 상태에서 로그인이 필요한 섹션이면 홈으로 리다이렉트
      if (
        state.currentSection === "profile-section" ||
        state.currentSection === "password-section" ||
        state.currentSection === "users-section"
      ) {
        showSection("home");
      }
    }
  }

  // 메시지 표시 함수 (추가된 타입별 스타일)
  function showMessage(message, type = "info") {
    const messageContainer = ui.messageContainer;

    if (!messageContainer) return;

    messageContainer.textContent = message;
    messageContainer.className = "message-container";
    messageContainer.classList.add(`message-${type}`);
    messageContainer.style.display = "block";

    // 5초 후 메시지 자동 제거
    setTimeout(() => {
      messageContainer.style.display = "none";
    }, 5000);
  }

  // 로그인 상태 확인
  function checkLoginStatus() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (token && user) {
      state.isLoggedIn = true;
      state.token = token;
      state.user = user;
    } else {
      state.isLoggedIn = false;
      state.token = null;
      state.user = null;
    }

    updateNavigation();
  }

  // 프로필 양식 채우기
  function fillProfileForm() {
    if (!state.user || !ui.forms.profile) return;

    document.getElementById("profile-username").textContent =
      state.user.username || "";
    document.getElementById("profile-email").value = state.user.email || "";
    document.getElementById("profile-fullname").value =
      state.user.full_name || "";

    // 아바타 미리보기 갱신
    if (ui.avatarPreview) {
      if (state.user.avatar_url) {
        ui.avatarPreview.src = state.user.avatar_url;
      } else {
        ui.avatarPreview.src =
          "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
      }
    }
  }

  // 비밀번호 강도 측정
  function updatePasswordStrength(password) {
    if (!ui.passwordStrength) return;

    let strength = 0;
    let feedback = "";

    // 길이 검사
    if (password.length >= 8) {
      strength += 1;
    }

    // 대문자 검사
    if (/[A-Z]/.test(password)) {
      strength += 1;
    }

    // 특수문자 검사
    if (/[!@#$%^&*]/.test(password)) {
      strength += 1;
    }

    // 숫자 검사
    if (/[0-9]/.test(password)) {
      strength += 1;
    }

    // 강도에 따른 피드백
    if (password.length === 0) {
      ui.passwordStrength.className = "password-strength";
      ui.passwordStrength.textContent = "";
    } else if (strength === 0 || strength === 1) {
      ui.passwordStrength.className = "password-strength weak";
      ui.passwordStrength.textContent = "Weak";
    } else if (strength === 2) {
      ui.passwordStrength.className = "password-strength medium";
      ui.passwordStrength.textContent = "Medium";
    } else if (strength === 3) {
      ui.passwordStrength.className = "password-strength strong";
      ui.passwordStrength.textContent = "Strong";
    } else {
      ui.passwordStrength.className = "password-strength very-strong";
      ui.passwordStrength.textContent = "Very Strong";
    }
  }

  // API 호출 함수
  async function api(
    endpoint,
    method = "GET",
    data = null,
    isFormData = false
  ) {
    const url = `/api/${endpoint}`;

    const headers = {};

    if (state.token) {
      headers["Authorization"] = `Bearer ${state.token}`;
    }

    if (!isFormData && method !== "GET" && data) {
      headers["Content-Type"] = "application/json";
    }

    const options = {
      method,
      headers,
    };

    if (data) {
      if (method !== "GET") {
        options.body = isFormData ? data : JSON.stringify(data);
      }
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 사용자 등록
  async function registerUser(userData) {
    const result = await api("users/register", "POST", userData);

    if (result.success) {
      showMessage("Registered successfully. You can now login.", "success");
      ui.forms.register.reset();
      showSection("login");
    } else {
      showMessage(result.error, "error");
    }
  }

  // 로그인
  async function loginUser(credentials) {
    const result = await api("users/login", "POST", credentials);

    if (result.success) {
      state.isLoggedIn = true;
      state.token = result.data.token;
      state.user = result.data.user;

      localStorage.setItem("token", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));

      updateNavigation();
      showMessage("Logged in successfully.", "success");
      showSection("profile");
    } else {
      showMessage(result.error, "error");
    }
  }

  // 로그아웃
  function logoutUser() {
    state.isLoggedIn = false;
    state.token = null;
    state.user = null;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    updateNavigation();
    showMessage("Logged out successfully.", "info");
    showSection("home");
  }

  // 프로필 업데이트
  async function updateProfile(profileData) {
    const result = await api("users/profile", "PUT", profileData);

    if (result.success) {
      state.user = result.data.user;
      localStorage.setItem("user", JSON.stringify(result.data.user));

      showMessage("Profile updated successfully.", "success");
      fillProfileForm();
    } else {
      showMessage(result.error, "error");
    }
  }

  // 비밀번호 변경
  async function changePassword(passwordData) {
    const result = await api("users/password", "PUT", passwordData);

    if (result.success) {
      showMessage("Password changed successfully.", "success");
      ui.forms.password.reset();
    } else {
      showMessage(result.error, "error");
    }
  }

  // 아바타 업로드
  async function uploadAvatar(formData) {
    const result = await api("users/avatar", "POST", formData, true);

    if (result.success) {
      state.user = result.data.user;
      localStorage.setItem("user", JSON.stringify(result.data.user));

      showMessage("Avatar uploaded successfully.", "success");
      fillProfileForm();
    } else {
      showMessage(result.error, "error");
    }
  }

  // 사용자 목록 로드
  async function loadUsers(page = 1, search = "") {
    if (!state.isLoggedIn) return;

    const endpoint = `users?page=${page}&limit=10${
      search ? `&search=${encodeURIComponent(search)}` : ""
    }`;
    const result = await api(endpoint);

    if (result.success) {
      state.usersData = result.data;
      renderUsers();
    } else {
      showMessage(result.error, "error");
    }
  }

  // 사용자 목록 렌더링
  function renderUsers() {
    if (!ui.usersList) return;

    // 목록 초기화
    ui.usersList.innerHTML = "";

    if (state.usersData.users.length === 0) {
      ui.usersList.innerHTML = '<div class="empty-state">No users found</div>';
      return;
    }

    // 사용자 카드 생성
    state.usersData.users.forEach((user) => {
      const userCard = document.createElement("div");
      userCard.className = "user-card";

      const avatar =
        user.avatar_url ||
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

      userCard.innerHTML = `
        <div class="user-avatar">
          <img src="${avatar}" alt="${user.username}">
        </div>
        <div class="user-info">
          <h3>${user.username}</h3>
          <p>${user.full_name || ""}</p>
          <p>${user.email}</p>
          <p class="user-joined">Joined: ${new Date(
            user.created_at
          ).toLocaleDateString()}</p>
        </div>
      `;

      ui.usersList.appendChild(userCard);
    });

    // 페이지네이션 업데이트
    renderPagination();
  }

  // 페이지네이션 렌더링
  function renderPagination() {
    if (!ui.paginationControls) return;

    const { page, totalPages } = state.usersData.pagination;

    // 컨트롤 초기화
    ui.paginationControls.innerHTML = "";

    if (totalPages <= 1) return;

    // 이전 버튼
    const prevButton = document.createElement("button");
    prevButton.innerHTML = "&laquo; Prev";
    prevButton.disabled = page <= 1;
    prevButton.addEventListener("click", () => {
      if (page > 1) loadUsers(page - 1, ui.userSearch.value);
    });

    // 다음 버튼
    const nextButton = document.createElement("button");
    nextButton.innerHTML = "Next &raquo;";
    nextButton.disabled = page >= totalPages;
    nextButton.addEventListener("click", () => {
      if (page < totalPages) loadUsers(page + 1, ui.userSearch.value);
    });

    // 페이지 정보
    const pageInfo = document.createElement("span");
    pageInfo.className = "page-info";
    pageInfo.textContent = `Page ${page} of ${totalPages}`;

    // 페이지네이션에 추가
    ui.paginationControls.appendChild(prevButton);
    ui.paginationControls.appendChild(pageInfo);
    ui.paginationControls.appendChild(nextButton);
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    // 테마 토글 버튼
    if (ui.themeToggle) {
      ui.themeToggle.addEventListener("click", toggleTheme);
    }

    // 네비게이션 리스너
    if (ui.nav.home) {
      ui.nav.home.addEventListener("click", () => showSection("home"));
    }

    if (ui.nav.register) {
      ui.nav.register.addEventListener("click", () => showSection("register"));
    }

    if (ui.nav.login) {
      ui.nav.login.addEventListener("click", () => showSection("login"));
    }

    if (ui.nav.profile) {
      ui.nav.profile.addEventListener("click", () => showSection("profile"));
    }

    if (ui.nav.logout) {
      ui.nav.logout.addEventListener("click", logoutUser);
    }

    if (ui.nav.users) {
      ui.nav.users.addEventListener("click", () => showSection("users"));
    }

    // 등록 폼 제출
    if (ui.forms.register) {
      ui.forms.register.addEventListener("submit", (e) => {
        e.preventDefault();

        const username = document.getElementById("register-username").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const fullName = document.getElementById("register-fullname").value;

        registerUser({ username, email, password, full_name: fullName });
      });

      // 비밀번호 강도 체크
      const passwordInput = document.getElementById("register-password");
      if (passwordInput) {
        passwordInput.addEventListener("input", (e) => {
          updatePasswordStrength(e.target.value);
        });
      }
    }

    // 로그인 폼 제출
    if (ui.forms.login) {
      ui.forms.login.addEventListener("submit", (e) => {
        e.preventDefault();

        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;
        const rememberMe = document.getElementById("login-remember").checked;

        loginUser({ username, password, remember_me: rememberMe });
      });
    }

    // 프로필 폼 제출
    if (ui.forms.profile) {
      ui.forms.profile.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("profile-email").value;
        const fullName = document.getElementById("profile-fullname").value;

        updateProfile({ email, full_name: fullName });
      });

      // 비밀번호 변경 링크
      const changePasswordLink = document.getElementById(
        "change-password-link"
      );
      if (changePasswordLink) {
        changePasswordLink.addEventListener("click", () =>
          showSection("password")
        );
      }
    }

    // 비밀번호 변경 폼 제출
    if (ui.forms.password) {
      ui.forms.password.addEventListener("submit", (e) => {
        e.preventDefault();

        const currentPassword =
          document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword =
          document.getElementById("confirm-password").value;

        if (newPassword !== confirmPassword) {
          showMessage("New passwords do not match", "error");
          return;
        }

        changePassword({
          current_password: currentPassword,
          new_password: newPassword,
        });
      });

      // 비밀번호 강도 체크
      const newPasswordInput = document.getElementById("new-password");
      if (newPasswordInput) {
        newPasswordInput.addEventListener("input", (e) => {
          updatePasswordStrength(e.target.value);
        });
      }
    }

    // 아바타 폼 제출
    if (ui.forms.avatar) {
      ui.forms.avatar.addEventListener("submit", (e) => {
        e.preventDefault();

        const avatarInput = document.getElementById("avatar-file");
        if (!avatarInput.files || avatarInput.files.length === 0) {
          showMessage("Please select an image file", "error");
          return;
        }

        const formData = new FormData();
        formData.append("avatar", avatarInput.files[0]);

        uploadAvatar(formData);
      });

      // 아바타 미리보기
      const avatarInput = document.getElementById("avatar-file");
      if (avatarInput) {
        avatarInput.addEventListener("change", (e) => {
          if (e.target.files && e.target.files[0] && ui.avatarPreview) {
            const reader = new FileReader();
            reader.onload = function (event) {
              ui.avatarPreview.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
          }
        });
      }
    }

    // 사용자 검색
    if (ui.userSearch) {
      // 디바운스 적용을 위한 타이머
      let searchTimer;

      ui.userSearch.addEventListener("input", (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          loadUsers(1, e.target.value);
        }, 500);
      });
    }
  }

  // 앱 초기화
  function init() {
    initTheme();
    checkLoginStatus();
    setupEventListeners();
    showSection("home");
  }

  // 앱 시작
  init();
});
