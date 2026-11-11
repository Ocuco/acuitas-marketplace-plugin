/*
 * Copyright 2026 Ocuco Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './store';

// Basic selectors
export const selectImaging = (state: RootState) => state.imaging;
export const selectImages = (state: RootState) => state.imaging.images;
export const selectCategories = (state: RootState) => state.imaging.categories;
export const selectSelectedImageId = (state: RootState) => state.imaging.selectedImageId;
export const selectSelectedCategoryId = (state: RootState) => state.imaging.selectedCategoryId;
export const selectIsLoading = (state: RootState) => state.imaging.isLoading;
export const selectError = (state: RootState) => state.imaging.error;

// Memoized selectors
export const selectSelectedImage = createSelector([selectImages, selectSelectedImageId], (images, selectedImageId) => {
  return selectedImageId ? images.find(img => img.id === selectedImageId) || null : null;
});

export const selectFilteredImages = createSelector([selectImages, selectSelectedCategoryId], (images, selectedCategoryId) => {
  return selectedCategoryId === 'all' ? images : images.filter(img => img.category === selectedCategoryId);
});

export const selectSelectedCategory = createSelector([selectCategories, selectSelectedCategoryId], (categories, selectedCategoryId) => {
  return categories.find(cat => cat.id === selectedCategoryId) || null;
});

export const selectImagesByCategory = createSelector([selectImages], images => {
  return images.reduce(
    (acc, image) => {
      if (!acc[image.category]) {
        acc[image.category] = [];
      }
      acc[image.category].push(image);
      return acc;
    },
    {} as Record<string, typeof images>,
  );
});
