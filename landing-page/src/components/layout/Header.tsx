import React from "react";

const Header: React.FC = () => {
  return (
    <header className="vscode-bg-primary border-b border-vscode-panel-border sticky top-0 z-50">
      <div className="thunder-container">
        <div className="flex items-center justify-between py-4">
          {/* Logo and Title - VSCode Extension Style */}
          <a
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div
              className="vscode-sidebar-icon"
              style={{ width: "32px", height: "32px", fontSize: "14px" }}
            >
              H
            </div>
            <div>
              <h1 className="vscode-text-lg font-bold vscode-text-primary">
                HAPA
              </h1>
              <p className="vscode-text-xs vscode-text-secondary">
                AI Python Assistant
              </p>
            </div>
          </a>

          {/* Navigation - VSCode Extension Style */}
          <nav className="hidden md:flex items-center gap-1">
            <a href="/" className="vscode-btn vscode-btn-secondary">
              Home
            </a>
            <a href="/about" className="vscode-btn vscode-btn-secondary">
              About
            </a>
            <a href="/guide" className="vscode-btn vscode-btn-secondary">
              Guide
            </a>
          </nav>

          {/* Action Buttons - VSCode Extension Style */}
          <div className="flex items-center gap-2">
            <div className="vscode-status hidden lg:flex">
              <div className="vscode-status-dot"></div>
              <span>v0.4.0</span>
            </div>

            <button className="vscode-btn vscode-btn-secondary">⚙️</button>

            <button className="vscode-btn vscode-btn-primary">Install</button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden vscode-btn vscode-btn-secondary">
            ☰
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-vscode-panel-border">
          <div className="vscode-tabs">
            <a href="/" className="vscode-tab active">
              Home
            </a>
            <a href="/about" className="vscode-tab">
              About
            </a>
            <a href="/guide" className="vscode-tab">
              Guide
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
