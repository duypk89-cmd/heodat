
import React from 'react';
import { Category } from './types';

export const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  [Category.FOOD]: <i className="fa-solid fa-carrot text-orange-400"></i>,
  [Category.HOUSEHOLD]: <i className="fa-solid fa-house-chimney text-blue-400"></i>,
  [Category.COSMETICS]: <i className="fa-solid fa-sparkles text-pink-400"></i>,
  [Category.FASHION]: <i className="fa-solid fa-shirt text-purple-400"></i>,
  [Category.HEALTH]: <i className="fa-solid fa-heart-pulse text-red-400"></i>,
  [Category.OTHER]: <i className="fa-solid fa-ellipsis text-gray-400"></i>,
};

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.FOOD]: '#FED7AA',
  [Category.HOUSEHOLD]: '#BFDBFE',
  [Category.COSMETICS]: '#FBCFE8',
  [Category.FASHION]: '#E9D5FF',
  [Category.HEALTH]: '#FECACA',
  [Category.OTHER]: '#E5E7EB',
};
