import React from "react";

interface VSCodeButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "expand";
  size?: "sm" | "md" | "lg";
  icon?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  href?: string;
}

const VSCodeButton: React.FC<VSCodeButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  onClick,
  className = "",
  disabled = false,
  href,
}) => {
  const baseClasses = "vscode-btn";

  const variantClasses = {
    primary: "vscode-btn-primary",
    secondary: "vscode-btn-secondary",
    expand: "vscode-btn-expand",
  };

  const sizeClasses = {
    sm: "",
    md: "",
    lg: "vscode-btn-lg",
  };

  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {icon && <span>{icon}</span>}
      {children}
    </>
  );

  if (href) {
    return (
      <a href={href} className={buttonClasses} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button className={buttonClasses} onClick={onClick} disabled={disabled}>
      {content}
    </button>
  );
};

export default VSCodeButton;
