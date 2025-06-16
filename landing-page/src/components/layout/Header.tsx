import React from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  return (
    <header className="vscode-bg-primary border-b border-vscode-panel-border sticky top-0 z-50">
      <div className="thunder-container">
        <div className="flex items-center justify-between py-4">
          {/* Logo and Title - VSCode Extension Style */}
          <Link
            to="/"
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
          </Link>

          {/* Navigation - VSCode Extension Style */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className="vscode-btn vscode-btn-secondary">
              Home
            </Link>
            <Link to="/about" className="vscode-btn vscode-btn-secondary">
              About
            </Link>
            <Link to="/guide" className="vscode-btn vscode-btn-secondary">
              Guide
            </Link>
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
            <Link to="/" className="vscode-tab active">
              Home
            </Link>
            <Link to="/about" className="vscode-tab">
              About
            </Link>
            <Link to="/guide" className="vscode-tab">
              Guide
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
