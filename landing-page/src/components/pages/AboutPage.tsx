import React from "react";

const AboutPage: React.FC = () => {
  return (
    <div className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-hancom-navy mb-6">
            About HAPA AI Assistant
          </h1>
          <p className="text-xl text-gray-600">프로젝트에 대해 더 알아보세요</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-3xl font-semibold text-hancom-navy mb-6">
            프로젝트 소개
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            HAPA AI Assistant는 개발자들의 생산성 향상을 위해 설계된 차세대 개발
            도구입니다. VSCode Extension과 웹 인터페이스를 통해 통합된 개발
            환경을 제공합니다.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            현대적인 기술 스택과 사용자 중심의 디자인으로 개발자들이 더
            효율적이고 즐겁게 코딩할 수 있도록 돕습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
