import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="thunder-bg-dark thunder-text-light">
      <div className="thunder-container py-12">
        <div className="thunder-grid thunder-grid-4 mb-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="thunder-icon thunder-icon-lg">H</div>
              <h3 className="thunder-text-xl font-bold">HAPA AI Assistant</h3>
            </div>
            <p className="thunder-text-sm thunder-text-muted mb-4 leading-relaxed">
              Thunder Client의 직관적인 UI/UX를 적용한 차세대 AI 코딩
              도구입니다. VSCode Extension과 웹 인터페이스로 효율적인 개발
              환경을 제공합니다.
            </p>
            <div className="flex items-center gap-4 mb-4">
              <div className="thunder-status">
                <div className="thunder-status-dot"></div>
                <span>Version 0.4.0</span>
              </div>
              <span className="thunder-text-xs thunder-text-muted">|</span>
              <span className="thunder-text-xs thunder-text-muted">
                MIT License
              </span>
            </div>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="thunder-icon hover:opacity-80 transition-opacity"
                title="GitHub Repository"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="mailto:contact@hancom.com"
                className="thunder-icon hover:opacity-80 transition-opacity"
                title="Contact Email"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.633a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </a>
              <a
                href="https://marketplace.visualstudio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="thunder-icon hover:opacity-80 transition-opacity"
                title="VS Code Marketplace"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21.29 4.1L15.44 2a1.87 1.87 0 00-1.82.37L6.1 8.84a1.27 1.27 0 000 1.32l7.52 6.47a1.87 1.87 0 001.82.37l5.85-2.1a1.87 1.87 0 001.13-1.7V5.8a1.87 1.87 0 00-1.13-1.7z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="thunder-section-header mb-4">
              <span>NAVIGATION</span>
            </div>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  className="thunder-text-sm thunder-text-muted hover:thunder-text-light transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#guide"
                  className="thunder-text-sm thunder-text-muted hover:thunder-text-light transition-colors"
                >
                  Quick Start Guide
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="thunder-text-sm thunder-text-muted hover:thunder-text-light transition-colors"
                >
                  About Project
                </a>
              </li>
              <li>
                <a
                  href="#api"
                  className="thunder-text-sm thunder-text-muted hover:thunder-text-light transition-colors"
                >
                  API Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <div className="thunder-section-header mb-4">
              <span>RESOURCES</span>
            </div>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://marketplace.visualstudio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="thunder-text-sm thunder-text-muted hover:thunder-text-light transition-colors flex items-center gap-2"
                >
                  <span>VS Code Marketplace</span>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="thunder-text-sm thunder-text-muted hover:thunder-text-light transition-colors flex items-center gap-2"
                >
                  <span>GitHub Repository</span>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="#changelog"
                  className="thunder-text-sm thunder-text-muted hover:thunder-text-light transition-colors"
                >
                  Changelog
                </a>
              </li>
              <li>
                <a
                  href="#support"
                  className="thunder-text-sm thunder-text-muted hover:thunder-text-light transition-colors"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Technology Stack */}
          <div>
            <div className="thunder-section-header mb-4">
              <span>TECH STACK</span>
            </div>
            <ul className="space-y-2">
              <li className="thunder-text-sm thunder-text-muted">
                TypeScript + React
              </li>
              <li className="thunder-text-sm thunder-text-muted">
                VS Code Extension API
              </li>
              <li className="thunder-text-sm thunder-text-muted">
                FastAPI + Python
              </li>
              <li className="thunder-text-sm thunder-text-muted">
                Thunder Client UI/UX
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section - Thunder Client 스타일 */}
        <div
          className="pt-8 border-t"
          style={{ borderColor: "var(--thunder-border)" }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="thunder-text-xs thunder-text-muted">
                © 2025 HAPA AI Assistant. All rights reserved.
              </p>
              <div className="thunder-status">
                <div className="thunder-status-dot"></div>
                <span>Powered by Thunder Client Design System</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="#privacy"
                className="thunder-text-xs thunder-text-muted hover:thunder-text-light transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#terms"
                className="thunder-text-xs thunder-text-muted hover:thunder-text-light transition-colors"
              >
                Terms of Service
              </a>
              <div className="thunder-tabs">
                <button className="thunder-tab active">Production</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
