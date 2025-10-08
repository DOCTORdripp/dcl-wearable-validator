// src/components/FileDrop.tsx

import React, { useCallback, useState } from 'react';
import { useStore } from '../state/useStore';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { analyzeModel } from '../lib/gltfUtils';

const FileDrop: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { 
    setFile, 
    setModel, 
    setModelStats, 
    setLoading, 
    setError,
    file 
  } = useStore();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.glb') && 
        !file.name.toLowerCase().endsWith('.gltf')) {
      setError('Please select a .glb or .gltf file');
      return;
    }

    setLoading(true);
    setError(null);
    setFile(file);

    try {
      const loader = new GLTFLoader();
      const arrayBuffer = await file.arrayBuffer();
      const gltf = await loader.parseAsync(arrayBuffer, '');
      
      setModel(gltf.scene);
      
      // Analyze the model
      const stats = analyzeModel(gltf.scene, file.size);
      setModelStats(stats);
      
    } catch (error) {
      console.error('Error loading model:', error);
      setError(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [setFile, setModel, setModelStats, setLoading, setError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0]) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-16 text-center transition-colors w-[calc(100%-2rem)] h-[calc(100%-2rem)] flex items-center justify-center m-4
        ${isDragOver 
          ? 'border-blue-500 bg-blue-900/20' 
          : 'border-gray-600 hover:border-gray-500'
        }
        ${file ? 'border-green-500 bg-green-900/20' : ''}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept=".glb,.gltf"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="space-y-6">
        <div className="text-6xl">
          {file ? '📁' : '📂'}
        </div>
        
        <div>
          <h3 className="text-2xl font-medium text-white mb-3">
            {file ? file.name : 'Drop your GLB/GLTF file here'}
          </h3>
          <p className="text-lg text-gray-300">
            {file 
              ? 'Click to select a different file' 
              : 'or click to browse files'
            }
          </p>
        </div>
        
        {file && (
          <div className="text-lg text-green-400 font-medium">
            ✓ File loaded successfully
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDrop;
