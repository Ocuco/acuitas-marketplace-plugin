import './ImagingViewer.css'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectImage, selectCategory } from '../store/imagingSlice'
import { 
  selectSelectedImage, 
  selectFilteredImages, 
  selectCategories, 
  selectSelectedCategoryId 
} from '../store/selectors'

function ImagingViewer() {
  const dispatch = useAppDispatch()
  const selectedImage = useAppSelector(selectSelectedImage)
  const filteredImages = useAppSelector(selectFilteredImages)
  const categories = useAppSelector(selectCategories)
  const selectedCategoryId = useAppSelector(selectSelectedCategoryId)

  const handleCategorySelect = (categoryId: string) => {
    dispatch(selectCategory(categoryId))
  }

  const handleImageSelect = (imageId: string) => {
    dispatch(selectImage(imageId))
  }

  return (
    <div className="imaging-viewer">
      {/* Left Panel - Categories */}
      <div className="categories-panel">
        <div className="panel-header">
          <h3>Group By</h3>
        </div>
        <div className="categories-list">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`category-item ${selectedCategoryId === category.id ? 'active' : ''}`}
              onClick={() => handleCategorySelect(category.id)}
            >
              <span className="category-name">{category.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Panel - Thumbnail Grid */}
      <div className="thumbnails-panel">
        <div className="panel-header">
          <div className="thumbnails-info">
            <span className="image-count">{categories.find(cat => cat.id === selectedCategoryId)?.name} {filteredImages.length}</span>
          </div>
        </div>
        <div className="thumbnails-grid">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className={`thumbnail-item ${selectedImage?.id === image.id ? 'selected' : ''}`}
              onClick={() => handleImageSelect(image.id)}
            >
              <div className="thumbnail-image">
                <img src={image.src} alt={image.name} />
              </div>
              <div className="thumbnail-info">
                <span className="image-name">{image.name}</span>
                <span className="image-details">{image.format || 'JPG 1:1'}</span>
                <span className="image-size">{image.fileSize || '546.5 KB'} | {image.timestamp || '04/10/2025 | 14:54:23'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Full Image Viewer */}
      <div className="viewer-panel">
        {selectedImage ? (
          <div className="image-viewer">
            <div className="viewer-image">
              <img src={selectedImage.src} alt={selectedImage.name} />
            </div>
            <div className="viewer-info">
              <h4>{selectedImage.name}</h4>
            </div>
          </div>
        ) : (
          <div className="viewer-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">🖼️</div>
              <h4>Select an Image</h4>
              <p>Choose an image from the gallery to view it here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImagingViewer