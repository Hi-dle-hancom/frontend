// DOM 요소
const memoForm = document.querySelector(".memo-form");
const memoCategory = document.getElementById("memo-category");
const memoContent = document.getElementById("memo-content");
const saveMemoBtn = document.getElementById("save-memo-btn");
const memoList = document.getElementById("memo-list");
const categoryBtns = document.querySelectorAll(".category-btn");
const memoDetail = document.getElementById("memo-detail");
const detailTitle = document.getElementById("detail-title");
const detailDate = document.getElementById("detail-date");
const detailContent = document.getElementById("detail-content");
const backBtn = document.getElementById("back-btn");
const deleteBtn = document.getElementById("delete-btn");

// 현재 선택된 카테고리와 메모 ID
let currentCategory = "all";
let currentMemoId = null;

// 초기화 함수
function init() {
  // 이벤트 리스너 등록
  saveMemoBtn.addEventListener("click", createMemo);
  backBtn.addEventListener("click", showMemoList);
  deleteBtn.addEventListener("click", deleteMemo);

  // 카테고리 버튼 이벤트 등록
  categoryBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // 활성화된 버튼 변경
      categoryBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // 해당 카테고리 메모 목록 로드
      currentCategory = btn.dataset.category;
      loadMemos();
    });
  });

  // 메모 목록 로드
  loadMemos();
}

// 메모 목록 로드
async function loadMemos() {
  try {
    let url = "/api/memos";
    if (currentCategory !== "all") {
      url = `/api/memos/category/${encodeURIComponent(currentCategory)}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error("메모 목록을 불러오는데 실패했습니다.");

    const memos = await response.json();
    renderMemoList(memos);
  } catch (error) {
    console.error("메모 목록 로드 오류:", error);
    alert("메모 목록을 불러오는데 실패했습니다.");
  }
}

// 메모 목록 렌더링
function renderMemoList(memos) {
  memoList.innerHTML = "";

  if (memos.length === 0) {
    memoList.innerHTML = '<li class="no-memos">메모가 없습니다.</li>';
    return;
  }

  memos.forEach((memo) => {
    const date = new Date(memo.created_at);
    const formattedDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

    // ERD나 RDS 키워드 확인
    let suffix = "";
    if (memo.content.includes("ERD")) {
      suffix = " (작성)";
    } else if (memo.content.includes("RDS")) {
      suffix = " (설정)";
    }

    const previewText =
      memo.content.length > 50
        ? memo.content.substring(0, 50) + "..."
        : memo.content;

    const li = document.createElement("li");
    li.className = "memo-item";
    li.innerHTML = `
      <h3>${memo.category}${suffix} <span class="memo-date">${formattedDate}</span></h3>
      <p class="memo-preview">${previewText}</p>
    `;

    // 메모 클릭 시 상세 보기
    li.addEventListener("click", () => viewMemoDetail(memo));

    memoList.appendChild(li);
  });
}

// 메모 상세 보기
function viewMemoDetail(memo) {
  currentMemoId = memo.id;

  // 상세 정보 표시
  const date = new Date(memo.created_at);
  const formattedDate = `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  detailTitle.textContent = memo.category;
  detailDate.textContent = formattedDate;
  detailContent.textContent = memo.content;

  // 뷰 전환
  document.querySelector(".memo-form").classList.add("hidden");
  document.querySelector(".memo-list-section").classList.add("hidden");
  memoDetail.classList.remove("hidden");
}

// 메모 목록으로 돌아가기
function showMemoList() {
  currentMemoId = null;

  // 뷰 전환
  document.querySelector(".memo-form").classList.remove("hidden");
  document.querySelector(".memo-list-section").classList.remove("hidden");
  memoDetail.classList.add("hidden");
}

// 새 메모 작성
async function createMemo() {
  const category = memoCategory.value;
  const content = memoContent.value.trim();

  if (!content) {
    alert("메모 내용을 입력해주세요.");
    return;
  }

  try {
    const response = await fetch("/api/memos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category, content }),
    });

    if (!response.ok) throw new Error("메모 저장에 실패했습니다.");

    const result = await response.json();
    console.log("메모가 저장되었습니다:", result);

    // 입력 필드 초기화
    memoContent.value = "";

    // 메모 목록 새로고침
    loadMemos();

    alert("메모가 저장되었습니다.");
  } catch (error) {
    console.error("메모 저장 오류:", error);
    alert("메모 저장에 실패했습니다.");
  }
}

// 메모 삭제
async function deleteMemo() {
  if (!currentMemoId) return;

  if (!confirm("정말로 이 메모를 삭제하시겠습니까?")) return;

  try {
    const response = await fetch(`/api/memos/${currentMemoId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("메모 삭제에 실패했습니다.");

    // 메모 목록으로 돌아가기
    showMemoList();

    // 메모 목록 새로고침
    loadMemos();

    alert("메모가 삭제되었습니다.");
  } catch (error) {
    console.error("메모 삭제 오류:", error);
    alert("메모 삭제에 실패했습니다.");
  }
}

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", init);
