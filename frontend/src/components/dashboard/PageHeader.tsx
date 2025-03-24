import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between">
      <div className="flex items-center">
        {icon && (
          <div className="mr-4 bg-indigo-100 dark:bg-indigo-900 p-2 rounded-md">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 