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
    <div className="space-y-3">
      {/* Header with inline add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-charcoal">Materials & Pricing</h3>
        <button
          onClick={() => setShowAddMaterial(!showAddMaterial)}
          disabled={availableMaterialsToAdd.length === 0}
          className="px-2 py-1 text-xs bg-brass text-white hover:bg-brass/90 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      {/* Inline Add Material Form */}
      <AnimatePresence>
        {showAddMaterial && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-cream/20 rounded-md p-2 border border-brass/20"
          >
            <div className="flex gap-2">
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
              >
                <option value="">Choose a material...</option>
                {availableMaterialsToAdd.map((material) => (
                  <option key={material._id} value={material._id}>
                    {material.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setShowAddMaterial(false)
                  setSelectedMaterialId('')
                }}
                className="px-2 py-1 text-xs text-charcoal/60 hover:text-charcoal border border-brass/30 rounded"
              >
                Cancel
              </button>
              <button
                onClick={addMaterial}
                disabled={!selectedMaterialId}
                className="px-3 py-1 text-xs bg-brass text-white hover:bg-brass/90 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Materials List */}
      <div className="space-y-2">
        <AnimatePresence>
          {materials.map((material, materialIndex) => (
            <motion.div
              key={`${material.materialID}-${materialIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-md border border-brass/20 p-3"
            >
              {/* Material Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-brass/20 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h4 className="text-xs font-semibold text-charcoal">{material.name}</h4>
                </div>
                <button
                  onClick={() => removeMaterial(materialIndex)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 rounded"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Base Price */}
              <div className="mb-2">
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
              <div className="border-t border-brass/20 pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-medium text-charcoal">Size Options</h5>
                  <button
                    onClick={() => addSizeOption(materialIndex)}
                    className="px-2 py-1 text-xs bg-brass/10 text-brass hover:bg-brass/20 border border-brass/30 rounded flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                </div>

                {material.sizeOptions.length === 0 ? (
                  <div className="text-center py-3 text-charcoal/40 bg-cream/20 rounded border border-brass/10">
                    <svg className="w-6 h-6 mx-auto mb-1 text-brass/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    <p className="text-[10px]">No size options</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {material.sizeOptions.map((sizeOption, sizeIndex) => (
                      <motion.div
                        key={sizeIndex}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 p-2 bg-cream/20 rounded border border-brass/10"
                      >
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Input
                            label="Size (MM)"
                            type="number"
                            min="0"
                            value={sizeOption.sizeMM}
                            onChange={(e) => updateSizeOption(materialIndex, sizeIndex, 'sizeMM', parseInt(e.target.value) || 0)}
                            placeholder="150"
                          />
                          <Input
                            label="Extra Cost"
                            type="number"
                            step="0.01"
                            min="0"
                            value={sizeOption.additionalCost}
                            onChange={(e) => updateSizeOption(materialIndex, sizeIndex, 'additionalCost', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                          <div className="flex items-center">
                            <label className="flex items-center gap-1 text-xs">
                              <input
                                type="checkbox"
                                checked={sizeOption.isOptional}
                                onChange={(e) => updateSizeOption(materialIndex, sizeIndex, 'isOptional', e.target.checked)}
                                className="w-3 h-3 rounded border-brass/30 text-brass focus:ring-brass"
                              />
                              Optional
                            </label>
                          </div>
                        </div>
                        <button
                          onClick={() => removeSizeOption(materialIndex, sizeIndex)}
                          className="px-1.5 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 rounded"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
        <div className="text-center py-8 bg-cream/20 rounded-md border border-dashed border-brass/30">
          <svg className="w-10 h-10 mx-auto mb-2 text-brass/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="text-xs font-medium text-charcoal mb-1">No Materials Added</h3>
          <p className="text-[10px] text-charcoal/60 mb-3">Add materials to configure pricing</p>
          <button 
            onClick={() => setShowAddMaterial(true)}
            className="px-4 py-1.5 text-xs bg-brass text-white hover:bg-brass/90 rounded inline-flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Material
          </button>
        </div>
      )}
    </div>
  )
}
