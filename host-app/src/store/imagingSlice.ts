import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ImagingState, MedicalImage, ImageCategory } from './types'

// Import the medical images
import image1 from '../assets/imaging/3e87af32-a498-4174-9f59-9fa6865d4597/43AC4C75-8EBD-4898-9513-75811300CFE7.jpg'
import image2 from '../assets/imaging/3e87af32-a498-4174-9f59-9fa6865d4597/76538477-D664-4620-9BE2-40AD604CA8FC.jpg'
import image3 from '../assets/imaging/3e87af32-a498-4174-9f59-9fa6865d4597/95800790-5E70-4083-BE05-59B97583F5F4.jpg'

const imageCategories: ImageCategory[] = [
  { id: 'all', name: 'All Files (3)', count: 3 },
  { id: 'pinned', name: 'Pinned Files', count: 0 },
  { id: 'anterior', name: 'Anterior', count: 0 },
  { id: 'corneal', name: 'Corneal Topography System', count: 0 },
  { id :'documents', name: 'Documents', count: 0 },
  { id: 'drawings', name: 'Drawings', count: 0 },
  { id: 'fluorescein', name: 'Fluorescein Angiography', count: 0 },
  { id: 'fundus', name: 'Fundus', count: 0 },
  { id: 'indocyanine', name: 'Indocyanine Green Angiography', count: 0 },
  { id: 'none', name: 'None (3)', count: 3 },
  { id: 'opticalcoherence', name: 'Optical Coherence Tomography', count: 0 },
  { id: 'others', name: 'Others', count: 0 },
  { id: 'perimetry', name: 'Perimetry', count: 0 },
  { id: 'scanninglaser', name: 'Scanning Laser Ophthalmoscopy', count: 0 },
  { id: 'wavefrontanalysis', name: 'Wave Front Analysis', count: 0 }
]

const medicalImages: MedicalImage[] = [
  {
    id: '43AC4C75-8EBD-4898-9513-75811300CFE7',
    name: '43AC4C75-8EBD-4898-9513-75811300CFE7.jpg',
    src: image1,
    category: 'none',
    fileSize: '546.5 KB',
    timestamp: '04/10/2025 14:54:23',
    format: 'JPG 1:1'
  },
  {
    id: '76538477-D664-4620-9BE2-40AD604CA8FC',
    name: '76538477-D664-4620-9BE2-40AD604CA8FC.jpg',
    src: image2,
    category: 'none',
    fileSize: '542.1 KB',
    timestamp: '04/10/2025 14:55:12',
    format: 'JPG 1:1'
  },
  {
    id: '95800790-5E70-4083-BE05-59B97583F5F4',
    name: '95800790-5E70-4083-BE05-59B97583F5F4.jpg',
    src: image3,
    category: 'none',
    fileSize: '548.9 KB',
    timestamp: '04/10/2025 14:56:03',
    format: 'JPG 1:1'
  }
]

const initialState: ImagingState = {
  images: medicalImages,
  categories: imageCategories,
  selectedImageId: medicalImages[0]?.id || null,
  selectedCategoryId: 'all',
  isLoading: false,
  error: null
}

const imagingSlice = createSlice({
  name: 'imaging',
  initialState,
  reducers: {
    selectImage: (state, action: PayloadAction<string>) => {
      state.selectedImageId = action.payload
    },
    selectCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategoryId = action.payload
      // If switching to a category that doesn't include the current image, 
      // select the first image in the new category
      const filteredImages = action.payload === 'all' 
        ? state.images 
        : state.images.filter(img => img.category === action.payload)
      
      if (filteredImages.length > 0 && state.selectedImageId) {
        const currentImageInCategory = filteredImages.find(img => img.id === state.selectedImageId)
        if (!currentImageInCategory) {
          state.selectedImageId = filteredImages[0].id
        }
      }
    },
    addImage: (state, action: PayloadAction<MedicalImage>) => {
      state.images.push(action.payload)
    },
    removeImage: (state, action: PayloadAction<string>) => {
      state.images = state.images.filter(img => img.id !== action.payload)
      if (state.selectedImageId === action.payload) {
        state.selectedImageId = state.images[0]?.id || null
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    }
  }
})

export const { 
  selectImage, 
  selectCategory, 
  addImage, 
  removeImage, 
  setLoading, 
  setError 
} = imagingSlice.actions

export default imagingSlice.reducer