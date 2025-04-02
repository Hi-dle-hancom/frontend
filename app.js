// DOM 요소 선택
const memoForm = document.getElementById("memo-form");
const memoTitle = document.getElementById("memo-title");
const memoContent = document.getElementById("memo-content");
const saveMemoBtn = document.getElementById("save-memo-btn");
const memoList = document.getElementById("memo-list");
const memoEdit = document.getElementById("memo-edit");
const editTitle = document.getElementById("edit-title");
const editContent = document.getElementById("edit-content");
const updateMemoBtn = document.getElementById("update-memo-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

// 현재 선택된 메모 ID
let currentMemoId = null;

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", init);

// 초기화 함수
function init() {
  // 이벤트 리스너 등록
  saveMemoBtn.addEventListener("click", createMemo);
  updateMemoBtn.addEventListener("click", updateMemo);
  cancelEditBtn.addEventListener("click", cancelEdit);

  // 메모 목록 로드
  loadMemos();
}

// HTML 이스케이프 함수
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 메모 목록 로드
async function loadMemos() {
  try {
    const response = await fetch("/api/memos");
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
    memoList.innerHTML = '<li class="no-memos">저장된 메모가 없습니다.</li>';
    return;
  }

  memos.forEach((memo) => {
    const li = document.createElement("li");
    li.className = "memo-item";

    // 메모 내용 최대 100자로 제한
    const previewText =
      memo.content.length > 100
        ? memo.content.substring(0, 100) + "..."
        : memo.content;

    li.innerHTML = `
      <div class="memo-content">
        <div class="memo-title">${escapeHtml(memo.title)}</div>
        <div class="memo-text">${escapeHtml(previewText)}</div>
      </div>
      <div class="memo-actions">
        <button class="edit-btn" data-id="${memo.id}">수정</button>
        <button class="delete-btn" data-id="${memo.id}">삭제</button>
      </div>
    `;

    // 수정 버튼 이벤트
    li.querySelector(".edit-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      showEditForm(memo);
    });

    // 삭제 버튼 이벤트
    li.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteMemo(memo.id);
    });

    memoList.appendChild(li);
  });
}

// 메모 생성
async function createMemo() {
  const title = memoTitle.value.trim();
  const content = memoContent.value.trim();

  if (!title || !content) {
    alert("제목과 내용을 모두 입력해주세요.");
    return;
  }

  try {
    const response = await fetch("/api/memos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) throw new Error("메모 저장에 실패했습니다.");

    // 입력 필드 초기화
    memoTitle.value = "";
    memoContent.value = "";

    // 메모 목록 새로고침
    loadMemos();
  } catch (error) {
    console.error("메모 저장 오류:", error);
    alert("메모 저장에 실패했습니다.");
  }
}

// 수정 폼 표시
function showEditForm(memo) {
  currentMemoId = memo.id;
  editTitle.value = memo.title;
  editContent.value = memo.content;

  memoForm.classList.add("hidden");
  memoEdit.classList.remove("hidden");
}

// 메모 수정 취소
function cancelEdit() {
  currentMemoId = null;
  editTitle.value = "";
  editContent.value = "";

  memoForm.classList.remove("hidden");
  memoEdit.classList.add("hidden");
}

// 메모 업데이트
async function updateMemo() {
  if (!currentMemoId) return;

  const title = editTitle.value.trim();
  const content = editContent.value.trim();

  if (!title || !content) {
    alert("제목과 내용을 모두 입력해주세요.");
    return;
  }

  try {
    const response = await fetch(`/api/memos/${currentMemoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) throw new Error("메모 수정에 실패했습니다.");

    // 수정 폼 숨기기
    cancelEdit();

    // 메모 목록 새로고침
    loadMemos();
  } catch (error) {
    console.error("메모 수정 오류:", error);
    alert("메모 수정에 실패했습니다.");
  }
}

// 메모 삭제
async function deleteMemo(id) {
  if (!confirm("정말로 이 메모를 삭제하시겠습니까?")) return;

  try {
    const response = await fetch(`/api/memos/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("메모 삭제에 실패했습니다.");

    // 메모 목록 새로고침
    loadMemos();
  } catch (error) {
    console.error("메모 삭제 오류:", error);
    alert("메모 삭제에 실패했습니다.");
  }
}
