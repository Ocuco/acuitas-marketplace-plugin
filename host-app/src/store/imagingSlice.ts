import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ImagingState, MedicalImage, ImageCategory } from './types'

// Import the medical images
import image1 from '../assets/imaging/3e87af32-a498-4174-9f59-9fa6865d4597/43AC4C75-8EBD-4898-9513-75811300CFE7.jpg'
import image2 from '../assets/imaging/3e87af32-a498-4174-9f59-9fa6865d4597/76538477-D664-4620-9BE2-40AD604CA8FC.jpg'
import image3 from '../assets/imaging/3e87af32-a498-4174-9f59-9fa6865d4597/95800790-5E70-4083-BE05-59B97583F5F4.jpg'
import image4 from '../assets/imaging/3e87af32-a498-4174-9f59-9fa6865d4597/5C5F290A-6185-4EAF-B2E3-B3F896640430.jpg'
import image5 from '../assets/imaging/3e87af32-a498-4174-9f59-9fa6865d4597/6CC01EC9-0490-4AD4-9386-97B6C93B05F8.jpg'
import image6 from '../assets/imaging/3e87af32-a498-4174-9f59-9fa6865d4597/8A9381F2-D0A1-4500-9057-C88E6BB5BF31.jpg'
import image7 from '../assets/imaging/3e87af32-a498-4174-9f59-9fa6865d4597/91ED85ED-48BE-4547-9079-BBAAB71CBEB5.jpg'
import image8 from '../assets/imaging/3e87af32-a498-4174-9f59-9fa6865d4597/B4FFAD14-510A-4E12-A156-83369C88C3F8.jpg'
import image9 from '../assets/imaging/3e87af32-a498-4174-9f59-9fa6865d4597/C3C76D77-6D41-44E5-9C99-53ABE6F77AB4.jpg'

const imageCategories: ImageCategory[] = [
  { id: 'all', name: 'All Files (9)', count: 9 },
  { id: 'pinned', name: 'Pinned Files', count: 0 },
  { id: 'anterior', name: 'Anterior', count: 0 },
  { id: 'corneal', name: 'Corneal Topography System', count: 0 },
  { id :'documents', name: 'Documents', count: 0 },
  { id: 'drawings', name: 'Drawings', count: 0 },
  { id: 'fluorescein', name: 'Fluorescein Angiography', count: 0 },
  { id: 'fundus', name: 'Fundus (9)', count: 9 },
  { id: 'indocyanine', name: 'Indocyanine Green Angiography', count: 0 },
  { id: 'none', name: 'None', count: 0 },
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
    category: 'fundus',
    fileSize: '546.5 KB',
    timestamp: '04/10/2025 14:54:23',
    format: 'JPG 1:1'
  },
  {
    id: '76538477-D664-4620-9BE2-40AD604CA8FC',
    name: '76538477-D664-4620-9BE2-40AD604CA8FC.jpg',
    src: image2,
    category: 'fundus',
    fileSize: '542.1 KB',
    timestamp: '04/10/2025 14:55:12',
    format: 'JPG 1:1'
  },
  {
    id: '95800790-5E70-4083-BE05-59B97583F5F4',
    name: '95800790-5E70-4083-BE05-59B97583F5F4.jpg',
    src: image3,
    category: 'fundus',
    fileSize: '548.9 KB',
    timestamp: '04/10/2025 14:56:03',
    format: 'JPG 1:1'
  },
  {
    id: '5C5F290A-6185-4EAF-B2E3-B3F896640430',
    name: '5C5F290A-6185-4EAF-B2E3-B3F896640430.jpg',
    src: image4,
    category: 'fundus',
    fileSize: '1.30 MB',
    timestamp: '04/10/2025 14:57:11',
    format: 'JPG 1:1'
  },
  {
    id: '6CC01EC9-0490-4AD4-9386-97B6C93B05F8',
    name: '6CC01EC9-0490-4AD4-9386-97B6C93B05F8.jpg',
    src: image5,
    category: 'fundus',
    fileSize: '1.23 MB',
    timestamp: '04/10/2025 14:58:02',
    format: 'JPG 1:1'
  },
  {
    id: '8A9381F2-D0A1-4500-9057-C88E6BB5BF31',
    name: '8A9381F2-D0A1-4500-9057-C88E6BB5BF31.jpg',
    src: image6,
    category: 'fundus',
    fileSize: '1.01 MB',
    timestamp: '04/10/2025 14:59:18',
    format: 'JPG 1:1'
  },
  {
    id: '91ED85ED-48BE-4547-9079-BBAAB71CBEB5',
    name: '91ED85ED-48BE-4547-9079-BBAAB71CBEB5.jpg',
    src: image7,
    category: 'fundus',
    fileSize: '1.24 MB',
    timestamp: '04/10/2025 15:00:05',
    format: 'JPG 1:1'
  },
  {
    id: 'B4FFAD14-510A-4E12-A156-83369C88C3F8',
    name: 'B4FFAD14-510A-4E12-A156-83369C88C3F8.jpg',
    src: image8,
    category: 'fundus',
    fileSize: '1.40 MB',
    timestamp: '04/10/2025 15:01:22',
    format: 'JPG 1:1'
  },
  {
    id: 'C3C76D77-6D41-44E5-9C99-53ABE6F77AB4',
    name: 'C3C76D77-6D41-44E5-9C99-53ABE6F77AB4.jpg',
    src: image9,
    category: 'fundus',
    fileSize: '1.32 MB',
    timestamp: '04/10/2025 15:02:09',
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