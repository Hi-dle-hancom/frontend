import React from "react";

interface VSCodeCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: string;
  className?: string;
  actions?: React.ReactNode;
  status?: {
    label: string;
    type?: "success" | "warning" | "error" | "info";
  };
}

const VSCodeCard: React.FC<VSCodeCardProps> = ({
  children,
  title,
  subtitle,
  icon,
  className = "",
  actions,
  status,
}) => {
  const cardClasses = ["vscode-card", className].filter(Boolean).join(" ");

  return (
    <div className={cardClasses}>
      {(title || subtitle || icon || actions || status) && (
        <div className="vscode-card-header">
          <div className="flex items-center gap-2">
            {icon && <div className="vscode-sidebar-icon">{icon}</div>}
            {(title || subtitle) && (
              <div>
                {title && (
                  <div className="vscode-text-sm font-semibold vscode-text-primary">
                    {title}
                  </div>
                )}
                {subtitle && (
                  <div className="vscode-text-xs vscode-text-secondary">
                    {subtitle}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {status && (
              <div className="vscode-status">
                <div className="vscode-status-dot"></div>
                <span>{status.label}</span>
              </div>
            )}
            {actions}
          </div>
        </div>
      )}

      <div className="vscode-card-body">{children}</div>
    </div>
  );
};

export default VSCodeCard;
