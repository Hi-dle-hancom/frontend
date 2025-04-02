// 포트폴리오 필터링 기능
document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const portfolioGrid = document.querySelector(".portfolio-grid");

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
    const items = portfolioGrid.querySelectorAll(".portfolio-item");

    items.forEach((item) => {
      if (filter === "all" || item.getAttribute("data-category") === filter) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  }

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
