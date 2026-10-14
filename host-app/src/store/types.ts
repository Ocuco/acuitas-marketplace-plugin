export interface MedicalImage {
  id: string
  name: string
  src: string
  category: string
  fileSize?: string
  timestamp?: string
  format?: string
}

export interface ImageCategory {
  id: string
  name: string
  count: number
}

export interface ImagingState {
  images: MedicalImage[]
  categories: ImageCategory[]
  selectedImageId: string | null
  selectedCategoryId: string
  isLoading: boolean
  error: string | null
}