'use client'

import { useState, useEffect } from 'react'
import { materialsApi, finishesApi } from '@/lib/api'
import type { MaterialMaster, Finish } from '@/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function AdminMaterialsFinishesPage() {
  const [materials, setMaterials] = useState<MaterialMaster[]>([])
  const [finishes, setFinishes] = useState<Finish[]>([])
  const [loading, setLoading] = useState(true)
  
  // Material states
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<MaterialMaster | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialMaster | null>(null)
  const [materialFormData, setMaterialFormData] = useState({
    name: '',
    description: '',
  })
  
  // Finish states
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)
  const [editingFinish, setEditingFinish] = useState<Finish | null>(null)
  const [selectedFinish, setSelectedFinish] = useState<Finish | null>(null)
  const [finishFormData, setFinishFormData] = useState({
    name: '',
    description: '',
    color: '',
  })
  const [finishImage, setFinishImage] = useState<File | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [materialsData, finishesData] = await Promise.all([
        materialsApi.getAll(),
        finishesApi.getAll(),
      ])
      setMaterials(materialsData)
      setFinishes(finishesData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      alert('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Material handlers
  const openMaterialCreateModal = () => {
    setEditingMaterial(null)
    setMaterialFormData({ name: '', description: '' })
    setIsMaterialModalOpen(true)
  }

  const openMaterialEditModal = (material: MaterialMaster) => {
    setEditingMaterial(material)
    setMaterialFormData({
      name: material.name,
      description: material.description || '',
    })
    setIsMaterialModalOpen(true)
  }

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let updatedMaterial: MaterialMaster | null = null
      if (editingMaterial) {
        updatedMaterial = await materialsApi.update(editingMaterial._id, materialFormData)
      } else {
        updatedMaterial = await materialsApi.create(materialFormData)
      }
      setIsMaterialModalOpen(false)
      await fetchData()
      // Update selected material if it matches the saved one
      if (selectedMaterial && editingMaterial && selectedMaterial._id === editingMaterial._id) {
        const refreshedMaterial = materials.find(m => m._id === editingMaterial._id)
        if (refreshedMaterial) {
          setSelectedMaterial(refreshedMaterial)
        } else if (updatedMaterial) {
          setSelectedMaterial(updatedMaterial)
        }
      }
    } catch (error) {
      console.error('Failed to save material:', error)
      alert('Failed to save material')
    }
  }

  const handleMaterialDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return
    
    try {
      await materialsApi.delete(id)
      fetchData()
      if (selectedMaterial?._id === id) {
        setSelectedMaterial(null)
      }
    } catch (error) {
      console.error('Failed to delete material:', error)
      alert('Failed to delete material')
    }
  }

  // Finish handlers
  const openFinishCreateModal = () => {
    setEditingFinish(null)
    setFinishFormData({ name: '', description: '', color: '' })
    setFinishImage(null)
    setIsFinishModalOpen(true)
  }

  const openFinishEditModal = (finish: Finish) => {
    setEditingFinish(finish)
    setFinishFormData({
      name: finish.name,
      description: finish.description || '',
      color: finish.color || '',
    })
    setFinishImage(null)
    setIsFinishModalOpen(true)
  }

  const handleFinishSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let finish: Finish
      if (editingFinish) {
        finish = await finishesApi.update(editingFinish._id, finishFormData)
      } else {
        finish = await finishesApi.create(finishFormData)
      }
      
      // Upload image if provided
      if (finishImage && finish._id) {
        await finishesApi.uploadImage(finish._id, finishImage)
      }
      
      setIsFinishModalOpen(false)
      await fetchData()
      // Update selected finish if it matches the saved one
      if (selectedFinish && editingFinish && selectedFinish._id === editingFinish._id) {
        const refreshedFinish = finishes.find(f => f._id === editingFinish._id)
        if (refreshedFinish) {
          setSelectedFinish(refreshedFinish)
        } else if (finish) {
          setSelectedFinish(finish)
        }
      }
    } catch (error) {
      console.error('Failed to save finish:', error)
      alert('Failed to save finish')
    }
  }

  const handleFinishDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this finish?')) return
    
    try {
      await finishesApi.delete(id)
      fetchData()
      if (selectedFinish?._id === id) {
        setSelectedFinish(null)
      }
    } catch (error) {
      console.error('Failed to delete finish:', error)
      alert('Failed to delete finish')
    }
  }

  const handleFinishImageDelete = async (finishId: string) => {
    if (!confirm('Delete this image?')) return
    
    try {
      await finishesApi.deleteImage(finishId)
      fetchData()
    } catch (error) {
      console.error('Failed to delete image:', error)
      alert('Failed to delete image')
    }
  }

  if (loading && materials.length === 0 && finishes.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-brass border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-charcoal/60 text-xs">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-90px)] lg:h-[calc(100vh-90px)] flex flex-col gap-2 overflow-hidden">
      {/* Compact Header with Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-lg px-3 py-2 shadow border border-brass/20 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <h1 className="text-base sm:text-lg font-serif font-bold text-charcoal">Materials & Finishes</h1>
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="flex items-center gap-1 bg-brass/10 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-brass" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span className="font-semibold text-charcoal">{materials.length} Materials</span>
            </span>
            <span className="flex items-center gap-1 bg-olive/10 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-olive" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-charcoal">{finishes.length} Finishes</span>
            </span>
          </div>
        </div>
      </div>

      {/* Split Pane Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 overflow-hidden min-h-0">
        {/* Left Panel - Materials */}
        <div className="w-full lg:w-1/2 h-[50vh] lg:h-auto bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xs font-semibold">MATERIALS</h2>
            <button
              onClick={openMaterialCreateModal}
              className="text-[10px] bg-brass text-white px-2 py-0.5 rounded hover:bg-brass/90 transition-colors"
            >
              + Add
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {materials.length === 0 ? (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p>No materials yet</p>
                  <button
                    onClick={openMaterialCreateModal}
                    className="text-brass hover:underline text-xs mt-2"
                  >
                    Add first material
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {materials.map((material) => (
                  <div
                    key={material._id}
                    className={`group p-2 rounded hover:bg-brass/10 transition-all border cursor-pointer ${
                      selectedMaterial?._id === material._id ? 'bg-brass/10 border-brass/30' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedMaterial(material)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-charcoal text-xs truncate">{material.name}</p>
                        {material.description && (
                          <p className="text-[10px] text-charcoal/60 mt-0.5 line-clamp-2">{material.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openMaterialEditModal(material)
                          }}
                          className="p-1 hover:bg-brass/10 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3 h-3 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMaterialDelete(material._id)
                          }}
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Finishes */}
        <div className="w-full lg:w-1/2 h-[50vh] lg:h-auto bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xs font-semibold">FINISHES</h2>
            <button
              onClick={openFinishCreateModal}
              className="text-[10px] bg-brass text-white px-2 py-0.5 rounded hover:bg-brass/90 transition-colors"
            >
              + Add
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {finishes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <p>No finishes yet</p>
                  <button
                    onClick={openFinishCreateModal}
                    className="text-brass hover:underline text-xs mt-2"
                  >
                    Add first finish
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {finishes.map((finish) => (
                  <div
                    key={finish._id}
                    className={`group p-2 rounded hover:bg-brass/10 transition-all border cursor-pointer ${
                      selectedFinish?._id === finish._id ? 'bg-brass/10 border-brass/30' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedFinish(finish)}
                  >
                    <div className="flex items-start gap-2">
                      {/* Preview */}
                      <div className="flex-shrink-0">
                        {finish.photoURL ? (
                          <img
                            src={finish.photoURL}
                            alt={finish.name}
                            className="w-10 h-10 object-cover rounded border border-brass/30"
                          />
                        ) : finish.color ? (
                          <div
                            className="w-10 h-10 rounded border border-brass/30"
                            style={{ backgroundColor: finish.color }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded border border-brass/30 bg-cream/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-brass/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-charcoal text-xs truncate">{finish.name}</p>
                        {finish.description && (
                          <p className="text-[10px] text-charcoal/60 mt-0.5 line-clamp-2">{finish.description}</p>
                        )}
                        {finish.color && (
                          <p className="text-[9px] text-charcoal/40 mt-0.5 font-mono">{finish.color}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {finish.photoURL && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFinishImageDelete(finish._id)
                            }}
                            className="p-1 hover:bg-orange-50 rounded transition-colors"
                            title="Delete Image"
                          >
                            <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openFinishEditModal(finish)
                          }}
                          className="p-1 hover:bg-brass/10 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3 h-3 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleFinishDelete(finish._id)
                          }}
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Material Modal */}
      <Modal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        title={editingMaterial ? 'Edit Material' : 'New Material'}
        size="sm"
      >
        <form onSubmit={handleMaterialSubmit} className="space-y-3">
          <Input
            label="Material Name *"
            value={materialFormData.name}
            onChange={(e) => setMaterialFormData({ ...materialFormData, name: e.target.value })}
            required
            placeholder="e.g., Brass, Stainless Steel"
          />

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">Description</label>
            <textarea
              value={materialFormData.description}
              onChange={(e) => setMaterialFormData({ ...materialFormData, description: e.target.value })}
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
              rows={2}
              placeholder="Describe this material..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brass/20">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsMaterialModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {editingMaterial ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Finish Modal */}
      <Modal
        isOpen={isFinishModalOpen}
        onClose={() => setIsFinishModalOpen(false)}
        title={editingFinish ? 'Edit Finish' : 'New Finish'}
        size="sm"
      >
        <form onSubmit={handleFinishSubmit} className="space-y-3">
          <Input
            label="Finish Name *"
            value={finishFormData.name}
            onChange={(e) => setFinishFormData({ ...finishFormData, name: e.target.value })}
            required
            placeholder="e.g., Polished, Matte Black"
          />

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">Description</label>
            <textarea
              value={finishFormData.description}
              onChange={(e) => setFinishFormData({ ...finishFormData, description: e.target.value })}
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
              rows={2}
              placeholder="Describe this finish..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                label="Color (hex)"
                value={finishFormData.color}
                onChange={(e) => setFinishFormData({ ...finishFormData, color: e.target.value })}
                placeholder="#C9A66B"
              />
            </div>
            <div className="flex items-end">
              {finishFormData.color && (
                <div
                  className="w-full h-8 rounded border border-brass/30"
                  style={{ backgroundColor: finishFormData.color }}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">Image Upload</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFinishImage(e.target.files?.[0] || null)}
              className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-brass file:text-white hover:file:bg-brass/90"
            />
            {editingFinish?.photoURL && (
              <p className="text-[10px] text-olive mt-1">Current image will be replaced if new image is uploaded</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brass/20">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsFinishModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {editingFinish ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
