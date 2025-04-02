// 포트폴리오 필터링 기능
document.addEventListener("DOMContentLoaded", () => {
  // 모든 요소가 로드된 후 실행
  setTimeout(() => {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const portfolioItems = document.querySelectorAll(".portfolio-item");

    // 초기에 모든 항목 표시
    portfolioItems.forEach((item) => {
      item.style.display = "block";
      item.style.opacity = 1;
    });

    // 필터 버튼 클릭 이벤트
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // 활성 버튼 스타일 변경
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        const filterValue = button.getAttribute("data-filter");
        filterPortfolio(filterValue);
      });
    });

    // 포트폴리오 필터링 함수
    function filterPortfolio(filter) {
      portfolioItems.forEach((item) => {
        if (filter === "all" || item.getAttribute("data-category") === filter) {
          item.style.display = "block";
          setTimeout(() => {
            item.style.opacity = 1;
          }, 50);
        } else {
          item.style.opacity = 0;
          setTimeout(() => {
            item.style.display = "none";
          }, 300);
        }
      });
    }

    // 스크롤 다운 버튼 애니메이션
    const viewMoreButton = document.querySelector(".view-more");
    if (viewMoreButton) {
      viewMoreButton.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = viewMoreButton.getAttribute("href");
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: "smooth",
          });
        }
      });
    }

    // 페이지 로드 시 모든 항목이 보이도록
    filterPortfolio("all");
  }, 100);

  // 스크롤 애니메이션
  const scrollElements = document.querySelectorAll(".scroll-animate");

  const elementInView = (el, percentageScroll = 100) => {
    const elementTop = el.getBoundingClientRect().top;
    return (
      elementTop <=
      (window.innerHeight || document.documentElement.clientHeight) *
        (percentageScroll / 100)
    );
  };

  const displayScrollElement = (element) => {
    element.classList.add("scrolled");
  };

  const handleScrollAnimation = () => {
    scrollElements.forEach((el) => {
      if (elementInView(el, 100)) {
        displayScrollElement(el);
      }
    });
  };

  window.addEventListener("scroll", () => {
    handleScrollAnimation();
  });
});
