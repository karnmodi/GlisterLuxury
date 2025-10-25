'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MaterialMaster } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface SizeOption {
  sizeMM: number
  additionalCost: number
  isOptional: boolean
}

interface Material {
  materialID: string
  name: string
  basePrice: number
  sizeOptions: SizeOption[]
}

interface MaterialConfigSectionProps {
  materials: Material[]
  onChange: (materials: Material[]) => void
  availableMaterials: MaterialMaster[]
}

export default function MaterialConfigSection({ 
  materials, 
  onChange, 
  availableMaterials 
}: MaterialConfigSectionProps) {
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [selectedMaterialId, setSelectedMaterialId] = useState('')

  const addMaterial = () => {
    if (!selectedMaterialId) return
    
    const materialMaster = availableMaterials.find(m => m._id === selectedMaterialId)
    if (!materialMaster) return

    // Check if material is already added
    if (materials.some(m => m.materialID === selectedMaterialId)) {
      alert('This material is already added to the product')
      return
    }

    const newMaterial: Material = {
      materialID: selectedMaterialId, // This should be a string ID
      name: materialMaster.name,
      basePrice: 0,
      sizeOptions: []
    }

    onChange([...materials, newMaterial])
    setSelectedMaterialId('')
    setShowAddMaterial(false)
  }

  const removeMaterial = (index: number) => {
    const newMaterials = materials.filter((_, i) => i !== index)
    onChange(newMaterials)
  }

  const updateMaterial = (index: number, field: keyof Material, value: any) => {
    const newMaterials = [...materials]
    newMaterials[index] = { ...newMaterials[index], [field]: value }
    onChange(newMaterials)
  }

  const addSizeOption = (materialIndex: number) => {
    const newMaterials = [...materials]
    newMaterials[materialIndex].sizeOptions.push({
      sizeMM: 0,
      additionalCost: 0,
      isOptional: true
    })
    onChange(newMaterials)
  }

  const removeSizeOption = (materialIndex: number, sizeIndex: number) => {
    const newMaterials = [...materials]
    newMaterials[materialIndex].sizeOptions.splice(sizeIndex, 1)
    onChange(newMaterials)
  }

  const updateSizeOption = (materialIndex: number, sizeIndex: number, field: keyof SizeOption, value: any) => {
    const newMaterials = [...materials]
    newMaterials[materialIndex].sizeOptions[sizeIndex] = {
      ...newMaterials[materialIndex].sizeOptions[sizeIndex],
      [field]: value
    }
    onChange(newMaterials)
  }

  const availableMaterialsToAdd = availableMaterials.filter(
    material => !materials.some(m => m.materialID === material._id)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-charcoal">Materials & Pricing</h3>
          <p className="text-sm text-charcoal/60">Configure materials, base prices, and size options</p>
        </div>
        <Button
          onClick={() => setShowAddMaterial(true)}
          disabled={availableMaterialsToAdd.length === 0}
          size="sm"
          className="px-4 py-2 bg-brass text-white hover:bg-brass/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Material
          </span>
        </Button>
      </div>

      {/* Add Material Modal */}
      <AnimatePresence>
        {showAddMaterial && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-br from-brass/5 to-cream/20 rounded-lg p-6 border border-brass/20 shadow-sm"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Select Material to Add
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-brass/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300 text-charcoal"
                >
                  <option value="">Choose a material...</option>
                  {availableMaterialsToAdd.map((material) => (
                    <option key={material._id} value={material._id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => {
                    setShowAddMaterial(false)
                    setSelectedMaterialId('')
                  }}
                  variant="ghost"
                  size="sm"
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addMaterial}
                  disabled={!selectedMaterialId}
                  size="sm"
                  className="px-6 py-2 bg-brass text-white hover:bg-brass/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Material
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Materials List */}
      <div className="space-y-4">
        <AnimatePresence>
          {materials.map((material, materialIndex) => (
            <motion.div
              key={`${material.materialID}-${materialIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg border border-brass/20 p-6 shadow-sm"
            >
              {/* Material Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brass/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal">{material.name}</h4>
                    <p className="text-sm text-charcoal/60">Material configuration</p>
                  </div>
                </div>
                <Button
                  onClick={() => removeMaterial(materialIndex)}
                  variant="danger"
                  size="sm"
                  className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>

              {/* Base Price */}
              <div className="mb-4">
                <Input
                  label="Base Price *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={material.basePrice}
                  onChange={(e) => updateMaterial(materialIndex, 'basePrice', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Size Options */}
              <div className="border-t border-brass/20 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-charcoal">Size Options</h5>
                  <Button
                    onClick={() => addSizeOption(materialIndex)}
                    variant="secondary"
                    size="sm"
                    className="px-3 py-1.5 bg-brass/10 text-brass hover:bg-brass/20 border border-brass/30"
                  >
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Size
                    </span>
                  </Button>
                </div>

                {material.sizeOptions.length === 0 ? (
                  <div className="text-center py-6 text-charcoal/40 bg-cream/30 rounded-lg border border-brass/10">
                    <svg className="w-8 h-8 mx-auto mb-2 text-brass/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    <p className="text-sm">No size options configured</p>
                    <p className="text-xs text-charcoal/40">Add size options to allow customers to choose different sizes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {material.sizeOptions.map((sizeOption, sizeIndex) => (
                      <motion.div
                        key={sizeIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 p-3 bg-cream/30 rounded-lg border border-brass/10"
                      >
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <Input
                            label="Size (MM)"
                            type="number"
                            min="0"
                            value={sizeOption.sizeMM}
                            onChange={(e) => updateSizeOption(materialIndex, sizeIndex, 'sizeMM', parseInt(e.target.value) || 0)}
                            placeholder="e.g., 150"
                          />
                          <Input
                            label="Additional Cost"
                            type="number"
                            step="0.01"
                            min="0"
                            value={sizeOption.additionalCost}
                            onChange={(e) => updateSizeOption(materialIndex, sizeIndex, 'additionalCost', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={sizeOption.isOptional}
                                onChange={(e) => updateSizeOption(materialIndex, sizeIndex, 'isOptional', e.target.checked)}
                                className="w-4 h-4 rounded border-brass/30 text-brass focus:ring-brass"
                              />
                              Optional
                            </label>
                          </div>
                        </div>
                        <Button
                          onClick={() => removeSizeOption(materialIndex, sizeIndex)}
                          variant="danger"
                          size="sm"
                          className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {materials.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-cream/30 to-white rounded-lg border-2 border-dashed border-brass/30">
          <svg className="w-16 h-16 mx-auto mb-4 text-brass/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="text-lg font-medium text-charcoal mb-2">No Materials Added</h3>
          <p className="text-charcoal/60 mb-4">Add materials to configure pricing and size options</p>
          <Button 
            onClick={() => setShowAddMaterial(true)}
            className="px-6 py-3 bg-brass text-white hover:bg-brass/90 shadow-lg"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add First Material
            </span>
          </Button>
        </div>
      )}

      {/* Summary */}
      {materials.length > 0 && (
        <div className="bg-gradient-to-r from-brass/5 to-cream/20 rounded-lg p-4 border border-brass/20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-charcoal/60">Materials configured:</span>
              <span className="font-medium text-charcoal">{materials.length}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-charcoal/60">Total size options:</span>
              <span className="font-medium text-charcoal">
                {materials.reduce((sum, material) => sum + material.sizeOptions.length, 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
